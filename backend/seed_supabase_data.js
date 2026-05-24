const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const seeds = [
  // 1. Seed Plans
  `
  INSERT INTO public.plans (id, name, subtitle, description, price, price_amount, features, is_popular, order_index)
  VALUES 
  ('BASIC', 'Basic Plan', 'Free forever', 'Standard recharge and utility tools with no subscription fees.', 'Free', 0, '["Daily recharge limit: 5", "Standard transaction fees", "Support tickets with standard response time", "Watch ads to earn reward points"]'::jsonb, false, 0),
  ('PRO', 'Pro Plan', '21 days free Trial', 'Perfect for active users looking for cashback discounts and higher monthly limits.', '₹299/mo', 299, '["Unlimited daily recharges", "0.5% Cashback on wallet additions", "Priority support resolution (under 6 hours)", "2x Points from Lucky Spin Wheel", "Early access to promo scratch cards"]'::jsonb, true, 1),
  ('BUSINESS', 'Business Plan', 'Specially for Shops', 'Industrial-grade limits, zero commission overheads, and immediate dedicated support.', '₹999/mo', 999, '["Unlimited daily recharges", "Flat 1.5% cash rebate on all payments", "Immediate dedicated support hotline", "5x Points multiplier on all rewards", "Zero platform surcharge fees"]'::jsonb, false, 2)
  ON CONFLICT (id) DO NOTHING;
  `,

  // 2. Seed Reward Settings
  `
  INSERT INTO public.reward_settings (key, value)
  VALUES
  ('signup_bonus', '{"points": 200, "enabled": true}'::jsonb),
  ('first_recharge', '{"min_amount": 100, "cashback_percent": 10, "max_cashback": 50, "enabled": true}'::jsonb),
  ('redemption', '{"points_per_rupee": 100, "min_points": 1000, "enabled": true}'::jsonb),
  ('ad_reward_config', '{"rewardAmount": 5, "dailyLimit": 3, "cooldownDuration": 30, "enabled": true}'::jsonb),
  ('spin_limit_BASIC', '1'::jsonb),
  ('spin_limit_PRO', '3'::jsonb),
  ('spin_limit_BUSINESS', '10'::jsonb)
  ON CONFLICT (key) DO NOTHING;
  `,

  // 3. Seed Reward Tasks
  `
  INSERT INTO public.rewards_tasks (id, title, description, reward_points, icon_name, requirement_type, requirement_value, button_text, target_url, is_active)
  VALUES
  ('task-kyc', 'Upgrade KYC Status', 'Verify your Aadhaar and PAN documents to unlock unlimited wallet additions and recharges.', 500, 'ShieldCheck', 'KYC', 0, 'Complete KYC', '/profile/kyc', true),
  ('task-first-recharge', 'Complete First Recharge', 'Initiate your very first mobile or utility bill payment of at least ₹100.', 250, 'Zap', 'TRANSACTION', 100, 'Recharge Now', '/services', true),
  ('task-referral', 'Invite 3 Friends', 'Share your referral code. Earn reward points once 3 friends download and register.', 1000, 'Share2', 'REFERRAL', 3, 'Invite Friends', '/profile/refer', true)
  ON CONFLICT (id) DO NOTHING;
  `,

  // 4. Seed Banners
  `
  INSERT INTO public.banners (id, title, subtitle, tag, cta_text, cta_link, grad_from, grad_to, icon_name, status, type, style, sort_order)
  VALUES
  ('banner-01', 'Executive WhatsApp Community', 'Stay priority-connected with exclusive Prepe updates.', 'Community', 'JOIN NOW', 'https://chat.whatsapp.com/', '#064e3b', '#059669', 'MessageCircle', 'published', 'banner', 'card', 1),
  ('banner-02', 'Flipkart Shopping Gift Card', 'Get flat 1.5% instant cashback on all Flipkart vouchers.', 'Shopping', 'BUY NOW', '/services/gift-cards', '#2563eb', '#1d4ed8', 'Gift', 'published', 'banner', 'voucher', 2),
  ('banner-03', 'DTH Recharge Cashback', 'Get 2% instant cashback on all DTH operator recharges today.', 'Cashback', 'RECHARGE DTH', '/services/dth', '#7c3aed', '#4c1d95', 'Tv', 'published', 'banner', 'card', 3),
  ('banner-04', 'Scheduled System Maintenance: May 22, 2 AM - 4 AM IST', 'We will be undergoing brief database improvements.', 'Maintenance', 'MORE INFO', '#', '#b91c1c', '#7f1d1d', 'ShieldAlert', 'published', 'announcement', 'card', 4)
  ON CONFLICT (id) DO NOTHING;
  `,

  // 5. Seed Gift Vouchers
  `
  INSERT INTO public.gift_vouchers (id, name, provider, amount, price, discount, code, "bannerUrl", description)
  VALUES
  ('v1', 'Amazon Prime Shopping Voucher', 'Amazon Pay', 500, 475, 5, 'AMZPRIME500', 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&q=80&w=600', 'Get flat 5% instant cashback on Amazon Pay shopping voucher. Safe, instant, redeemable worldwide.'),
  ('v2', 'Google Play Gift Card', 'Google Play', 250, 240, 4, 'GPLAY250', 'https://images.unsplash.com/photo-1510519138101-570d1dca3d66?auto=format&fit=crop&q=80&w=600', 'Google Play instant prepaid code. Claim game items, books, movies and custom skins instantly.')
  ON CONFLICT (id) DO NOTHING;
  `
];

async function main() {
  try {
    console.log('Seeding Supabase tables with high-fidelity production-ready default records...');
    for (let i = 0; i < seeds.length; i++) {
      try {
        console.log(`Seeding table group ${i + 1}...`);
        await prisma.$executeRawUnsafe(seeds[i]);
      } catch (err) {
        console.error(`Seeding group ${i + 1} failed:`, err.message);
      }
    }
    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Seeding crashed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
