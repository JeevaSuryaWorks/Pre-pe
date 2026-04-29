import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  FileText,
  Receipt,
  CheckCircle,
} from 'lucide-react';

import { getOperators } from '@/services/operator.service';
import {
  fetchBillDetails,
  processPostpaidBill,
} from '@/services/recharge.service';

import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useKYC } from '@/hooks/useKYC';
import { useToast } from '@/hooks/use-toast';

import { KYCNudgeDialog } from '@/components/kyc/KYCNudgeDialog';

import type {
  Operator,
  BillDetails,
} from '@/types/recharge.types';

export function PostpaidBillForm() {
  const { user } = useAuth();
  const { availableBalance, refetch } =
    useWallet();
  const { isApproved } = useKYC();
  const { toast } = useToast();

  const [showKYCNudge, setShowKYCNudge] =
    useState(false);

  const [mobileNumber, setMobileNumber] =
    useState('');

  const [selectedOperator, setSelectedOperator] =
    useState('');

  const [operators, setOperators] = useState<
    Operator[]
  >([]);

  const [billDetails, setBillDetails] =
    useState<BillDetails | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [fetchingBill, setFetchingBill] =
    useState(false);

  const [processing, setProcessing] =
    useState(false);

  /* --------------------------
     Load Operators
  --------------------------- */
  useEffect(() => {
    const loadOperators = async () => {
      setLoading(true);

      const data =
        await getOperators('postpaid');

      setOperators(data || []);

      setLoading(false);
    };

    loadOperators();
  }, []);

  /* --------------------------
     Fetch Bill
  --------------------------- */
  const handleFetchBill =
    async () => {
      if (
        !mobileNumber ||
        mobileNumber.length !== 10
      ) {
        toast({
          title:
            'Invalid mobile number',
          description:
            'Enter valid 10 digit mobile number',
          variant:
            'destructive',
        });
        return;
      }

      if (!selectedOperator) {
        toast({
          title:
            'Select operator',
          description:
            'Choose operator first',
          variant:
            'destructive',
        });
        return;
      }

      if (!user) {
        toast({
          title:
            'Login required',
          description:
            'Please login first',
          variant:
            'destructive',
        });
        return;
      }

      setFetchingBill(true);

      const result =
        await fetchBillDetails(
          selectedOperator,
          mobileNumber,
          user.id
        );

      setFetchingBill(false);

      if (
        result.status ===
        'SUCCESS' &&
        result.data
      ) {
        setBillDetails(
          result.data
        );

        toast({
          title:
            'Bill fetched',
          description:
            'Bill details loaded',
        });
      } else {
        toast({
          title:
            'Failed to fetch bill',
          description:
            result.message,
          variant:
            'destructive',
        });
      }
    };

  /* --------------------------
     Pay Bill
  --------------------------- */
  const handlePayBill =
    async () => {
      if (!user) {
        toast({
          title:
            'Login required',
          description:
            'Please login',
          variant:
            'destructive',
        });
        return;
      }

      if (!isApproved) {
        setShowKYCNudge(true);
        return;
      }

      if (!billDetails) {
        toast({
          title:
            'No bill found',
          description:
            'Fetch bill first',
          variant:
            'destructive',
        });
        return;
      }

      if (
        billDetails.amount >
        availableBalance
      ) {
        toast({
          title:
            'Insufficient balance',
          description:
            'Add wallet balance',
          variant:
            'destructive',
        });
        return;
      }

      setProcessing(true);

      const result =
        await processPostpaidBill(
          user.id,
          billDetails
        );

      setProcessing(false);

      if (
        result.status ===
        'SUCCESS' ||
        result.status ===
        'PENDING'
      ) {
        toast({
          title:
            'Bill Payment Success',
          description: `₹${billDetails.amount} paid successfully`,
        });

        refetch();

        setBillDetails(null);
        setMobileNumber('');
      } else {
        toast({
          title:
            'Payment Failed',
          description:
            result.message,
          variant:
            'destructive',
        });
      }
    };

  /* --------------------------
     Loading
  --------------------------- */
  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* FORM */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Postpaid Bill Payment
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Operator */}
            <div className="space-y-2">
              <Label>
                Operator
              </Label>

              <Select
                value={
                  selectedOperator
                }
                onValueChange={
                  setSelectedOperator
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select operator" />
                </SelectTrigger>

                <SelectContent>
                  {operators.map(
                    (
                      item
                    ) => (
                      <SelectItem
                        key={
                          item.id
                        }
                        value={
                          item.id
                        }
                      >
                        {
                          item.name
                        }
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Mobile */}
            <div className="space-y-2">
              <Label>
                Mobile Number
              </Label>

              <Input
                maxLength={
                  10
                }
                value={
                  mobileNumber
                }
                placeholder="Enter mobile number"
                onChange={(
                  e
                ) =>
                  setMobileNumber(
                    e.target.value.replace(
                      /\D/g,
                      ''
                    )
                  )
                }
              />
            </div>
          </div>

          <Button
            className="w-full"
            onClick={
              handleFetchBill
            }
            disabled={
              fetchingBill
            }
          >
            {fetchingBill ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <Receipt className="mr-2 h-4 w-4" />
                Fetch Bill
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* BILL DETAILS */}
      {billDetails && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex gap-2 text-primary">
              <Receipt className="h-5 w-5" />
              Bill Details
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">
                  Customer
                </p>
                <p className="font-semibold">
                  {
                    billDetails.customer_name
                  }
                </p>
              </div>

              <div>
                <p className="text-muted-foreground">
                  Mobile
                </p>
                <p className="font-semibold">
                  {
                    billDetails.mobile_number
                  }
                </p>
              </div>

              <div>
                <p className="text-muted-foreground">
                  Bill No
                </p>
                <p className="font-semibold">
                  {
                    billDetails.bill_number
                  }
                </p>
              </div>

              <div>
                <p className="text-muted-foreground">
                  Due Date
                </p>
                <p className="font-semibold">
                  {
                    billDetails.due_date
                  }
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-accent flex justify-between">
              <span>
                Amount Due
              </span>
              <span className="font-bold text-xl text-primary">
                ₹
                {
                  billDetails.amount
                }
              </span>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={
                processing
              }
              onClick={
                handlePayBill
              }
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Pay ₹
                  {
                    billDetails.amount
                  }
                </>
              )}
            </Button>

            {user && (
              <p className="text-center text-sm text-muted-foreground">
                Wallet
                Balance:
                <span className="font-semibold ml-1 text-foreground">
                  ₹
                  {availableBalance.toFixed(
                    2
                  )}
                </span>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <KYCNudgeDialog
        isOpen={
          showKYCNudge
        }
        onClose={() =>
          setShowKYCNudge(
            false
          )
        }
        featureName="Postpaid Bill Payment"
      />
    </div>
  );
}