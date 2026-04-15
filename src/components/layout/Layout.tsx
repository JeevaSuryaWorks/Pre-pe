import { ReactNode } from 'react';
import { Header } from '@/components/layout/Header';
import { ArrowLeft, AlertTriangle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useKYC } from '@/hooks/useKYC';
import { Button } from '../ui/button';
import { BottomNav } from '@/components/home/BottomNav';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  hideHeader?: boolean;
  showBottomNav?: boolean;
  isFullWidth?: boolean;
}

export const Layout = ({ children, title, showBack, hideHeader, showBottomNav, isFullWidth }: LayoutProps) => {
  const navigate = useNavigate();
  const { status, isApproved } = useKYC();

  // Don't show banner on KYC page itself to avoid clutter
  const isKYCPage = window.location.pathname === '/kyc';

  return (
    <div className="min-h-screen bg-[#F1F5F9] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] flex justify-center w-full">
      <div className={`w-full ${isFullWidth ? 'max-w-none' : 'max-w-[448px]'} bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] min-h-screen relative flex flex-col`}>

        {/* KYC Warning Banner */}
        {!hideHeader && !isKYCPage && status && !isApproved && (
          <div className={`${status === 'REJECTED' ? 'bg-red-50 border-red-100' : 'bg-yellow-50 border-yellow-100'} border-b p-3 flex items-start gap-3`}>
            {status === 'REJECTED' ? <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" /> : <Clock className="w-5 h-5 text-yellow-600 shrink-0" />}
            <div className="flex-1">
              <p className={`text-sm font-medium ${status === 'REJECTED' ? 'text-red-800' : 'text-yellow-800'}`}>
                {status === 'REJECTED' ? 'KYC Rejected' : 'KYC Verification Pending'}
              </p>
              <p className={`text-xs mt-0.5 ${status === 'REJECTED' ? 'text-red-600' : 'text-yellow-600'}`}>
                {status === 'REJECTED'
                  ? 'Your application was rejected. Please contact support.'
                  : 'Services are disabled until verification completes.'}
              </p>
            </div>
            {status === 'REJECTED' && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/contact')} className="h-8 text-xs text-red-700 hover:text-red-800 hover:bg-red-100">
                Support
              </Button>
            )}
          </div>
        )}

        {!hideHeader && (title ? (
          <div className="bg-white px-4 py-3 flex items-center gap-3 sticky top-0 z-50 border-b border-gray-100">
            {showBack && (
              <button onClick={() => navigate(-1)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
            )}
            <h1 className="text-lg font-bold text-slate-800">{title}</h1>
          </div>
        ) : (
          <Header />
        ))}
        <main className={`flex-1 pb-20 ${!hideHeader ? 'pt-4' : ''}`}>{children}</main>
        {showBottomNav && <BottomNav />}
      </div>
    </div>
  );
};

