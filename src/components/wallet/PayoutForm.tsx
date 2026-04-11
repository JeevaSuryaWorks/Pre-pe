import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Building, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { validateBankAccount } from '@/services/kwikApiService';
import { withdrawBalance } from '@/services/wallet.service';
import { useKYC } from '@/hooks/useKYC';
import { KYCNudgeDialog } from '@/components/kyc/KYCNudgeDialog';

export function PayoutForm() {
    const { user } = useAuth();
    const { availableBalance, refetch: refetchWallet } = useWallet();
    const { isApproved } = useKYC();
    const { toast } = useToast();

    const [showKYCNudge, setShowKYCNudge] = useState(false);
    const [accountNo, setAccountNo] = useState('');
    const [ifsc, setIfsc] = useState('');
    const [amount, setAmount] = useState('');
    const [beneficiaryName, setBeneficiaryName] = useState('');

    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState(false);
    const [processing, setProcessing] = useState(false);

    const handleVerify = async () => {
        if (!isApproved) {
            setShowKYCNudge(true);
            return;
        }

        if (!accountNo || !ifsc || accountNo.length < 9 || ifsc.length !== 11) {
            toast({
                title: 'Invalid details',
                description: 'Please enter valid Account Number and IFSC code',
                variant: 'destructive',
            });
            return;
        }

        setVerifying(true);
        // Generate a temporary order ID for verification
        const orderId = `VERIFY${Date.now()}`;

        // We use a dummy mobile number for verification as per API requirement if needed, 
        // or the user's mobile if available. For now using a placeholder if user mobile not readily available in auth context without extra fetch.
        // Ideally use user.phone from a profile fetch.
        const senderMobile = '9999999999';

        const result = await validateBankAccount({
            number: senderMobile,
            account: accountNo,
            ifsc: ifsc,
            order_id: orderId
        });

        setVerifying(false);

        if (result.status === 'SUCCESS' && result.verify_status === 'VERIFIED') {
            setVerified(true);
            setBeneficiaryName(result.ben_name || 'Verified User');
            toast({
                title: 'Account Verified',
                description: `Beneficiary Name: ${result.ben_name}`,
            });
        } else {
            setVerified(false);
            toast({
                title: 'Verification Failed',
                description: result.message || 'Could not verify account details',
                variant: 'destructive',
            });
        }
    };

    const handleWithdraw = async () => {
        if (!user) return;

        if (!verified) {
            toast({
                title: 'Verify Account First',
                description: 'Please verify bank account before withdrawal',
                variant: 'destructive',
            });
            return;
        }

        const withdrawAmount = parseFloat(amount);
        if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
            toast({
                title: 'Invalid Amount',
                description: 'Please enter a valid amount',
                variant: 'destructive',
            });
            return;
        }

        if (withdrawAmount > availableBalance) {
            toast({
                title: 'Insufficient Balance',
                description: 'You do not have enough wallet balance',
                variant: 'destructive',
            });
            return;
        }

        setProcessing(true);

        const result = await withdrawBalance(user.id, {
            account_no: accountNo,
            ifsc_code: ifsc,
            amount: withdrawAmount,
            bene_name: beneficiaryName
        });

        setProcessing(false);

        if (result.status === 'SUCCESS' || result.status === 'PENDING') {
            toast({
                title: result.status === 'SUCCESS' ? 'Withdrawal Successful' : 'Withdrawal Processing',
                description: `₹${withdrawAmount} transfer initiated`,
            });
            refetchWallet();
            // Reset form
            setAccountNo('');
            setIfsc('');
            setAmount('');
            setVerified(false);
            setBeneficiaryName('');
        } else {
            toast({
                title: 'Withdrawal Failed',
                description: result.message,
                variant: 'destructive',
            });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Withdraw to Bank
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Bank Details - Strict Vertical Stack */}
                <div className="flex flex-col gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="accountNo" className="text-xs font-bold text-slate-500 uppercase ml-1">Account Number</Label>
                        <Input
                            id="accountNo"
                            placeholder="Bank Account Number"
                            className="h-12 rounded-xl border-slate-200"
                            value={accountNo}
                            onChange={(e) => {
                                setAccountNo(e.target.value);
                                setVerified(false); // Reset verification on change
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ifsc" className="text-xs font-bold text-slate-500 uppercase ml-1">IFSC Code</Label>
                        <Input
                            id="ifsc"
                            placeholder="IFSC Code"
                            className="h-12 rounded-xl border-slate-200"
                            value={ifsc}
                            onChange={(e) => {
                                setIfsc(e.target.value.toUpperCase());
                                setVerified(false);
                            }}
                            maxLength={11}
                        />
                    </div>
                </div>

                {/* Verification Status */}
                {verified && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                        <CheckCircle className="h-4 w-4" />
                        <span>Verified: <strong>{beneficiaryName}</strong></span>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-xs font-bold text-slate-500 uppercase ml-1">Amount (₹)</Label>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="Enter Amount to Withdraw"
                            className="h-12 rounded-xl border-slate-200"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    <div className="w-full">
                        {!verified ? (
                            <Button
                                onClick={handleVerify}
                                disabled={verifying || !accountNo || !ifsc}
                                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold"
                            >
                                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify Account'}
                            </Button>
                        ) : (
                            <Button
                                onClick={handleWithdraw}
                                disabled={processing || !amount}
                                className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 font-bold"
                            >
                                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Withdraw Money'}
                            </Button>
                        )}
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">
                    * Verification charges may apply. Ensure details are correct.
                </p>
            </CardContent>

            <KYCNudgeDialog
                isOpen={showKYCNudge}
                onClose={() => setShowKYCNudge(false)}
                featureName="Bank Payout"
            />
        </Card>
    );
}
