/**
 * Wallet Service - Handles wallet operations
 * Uses explicit types since DB types may not be synced yet
 */

import { supabase } from '@/integrations/supabase/client';
import type { ApiResponse, Transaction } from '@/types/recharge.types';
import { processPayout } from './kwikApiService';

interface WalletRow {
  id: string;
  user_id: string;
  balance: number;
  locked_balance: number;
  created_at: string;
  updated_at: string;
}

interface WalletLedgerRow {
  id: string;
  wallet_id: string;
  transaction_id: string | null;
  type: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

/**
 * Get wallet balance for a user
 */
export async function getWalletBalance(userId: string): Promise<{
  balance: number;
  locked_balance: number;
} | null> {
  const { data, error } = await supabase
    .from('wallets' as never)
    .select('balance, locked_balance')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const wallet = data as unknown as WalletRow;
  return { balance: Number(wallet.balance), locked_balance: Number(wallet.locked_balance) };
}

/**
 * Get full wallet for a user
 */
export async function getWallet(userId: string): Promise<WalletRow | null> {
  const { data, error } = await supabase
    .from('wallets' as never)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as unknown as WalletRow;
}

/**
 * Lock amount for a pending transaction
 */
export async function lockAmount(
  userId: string,
  amount: number,
  transactionId: string
): Promise<boolean> {
  const wallet = await getWallet(userId);

  if (!wallet) {
    return false;
  }

  const availableBalance = Number(wallet.balance) - Number(wallet.locked_balance);

  if (availableBalance < amount) {
    return false;
  }

  const { error: updateError } = await supabase
    .from('wallets' as never)
    .update({
      locked_balance: Number(wallet.locked_balance) + amount,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('user_id', userId);

  if (updateError) {
    return false;
  }

  await addLedgerEntry(wallet.id, transactionId, 'LOCK', amount, Number(wallet.balance), `Amount locked for transaction`);

  return true;
}

/**
 * Confirm debit after successful transaction
 */
export async function confirmDebit(
  userId: string,
  amount: number,
  transactionId: string
): Promise<boolean> {
  const wallet = await getWallet(userId);

  if (!wallet) {
    return false;
  }

  const newBalance = Number(wallet.balance) - amount;
  const newLockedBalance = Number(wallet.locked_balance) - amount;

  const { error: updateError } = await supabase
    .from('wallets' as never)
    .update({
      balance: newBalance,
      locked_balance: Math.max(0, newLockedBalance),
      updated_at: new Date().toISOString(),
    } as never)
    .eq('user_id', userId);

  if (updateError) {
    return false;
  }

  await addLedgerEntry(wallet.id, transactionId, 'DEBIT', amount, newBalance, `Debited for transaction`);

  return true;
}

/**
 * Refund amount for failed transaction
 */
export async function refundAmount(
  userId: string,
  amount: number,
  transactionId: string
): Promise<boolean> {
  const wallet = await getWallet(userId);

  if (!wallet) {
    return false;
  }

  const newLockedBalance = Number(wallet.locked_balance) - amount;

  const { error: updateError } = await supabase
    .from('wallets' as never)
    .update({
      locked_balance: Math.max(0, newLockedBalance),
      updated_at: new Date().toISOString(),
    } as never)
    .eq('user_id', userId);

  if (updateError) {
    return false;
  }

  await addLedgerEntry(wallet.id, transactionId, 'UNLOCK', amount, Number(wallet.balance), `Amount unlocked/refunded`);

  return true;
}

/**
 * Credit wallet (Admin or payment gateway)
 */
export async function creditWallet(
  userId: string,
  amount: number,
  description: string
): Promise<boolean> {
  const wallet = await getWallet(userId);

  if (!wallet) {
    return false;
  }

  const newBalance = Number(wallet.balance) + amount;

  const { error: updateError } = await supabase
    .from('wallets' as never)
    .update({
      balance: newBalance,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('user_id', userId);

  if (updateError) {
    return false;
  }

  await addLedgerEntry(wallet.id, null, 'CREDIT', amount, newBalance, description);

  return true;
}

/**
 * Get wallet ledger entries
 */
export async function getWalletLedger(userId: string, limit = 50): Promise<WalletLedgerRow[]> {
  const wallet = await getWallet(userId);

  if (!wallet) {
    return [];
  }

  const { data, error } = await supabase
    .from('wallet_ledger' as never)
    .select('*')
    .eq('wallet_id', wallet.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return (data as unknown as WalletLedgerRow[]) || [];
}

/**
 * Add ledger entry
 */
async function addLedgerEntry(
  walletId: string,
  transactionId: string | null,
  type: 'CREDIT' | 'DEBIT' | 'LOCK' | 'UNLOCK' | 'REFUND',
  amount: number,
  balanceAfter: number,
  description: string
): Promise<void> {
  const { error } = await supabase
    .from('wallet_ledger' as never)
    .insert({
      wallet_id: walletId,
      transaction_id: transactionId,
      type,
      amount,
      balance_after: balanceAfter,
      description,
    } as never);

  if (error) {
    // Silent fail for ledger entries
  }
}

interface TransactionRow {
  id: string;
  user_id: string;
  type: string;
  service_type: string;
  amount: number;
  status: string;
  operator_id: string | null;
  mobile_number: string | null;
  dth_id: string | null;
  reference_id: string | null;
  api_transaction_id: string | null;
  commission: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Payout Request Interface
 */
export interface PayoutRequest {
  account_no: string;
  amount: number;
  ifsc_code: string;
  bene_name: string;
}

/**
 * Process withdrawal (Payout)
 */
export async function withdrawBalance(
  userId: string,
  request: PayoutRequest
): Promise<ApiResponse<Transaction | null>> {
  // 1. Check balance
  const wallet = await getWalletBalance(userId);
  if (!wallet || wallet.balance - wallet.locked_balance < request.amount) {
    return {
      status: 'FAILED',
      transaction_id: '',
      message: 'Insufficient wallet balance',
      data: null,
    };
  }

  // 2. Create local transaction
  const { data: transaction, error } = await supabase
    .from('transactions' as never)
    .insert({
      user_id: userId,
      type: 'PAYOUT',
      service_type: 'MONEY_TRANSFER',
      amount: request.amount,
      status: 'PENDING',
      mobile_number: request.account_no, // Storing account no in mobile/ref field
      reference_id: request.ifsc_code,
      metadata: { bene_name: request.bene_name }
    } as never)
    .select()
    .single();

  if (error || !transaction) {
    return {
      status: 'FAILED',
      transaction_id: '',
      message: 'Failed to create transaction',
      data: null,
    };
  }

  const txRow = transaction as unknown as TransactionRow;

  // 3. Lock amount
  await lockAmount(userId, request.amount, txRow.id);

  // 4. Call Payout API
  const numericOrderId = `${Date.now()}${Math.floor(Math.random() * 10).toString()}`; // Max 14 digits: 13 timestamp + 1 random

  const apiResult = await processPayout({
    account_no: request.account_no,
    amount: request.amount,
    order_id: numericOrderId,
    ifsc_code: request.ifsc_code,
    bene_name: request.bene_name
  });

  if (apiResult.status === 'SUCCESS' || apiResult.status === 'PENDING') {
    await confirmDebit(userId, request.amount, txRow.id);

    // Update status
    const { error: updateError } = await supabase
      .from('transactions' as never)
      .update({
        status: apiResult.status === 'SUCCESS' ? 'SUCCESS' : 'PENDING',
        api_transaction_id: apiResult.response?.order_id || numericOrderId,
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', txRow.id);

    return {
      status: apiResult.status === 'SUCCESS' ? 'SUCCESS' : 'PENDING',
      transaction_id: txRow.id,
      message: apiResult.message || 'Payout processed successfully',
      data: { ...txRow, status: apiResult.status === 'SUCCESS' ? 'SUCCESS' : 'PENDING' } as unknown as Transaction,
    };
  } else {
    // Refund if failed
    await refundAmount(userId, request.amount, txRow.id);

    const { error: updateError } = await supabase
      .from('transactions' as never)
      .update({
        status: 'FAILED',
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', txRow.id);

    return {
      status: 'FAILED',
      transaction_id: txRow.id,
      message: apiResult.message || 'Payout failed',
      data: null,
    };
  }
}

