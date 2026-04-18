// Generic API Response Contract - All services must follow this format
export interface ApiResponse<T = unknown> {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  transaction_id: string;
  message: string;
  data: T;
}

// Operator Types
export interface Operator {
  id: string;
  name: string;
  code: string;
  type: 'prepaid' | 'postpaid' | 'dth';
  logo?: string;
}

// Circle/Region Types
export interface Circle {
  id: string;
  name: string;
  code: string;
}

// Recharge Plan Types
export interface RechargePlan {
  id: string;
  operator_id: string;
  amount: number;
  validity: string;
  description: string;
  data?: string;
  talktime?: string;
  category: 'topup' | 'data' | 'combo' | 'unlimited' | 'special';
}

// Offer Types
export interface Offer {
  id: string;
  title: string;
  description: string;
  discount_amount?: number;
  discount_percent?: number;
  code: string;
  valid_until: string;
  min_amount?: number;
  operator_id?: string;
}

// Transaction Types
export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type TransactionType = 'RECHARGE' | 'BILL_PAYMENT' | 'WALLET_CREDIT' | 'WALLET_DEBIT' | 'REFUND';
export type ServiceType = 'MOBILE_PREPAID' | 'MOBILE_POSTPAID' | 'DTH' | 'WALLET';

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  service_type: ServiceType;
  amount: number;
  status: TransactionStatus;
  operator_id?: string;
  operator_name?: string;
  mobile_number?: string;
  dth_id?: string;
  reference_id?: string;
  api_transaction_id?: string;
  commission?: number;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
  diagnostic?: {
    suggestion?: string;
    error_code?: string;
    gate_message?: string;
  };
}

// Wallet Types
export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  locked_balance: number;
  created_at: string;
  updated_at: string;
}

export interface WalletLedger {
  id: string;
  wallet_id: string;
  transaction_id?: string;
  type: 'CREDIT' | 'DEBIT' | 'LOCK' | 'UNLOCK' | 'REFUND';
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

// Commission Slab Types
export interface CommissionSlab {
  id: string;
  operator_id: string;
  service_type: ServiceType;
  min_amount: number;
  max_amount: number;
  commission_type: 'FLAT' | 'PERCENTAGE';
  commission_value: number;
  is_active: boolean;
}

// Recharge Request Types
export interface RechargeRequest {
  mobile_number?: string;
  dth_id?: string;
  operator_id: string;
  circle_id?: string;
  amount: number;
  plan_id?: string;
  offer_code?: string;
}

// Bill Fetch Types
export interface BillDetails {
  bill_number: string;
  bill_date: string;
  due_date: string;
  amount: number;
  customer_name: string;
  operator_id: string;
  mobile_number: string;
}

// User Profile
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  is_admin: boolean;
  created_at: string;
}
