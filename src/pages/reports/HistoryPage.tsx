import { Layout } from '@/components/layout/Layout';
import { TransactionHistory } from '@/components/transactions/TransactionHistory';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { Loader2, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/home/BottomNav';

const HistoryPage = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    if (loading) {
        return (
            <Layout>
                <div className="container py-8 flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    return (
        <Layout title="Transaction Histories">
            <div className="container py-8 pb-24">
                <div className="mb-6 flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2" onClick={() => navigate('/transactions')}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Transaction Histories</h1>
                        <p className="text-sm text-muted-foreground">Recharges & Bill Payments</p>
                    </div>
                </div>
                <TransactionHistory />
            </div>
            <BottomNav />
        </Layout>
    );
};

export default HistoryPage;
