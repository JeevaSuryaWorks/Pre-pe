import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Smartphone, Tv } from 'lucide-react';
import { toast } from 'sonner';

export default function Recharge() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(true);

  // Mobile State
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileOperator, setMobileOperator] = useState('');
  const [mobileAmount, setMobileAmount] = useState('');
  const [detectingOperator, setDetectingOperator] = useState(false);
  const [processingMobile, setProcessingMobile] = useState(false);

  // DTH State
  const [dthNumber, setDthNumber] = useState('');
  const [dthOperator, setDthOperator] = useState('');
  const [dthAmount, setDthAmount] = useState('');
  const [processingDth, setProcessingDth] = useState(false);

  useEffect(() => {
    async function loadUserAndBalance() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to continue");
        navigate('/login');
        return;
      }
      setUserId(user.id);

      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();
      
      if (wallet) {
        setBalance(Number(wallet.balance) || 0);
      }
      setLoadingBalance(false);
    }
    loadUserAndBalance();
  }, [navigate]);

  const detectOperator = async () => {
    if (mobileNumber.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    setDetectingOperator(true);
    try {
      const res = await fetch('/api/recharge/detect-operator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: mobileNumber })
      });
      const data = await res.json();
      const kwikData = data.data;
      if (data.success && kwikData) {
        console.log("Operator Detection Payload:", kwikData); // For debugging in console
        const nested = kwikData.response || kwikData;
        const opString = (nested.operator || nested.operator_name || nested.opid || kwikData.operator || '').toString().toLowerCase();
        let matchedId = '';
        
        if (opString.includes('airtel')) matchedId = '1';
        else if (opString.includes('bsnl')) matchedId = '2';
        else if (opString.includes('jio') || opString.includes('reliance')) matchedId = '3';
        else if (opString.includes('vi') || opString.includes('vodafon') || opString.includes('idea')) matchedId = '4';

        if (!matchedId && (nested.opid || kwikData.opid)) {
           matchedId = (nested.opid || kwikData.opid).toString();
        }

        if (matchedId) {
          setMobileOperator(matchedId);
          toast.success(`Operator detected: ${nested.operator || nested.operator_name || opString.toUpperCase() || 'Success'}`);
        } else {
          toast.error("Could not map operator automatically. Please select manually.");
        }
      } else {
        toast.error("Could not auto-detect operator");
      }
    } catch (err) {
      toast.error("Failed to detect operator");
    } finally {
      setDetectingOperator(false);
    }
  };

  const handleMobileRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber || !mobileOperator || !mobileAmount) {
      toast.error("Please fill all fields");
      return;
    }
    if (balance < Number(mobileAmount)) {
      toast.error("Insufficient wallet balance");
      return;
    }

    setProcessingMobile(true);
    try {
      const res = await fetch('/api/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: mobileNumber,
          opid: mobileOperator,
          amount: mobileAmount,
          service_type: 'MOBILE_PREPAID',
          user_id: userId,
          operator_name: mobileOperator, // Map as needed
        })
      });
      const data = await res.json();
      
      if (data.success) {
        navigate(`/recharge/status?status=SUCCESS&txn_id=${data.data.transaction_id}&msg=${encodeURIComponent(data.data.message)}`);
      } else {
        if (data.status === 'PENDING') {
          navigate(`/recharge/status?status=PENDING&msg=${encodeURIComponent(data.error || 'Pending')}`);
        } else {
          toast.error(data.error || "Recharge failed");
          navigate(`/recharge/status?status=FAILED&msg=${encodeURIComponent(data.error || 'Recharge Failed')}`);
        }
      }
    } catch (err: any) {
      toast.error("An error occurred");
    } finally {
      setProcessingMobile(false);
    }
  };

  const handleDthRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dthNumber || !dthOperator || !dthAmount) {
      toast.error("Please fill all fields");
      return;
    }
    if (balance < Number(dthAmount)) {
      toast.error("Insufficient wallet balance");
      return;
    }

    setProcessingDth(true);
    try {
      const res = await fetch('/api/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: dthNumber,
          opid: dthOperator,
          amount: dthAmount,
          service_type: 'DTH',
          user_id: userId,
          operator_name: dthOperator,
        })
      });
      const data = await res.json();
      
      if (data.success) {
        navigate(`/recharge/status?status=SUCCESS&txn_id=${data.data.transaction_id}&msg=${encodeURIComponent(data.data.message)}`);
      } else {
        if (data.status === 'PENDING') {
          navigate(`/recharge/status?status=PENDING&msg=${encodeURIComponent(data.error || 'Pending')}`);
        } else {
          toast.error(data.error || "Recharge failed");
          navigate(`/recharge/status?status=FAILED&msg=${encodeURIComponent(data.error || 'Recharge Failed')}`);
        }
      }
    } catch (err: any) {
      toast.error("An error occurred");
    } finally {
      setProcessingDth(false);
    }
  };

  return (
    <div className="container max-w-lg mx-auto py-10 px-4">
      {/* Wallet Balance Header */}
      <Card className="mb-6 bg-primary text-primary-foreground border-none">
        <CardContent className="flex justify-between items-center py-6">
          <div>
            <p className="text-sm opacity-90 font-medium">Available Balance</p>
            <h2 className="text-3xl font-bold mt-1">
              {loadingBalance ? <Loader2 className="animate-spin h-6 w-6 mt-1" /> : `₹${balance.toFixed(2)}`}
            </h2>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="mobile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="mobile" className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Mobile
          </TabsTrigger>
          <TabsTrigger value="dth" className="flex items-center gap-2">
            <Tv className="w-4 h-4" />
            DTH
          </TabsTrigger>
        </TabsList>

        {/* Mobile Tab */}
        <TabsContent value="mobile">
          <Card>
            <CardHeader>
              <CardTitle>Mobile Recharge</CardTitle>
              <CardDescription>Enter prepaid mobile details for instant recharge</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMobileRecharge} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Mobile Number</label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="10 digit number" 
                      maxLength={10} 
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                    />
                    <Button 
                      type="button" 
                      variant="secondary"
                      onClick={detectOperator}
                      disabled={detectingOperator || mobileNumber.length !== 10}
                    >
                      {detectingOperator ? <Loader2 className="w-4 h-4 animate-spin" /> : "Detect"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Operator</label>
                  <Select value={mobileOperator} onValueChange={setMobileOperator}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Note: Update values to actual KWIK operator IDs in production */}
                      <SelectItem value="1">Airtel</SelectItem>
                      <SelectItem value="2">BSNL</SelectItem>
                      <SelectItem value="3">Jio</SelectItem>
                      <SelectItem value="4">Vi (Vodafone Idea)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Amount (₹)</label>
                  <Input 
                    placeholder="Enter amount" 
                    type="number" 
                    value={mobileAmount}
                    onChange={(e) => setMobileAmount(e.target.value)}
                  />
                </div>

                <Button className="w-full mt-6" type="submit" disabled={processingMobile}>
                  {processingMobile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Recharge Now
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DTH Tab */}
        <TabsContent value="dth">
          <Card>
            <CardHeader>
              <CardTitle>DTH Recharge</CardTitle>
              <CardDescription>Select operator and enter subscriber ID</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDthRecharge} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Operator</label>
                  <Select value={dthOperator} onValueChange={setDthOperator}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select DTH operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">Airtel DTH</SelectItem>
                      <SelectItem value="6">Tata Play</SelectItem>
                      <SelectItem value="7">Dish TV</SelectItem>
                      <SelectItem value="8">Sun Direct</SelectItem>
                      <SelectItem value="9">Videocon d2h</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Subscriber ID / Reg. Mobile</label>
                  <Input 
                    placeholder="Enter ID" 
                    value={dthNumber}
                    onChange={(e) => setDthNumber(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Amount (₹)</label>
                  <Input 
                    placeholder="Enter amount" 
                    type="number" 
                    value={dthAmount}
                    onChange={(e) => setDthAmount(e.target.value)}
                  />
                </div>

                <Button className="w-full mt-6" type="submit" disabled={processingDth}>
                  {processingDth ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Recharge Now
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
