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
  noScroll?: boolean;
}

export const Layout = ({ children, title, showBack, hideHeader, showBottomNav, isFullWidth, noScroll }: LayoutProps) => {
  const navigate = useNavigate();
  const { status, isApproved } = useKYC();

  const isKYCPage = window.location.pathname === '/kyc';

  return (
    <div className="min-h-screen bg-[#F1F5F9] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] flex justify-center w-full overflow-x-hidden app-native-container">
      <div className={`w-full ${isFullWidth ? 'max-w-none' : 'max-w-[448px]'} bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] ${noScroll ? 'h-screen overflow-hidden' : 'min-h-screen'} relative flex flex-col mx-auto safe-area-pt`}>
        
        {/* Patriotic Accent Bar */}
        <div className="h-1.5 w-full bg-india-tricolor shrink-0" />

        {/* KYC Warning Banner */}
        {!hideHeader && !isKYCPage && status && !isApproved && (
          <div className={`${status === 'REJECTED' ? 'bg-red-50 border-red-100' : 'bg-yellow-50 border-yellow-100'} border-b p-3 flex items-start gap-3 shrink-0`}>
             <Clock className="w-5 h-5 text-yellow-600 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-bold text-yellow-800">KYC Verification Pending</p>
            </div>
          </div>
        )}

        {!hideHeader && (title ? (
          <div className="bg-white px-4 py-3 flex items-center gap-3 sticky top-0 z-50 border-b border-gray-100 shrink-0">
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
        <main className={`flex-1 ${noScroll ? 'overflow-hidden' : 'pb-20'} flex flex-col min-w-0`}>
          {children}
        </main>
        {showBottomNav && <BottomNav />}
        
        {/* Patriotic Bottom Bar (Green) */}
        <div className="h-1.5 w-full bg-[#046A38] shrink-0" />
      </div>
    </div>
  );
};
