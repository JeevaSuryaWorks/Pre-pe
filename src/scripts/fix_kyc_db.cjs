const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: "postgresql://postgres.jwylhqnbjdsevwbsecjv:3ZDXClekuN4LIMQu@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
    });

    try {
        await client.connect();
        console.log("Connected to database");
        
        const res = await client.query('ALTER TABLE public.kyc_verifications ALTER COLUMN pan_number DROP NOT NULL;');
        console.log("Success: pan_number is now nullable");
        
    } catch (err) {
        console.error("Error executing query:", err);
    } finally {
        await client.end();
    }
}

run();
