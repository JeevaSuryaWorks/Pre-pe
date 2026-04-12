export type PlanType = 'BASIC' | 'PRO' | 'BUSINESS';

export interface PlanLimits {
  id: PlanType;
  name: string;
  dailyRechargeLimit: number; // Max recharges per day
  dailyWalletAddLimit: number; // Max money added to wallet per day
  maxWalletBalance: number;    // Max allowed balance in wallet
  bnplLimit: number;           // Max borrow amount
  bnplCycleDays: number;       // Repayment days
  commissionMultiplier: number; // Multiplier for earnings
  referralReward: number;      // Amount for referring a user
  features: {
    bnpl: boolean;
    cashback: boolean;
    ads: boolean;
    prioritySupport: boolean;
    bulkTools: boolean;
    rewards: 'BASIC' | 'PREMIUM';
    withdrawalAllowed: boolean;
  };
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  BASIC: {
    id: 'BASIC',
    name: 'Basic Plan',
    dailyRechargeLimit: 5,
    dailyWalletAddLimit: 500,
    maxWalletBalance: 1000,
    bnplLimit: 0,
    bnplCycleDays: 0,
    commissionMultiplier: 1.0,
    referralReward: 0,
    features: {
      bnpl: false,
      cashback: false,
      ads: true,
      prioritySupport: false,
      bulkTools: false,
      rewards: 'BASIC',
      withdrawalAllowed: false
    }
  },
  PRO: {
    id: 'PRO',
    name: 'Pro Plan',
    dailyRechargeLimit: Infinity,
    dailyWalletAddLimit: 10000,
    maxWalletBalance: 25000,
    bnplLimit: 1000,
    bnplCycleDays: 15,
    commissionMultiplier: 1.25,
    referralReward: 20,
    features: {
      bnpl: true,
      cashback: true,
      ads: false,
      prioritySupport: true,
      bulkTools: false,
      rewards: 'PREMIUM',
      withdrawalAllowed: true
    }
  },
  BUSINESS: {
    id: 'BUSINESS',
    name: 'Business Plan',
    dailyRechargeLimit: Infinity,
    dailyWalletAddLimit: Infinity,
    maxWalletBalance: Infinity,
    bnplLimit: 3000,
    bnplCycleDays: 30, // "Flexible" mapped to 30 as default
    commissionMultiplier: 1.5,
    referralReward: 50,
    features: {
      bnpl: true,
      cashback: true,
      ads: false,
      prioritySupport: true,
      bulkTools: true,
      rewards: 'PREMIUM',
      withdrawalAllowed: true
    }
  }
};

export const getPlanLimits = (planType?: string | null, dynamicConfig?: any): PlanLimits => {
  const upperType = (planType || 'BASIC').toUpperCase() as PlanType;
  const baseLimits = PLAN_LIMITS[upperType] || PLAN_LIMITS.BASIC;

  if (dynamicConfig) {
    return {
      ...baseLimits,
      dailyRechargeLimit: dynamicConfig.dailyRechargeLimit ?? baseLimits.dailyRechargeLimit,
      dailyWalletAddLimit: dynamicConfig.dailyWalletAddLimit ?? baseLimits.dailyWalletAddLimit,
      maxWalletBalance: dynamicConfig.maxWalletBalance ?? baseLimits.maxWalletBalance,
      bnplLimit: dynamicConfig.bnplLimit ?? baseLimits.bnplLimit,
      bnplCycleDays: dynamicConfig.bnplCycleDays ?? baseLimits.bnplCycleDays,
      commissionMultiplier: dynamicConfig.commissionMultiplier ?? baseLimits.commissionMultiplier,
      referralReward: dynamicConfig.referralReward ?? baseLimits.referralReward,
      features: {
        ...baseLimits.features,
        ...(dynamicConfig.features || {})
      }
    };
  }

  return baseLimits;
};
