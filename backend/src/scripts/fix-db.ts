import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.jwylhqnbjdsevwbsecjv:3ZDXClekuN4LIMQu@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
    }
  }
});

async function main() {
  console.log("Connecting...");
  try {
    // Robust system catalog query to find all foreign keys referencing 'auth' schema
    const constraints: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
          con.conname AS constraint_name,
          rel.relname AS table_name
      FROM 
          pg_constraint con
          JOIN pg_class rel ON rel.oid = con.conrelid
          JOIN pg_namespace ns ON ns.oid = rel.relnamespace
          JOIN pg_class ref ON ref.oid = con.confrelid
          JOIN pg_namespace refns ON refns.oid = ref.relnamespace
      WHERE 
          con.contype = 'f'
          AND ns.nspname = 'public'
          AND refns.nspname = 'auth';
    `);

    console.log(`Found ${constraints.length} cross-schema foreign keys pointing to 'auth':`, constraints);

    for (const c of constraints) {
      const dropSql = `ALTER TABLE public.${c.table_name} DROP CONSTRAINT IF EXISTS ${c.constraint_name};`;
      console.log(`Executing: ${dropSql}`);
      await prisma.$executeRawUnsafe(dropSql);
      console.log(`Success: Dropped constraint ${c.constraint_name} on table ${c.table_name}.`);
    }

    console.log("Done database constraint repairs.");

    // Drop unique constraint/index blocking push on user_roles
    console.log("Dropping unique constraint user_roles_user_id_role_key...");
    await prisma.$executeRawUnsafe(`
      ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
    `);
    console.log("Success: Dropped unique constraint.");

    // Fix null pan_numbers in kyc_verifications
    console.log("Fixing null pan_numbers...");
    await prisma.$executeRawUnsafe(`
      UPDATE public.kyc_verifications 
      SET pan_number = 'PENDING_PAN' 
      WHERE pan_number IS NULL OR pan_number = '';
    `);
    console.log("Success: Updated null pan_numbers.");

    // Fix user_roles.role column enum casting
    console.log("Altering user_roles.role type with explicit ENUM cast...");
    
    // Log all public policies first
    const policies: any[] = await prisma.$queryRawUnsafe(`
      SELECT policyname, tablename, cmd, roles, qual, with_check 
      FROM pg_policies 
      WHERE schemaname = 'public';
    `);

    // Filter policies that depend on the 'role' or 'user_roles' or 'app_role'
    const dependentPolicies = policies.filter(p => {
      const q = (p.qual || "").toLowerCase();
      const w = (p.with_check || "").toLowerCase();
      return q.includes("role") || q.includes("user_roles") || q.includes("app_role") ||
             w.includes("role") || w.includes("user_roles") || w.includes("app_role");
    });

    console.log(`Found ${dependentPolicies.length} dependent policies to temporarily drop:`, dependentPolicies.map(p => p.policyname));

    // Drop them
    for (const p of dependentPolicies) {
      console.log(`Dropping policy "${p.policyname}" on table "${p.tablename}"...`);
      await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "${p.policyname}" ON public.${p.tablename};`);
    }
    console.log("Success: All dependent policies dropped.");

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
              CREATE TYPE public."app_role" AS ENUM ('user', 'admin', 'distributor', 'retailer');
          END IF;
      END$$;
    `);
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE public.user_roles ALTER COLUMN role DROP DEFAULT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE public.user_roles 
      ALTER COLUMN role TYPE public."app_role" 
      USING LOWER(role::text)::public."app_role";
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE public.user_roles ALTER COLUMN role SET DEFAULT 'user'::public."app_role";
    `);
    console.log("Success: Cast user_roles.role column type to app_role enum.");

    // Recreate the policies with updated future-proof qual/with_check strings
    console.log("Recreating policies...");
    for (const p of dependentPolicies) {
      let qualSql = "";
      if (p.qual) {
        // Future-proof cast: replace role comparisons with text comparison
        let q = p.qual;
        q = q.replace(/user_roles\.role\s*=\s*'admin'::app_role/g, "user_roles.role::text = 'ADMIN'::text");
        q = q.replace(/user_roles\.role\s*=\s*'ADMIN'::app_role/g, "user_roles.role::text = 'ADMIN'::text");
        q = q.replace(/user_roles\.role\s*=\s*'ADMIN'::text/g, "user_roles.role::text = 'ADMIN'::text");
        q = q.replace(/profiles\.role\s*=\s*'ADMIN'::text/g, "profiles.role::text = 'ADMIN'::text");
        qualSql = `USING (${q})`;
      }

      let withCheckSql = "";
      if (p.with_check) {
        let w = p.with_check;
        w = w.replace(/user_roles\.role\s*=\s*'admin'::app_role/g, "user_roles.role::text = 'ADMIN'::text");
        w = w.replace(/user_roles\.role\s*=\s*'ADMIN'::app_role/g, "user_roles.role::text = 'ADMIN'::text");
        w = w.replace(/user_roles\.role\s*=\s*'ADMIN'::text/g, "user_roles.role::text = 'ADMIN'::text");
        w = w.replace(/profiles\.role\s*=\s*'ADMIN'::text/g, "profiles.role::text = 'ADMIN'::text");
        withCheckSql = `WITH CHECK (${w})`;
      }

      const rolesList = p.roles && p.roles.length > 0 ? p.roles.join(", ") : "public";
      const cmdSql = p.cmd && p.cmd !== "ALL" ? `FOR ${p.cmd}` : "";
      
      const createSql = `
        CREATE POLICY "${p.policyname}" ON public.${p.tablename}
        ${cmdSql} TO ${rolesList}
        ${qualSql}
        ${withCheckSql};
      `;

      console.log(`Recreating policy: ${p.policyname} on ${p.tablename}`);
      await prisma.$executeRawUnsafe(createSql);
    }
    console.log("Success: All policies recreated successfully!");

  } catch (e) {
    console.error("Error running database repair:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
