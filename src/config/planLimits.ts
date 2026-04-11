export type PlanType = 'BASIC' | 'PRO' | 'BUSINESS';

export interface PlanLimits {
  id: PlanType;
  name: string;
  dailyRechargeLimit: number; // Max recharges per day
  dailyWalletAddLimit: number; // Max money added to wallet per day
  maxWalletBalance: number;    // Max allowed balance in wallet
  bnplLimit: number;           // Max borrow amount
  bnplCycleDays: number;       // Repayment days
  features: {
    bnpl: boolean;
    cashback: boolean;
    ads: boolean;
    prioritySupport: boolean;
    bulkTools: boolean;
    rewards: 'BASIC' | 'PREMIUM';
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
    features: {
      bnpl: false,
      cashback: false,
      ads: true,
      prioritySupport: false,
      bulkTools: false,
      rewards: 'BASIC'
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
    features: {
      bnpl: true,
      cashback: true,
      ads: false,
      prioritySupport: true,
      bulkTools: false,
      rewards: 'PREMIUM'
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
    features: {
      bnpl: true,
      cashback: true,
      ads: false,
      prioritySupport: true,
      bulkTools: true,
      rewards: 'PREMIUM'
    }
  }
};

export const getPlanLimits = (planType?: string | null): PlanLimits => {
  const upperType = (planType || 'BASIC').toUpperCase() as PlanType;
  return PLAN_LIMITS[upperType] || PLAN_LIMITS.BASIC;
};
