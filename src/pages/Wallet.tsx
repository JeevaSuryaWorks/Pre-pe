import { Layout } from '@/components/layout/Layout';
import { WalletDashboard } from '@/components/wallet/WalletDashboard';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const WalletPage = () => {
  const { user, loading } = useAuth();

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
    <Layout showBottomNav>
      <div className="px-4 py-6">
        <div className="mb-8 ml-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Wallet</h1>
          <p className="text-slate-500 font-medium mt-1">
            Manage your wallet balance and view activity
          </p>
        </div>
        <WalletDashboard />
      </div>
    </Layout>
  );
};

export default WalletPage;
