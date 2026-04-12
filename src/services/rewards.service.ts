import { supabase } from '@/integrations/supabase/client';
import { creditWallet } from './wallet.service';

export type EventType = 'SIGNUP' | 'FIRST_RECHARGE' | 'REFERRAL' | 'SPIN_WHEEL' | 'GAME' | 'FAMILY_MEMBER' | 'CASHBACK_POINTS' | 'MANUAL' | 'REDEEM';

export interface RewardPointsLedger {
  id: string;
  user_id: string;
  points: number;
  event_type: EventType;
  description: string;
  created_at: string;
}

export interface ScratchCard {
  id: string;
  user_id: string;
  type: 'GIFT_VOUCHER' | 'REWARD_POINTS' | 'CASHBACK' | 'PROMO_CODE' | 'OFFER';
  status: 'LOCKED' | 'UNLOCKED' | 'SCRATCHED';
  title: string;
  description: string;
  reward_value: number;
  promo_code?: string; // For Hubble codes
  offer_url?: string; // For Hubble offers
  min_recharge_threshold: number;
  created_at: string;
  updated_at: string;
}

/**
 * Check if a user can spin today (Rolling 24-hour window)
 */
export async function canUserSpinToday(userId: string): Promise<boolean> {
  const lastTime = await getLastSpinTimestamp(userId);
  if (!lastTime) return true;
  
  const lastSpin = new Date(lastTime).getTime();
  const nextAvailable = lastSpin + (24 * 60 * 60 * 1000);
  return Date.now() >= nextAvailable;
}

/**
 * Get the timestamp of the last spin
 */
export async function getLastSpinTimestamp(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('reward_points_ledger' as never)
      .select('created_at')
      .eq('user_id', userId)
      .eq('event_type', 'SPIN_WHEEL')
      .order('created_at', { ascending: false })
      .limit(1);
  
    if (error || !data || data.length === 0) return null;
    return (data[0] as any).created_at;
}

/**
 * Get total reward points for a user
 */
export async function getUserTotalPoints(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('reward_points_ledger' as never)
    .select('points')
    .eq('user_id', userId);

  if (error || !data) return 0;

  return data.reduce((sum: number, row: any) => sum + Number(row.points), 0);
}

/**
 * Add points to a user
 */
export async function addRewardPoints(
  userId: string,
  points: number,
  eventType: EventType,
  description: string
): Promise<boolean> {
  const { error } = await supabase
    .from('reward_points_ledger' as never)
    .insert({
      user_id: userId,
      points,
      event_type: eventType,
      description,
    } as never);

  return !error;
}

/**
 * Get recent points transactions
 */
export async function getPointsHistory(userId: string, limit = 20): Promise<RewardPointsLedger[]> {
  const { data, error } = await supabase
    .from('reward_points_ledger' as never)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as unknown as RewardPointsLedger[];
}

/**
 * Get user's scratch cards
 */
export async function getUserScratchCards(userId: string): Promise<ScratchCard[]> {
  const { data, error } = await supabase
    .from('scratch_cards' as never)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as unknown as ScratchCard[];
}

/**
 * Unlock a scratch card if recharge threshold is met
 */
export async function unlockEligibleScratchCards(userId: string, rechargeAmount: number): Promise<void> {
  const { data: cards } = await supabase
    .from('scratch_cards' as never)
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'LOCKED')
    .lte('min_recharge_threshold', rechargeAmount);

  if (!cards || cards.length === 0) return;

  for (const card of cards as any[]) {
    await supabase
      .from('scratch_cards' as never)
      .update({ status: 'UNLOCKED' } as never)
      .eq('id', card.id);
  }
}

export async function claimScratchCard(userId: string, cardId: string): Promise<boolean> {
  // If this is a demo card, don't hit the database
  if (cardId.startsWith('demo-')) {
    return true; 
  }

  // First verify card belongs to user and is unlocked
  const { data: cards, error: fetchError } = await supabase
    .from('scratch_cards' as never)
    .select('*')
    .eq('id', cardId)
    .eq('user_id', userId)
    .eq('status', 'UNLOCKED');

  if (fetchError || !cards || cards.length === 0) return false;

  const scratchCard = cards[0] as unknown as ScratchCard;

  // Mark as scratched
  const { error: updateError } = await supabase
    .from('scratch_cards' as never)
    .update({ status: 'SCRATCHED' } as never)
    .eq('id', cardId);

  if (updateError) return false;

  // Grant the reward based on type
  if (scratchCard.type === 'REWARD_POINTS') {
    await addRewardPoints(userId, scratchCard.reward_value, 'GAME', `Won from Scratch Card: ${scratchCard.title}`);
  } else if (scratchCard.type === 'CASHBACK') {
    // Add to wallet ledger and update balance
    // This logic handles granting wallet credit
    const { data: walletData } = await supabase
      .from('wallets' as never)
      .select('id, balance')
      .eq('user_id', userId);

    if (walletData && walletData.length > 0) {
      const wallet = walletData[0] as any;
      const newBalance = Number(wallet.balance) + scratchCard.reward_value;
      await supabase
        .from('wallets' as never)
        .update({ balance: newBalance } as never)
        .eq('user_id', userId);
        
      await supabase
        .from('wallet_ledger' as never)
        .insert({
          wallet_id: wallet.id,
          type: 'CREDIT',
          amount: scratchCard.reward_value,
          balance_after: newBalance,
          description: `Cashback from Scratch Card: ${scratchCard.title}`,
        } as never);
    }
  }

  return true;
}

/**
 * Handle First Recharge Cashback Check
 */
export async function handleCashbackOffer(userId: string, amount: number, transactionId: string): Promise<void> {
  // Basic example of a First Recharge cashback logic.
  // In a real scenario, we check if they have previous transactions.
  const { count } = await supabase
    .from('transactions' as never)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'SUCCESS');

  // If this is the first successful recharge, and amount > 100
  if (count === 1 && amount >= 100) {
    const cashbackAmount = amount * 0.1; // 10% cashback
    
    const { data: walletData } = await supabase
      .from('wallets' as never)
      .select('id, balance')
      .eq('user_id', userId);

    if (walletData && walletData.length > 0) {
      const wallet = walletData[0] as any;
      const newBalance = Number(wallet.balance) + cashbackAmount;
      await supabase
        .from('wallets' as never)
        .update({ balance: newBalance } as never)
        .eq('user_id', userId);
        
      await supabase
        .from('wallet_ledger' as never)
        .insert({
          wallet_id: wallet.id,
          transaction_id: transactionId,
          type: 'CREDIT',
          amount: cashbackAmount,
          balance_after: newBalance,
          description: `First Recharge Cashback (10%)`,
        } as never);
    }
  }
}
/**
 * Initialize a welcome scratch card for new users
 */
export async function initializeWelcomeCard(userId: string): Promise<void> {
  // Check if they already have any cards
  const { count } = await supabase
    .from('scratch_cards' as never)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (count === 0) {
    // Inject first welcome card
    await supabase
      .from('scratch_cards' as never)
      .insert({
        user_id: userId,
        title: 'Welcome Bonus',
        type: 'REWARD_POINTS',
        reward_value: 200,
        status: 'UNLOCKED',
        description: 'Exclusive reward for joining Pre-pe!'
      } as never);
  }
}

export async function getUserStreak(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('reward_points_ledger' as never)
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data || data.length === 0) return 0;

  const uniqueDays = Array.from(new Set(
    data.map((row: any) => {
      const d = new Date(row.created_at);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  ));

  uniqueDays.sort((a, b) => b - a);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayTime = yesterday.getTime();

  let streak = 0;
  let lastTime: number;

  if (uniqueDays[0] === todayTime) {
    streak = 1;
    lastTime = todayTime;
  } else if (uniqueDays[0] === yesterdayTime) {
    streak = 1;
    lastTime = yesterdayTime;
  } else {
    return 0;
  }

  for (let i = 1; i < uniqueDays.length; i++) {
    const expectedTime = lastTime - (24 * 60 * 60 * 1000);
    if (uniqueDays[i] === expectedTime) {
      streak++;
      lastTime = expectedTime;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Redeem points for wallet balance
 * 1000 Points = 10 Rupees
 */
export async function redeemRewardPoints(
  userId: string,
  pointsToRedeem: number
): Promise<{ success: boolean; amount?: number; error?: string }> {
  if (pointsToRedeem < 1000) {
    return { success: false, error: "Minimum 1000 points required to redeem." };
  }

  const currentPoints = await getUserTotalPoints(userId);
  if (currentPoints < pointsToRedeem) {
    return { success: false, error: "Insufficient points." };
  }

  // Calculate multiples of 1000
  const multiples = Math.floor(pointsToRedeem / 1000);
  const totalPointsUsed = multiples * 1000;
  const cashbackAmount = multiples * 10;

  // 1. Deduct points
  const { error: pointsError } = await supabase
    .from('reward_points_ledger' as never)
    .insert({
      user_id: userId,
      points: -totalPointsUsed,
      event_type: 'REDEEM',
      description: `Redeemed ${totalPointsUsed} points for ₹${cashbackAmount} wallet balance`,
    } as never);

  if (pointsError) {
    console.error("Points Deduction Error:", pointsError);
    return { success: false, error: "Failed to deduct points." };
  }

  // 2. Add to wallet
  const walletSuccess = await creditWallet(
    userId,
    cashbackAmount,
    `Redeemed from Reward Points (${totalPointsUsed} pts)`
  );

  if (!walletSuccess) {
    // Note: In production, you'd want a compensation transaction here or a db transaction
    return { success: false, error: "Points deducted but failed to update wallet. Contact support." };
  }

  return { success: true, amount: cashbackAmount };
}

