import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, Home } from 'lucide-react';

export default function RechargeStatus() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const status = searchParams.get('status');
  const msg = searchParams.get('msg');
  const txnId = searchParams.get('txn_id');

  const isSuccess = status === 'SUCCESS';
  const isPending = status === 'PENDING';
  const isFailed = status === 'FAILED';

  return (
    <div className="container max-w-md mx-auto py-20 px-4 flex items-center justify-center">
      <Card className="w-full text-center">
        <CardHeader className="flex flex-col items-center pt-8 pb-4">
          {isSuccess && <CheckCircle2 className="w-20 h-20 text-green-500 mb-4" />}
          {isFailed && <XCircle className="w-20 h-20 text-red-500 mb-4" />}
          {isPending && <Clock className="w-20 h-20 text-yellow-500 mb-4 animate-pulse" />}
          
          <CardTitle className="text-2xl font-bold">
            {isSuccess && "Recharge Successful!"}
            {isFailed && "Recharge Failed"}
            {isPending && "Recharge Pending"}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4 pb-8">
          <p className="text-muted-foreground whitespace-pre-wrap">
            {msg || "Your transaction has been processed."}
          </p>
          
          {txnId && isSuccess && (
            <div className="mt-6 p-4 bg-muted rounded-lg border flex flex-col items-center">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Transaction ID</span>
              <span className="font-mono mt-1 text-sm break-all">{txnId}</span>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full" onClick={() => navigate('/recharge')}>
            {isFailed ? "Try Again" : "Make Another Recharge"}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate('/home')}>
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
