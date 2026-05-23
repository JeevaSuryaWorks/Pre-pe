import { Layout } from '@/components/layout/Layout';
import { PostpaidBillForm } from '@/components/recharge/PostpaidBillForm';
import { Smartphone, Shield } from 'lucide-react';

const PostpaidPage = () => {
  return (
    <Layout title="Postpaid Bill" showBack>
      <div className="bg-slate-50 min-h-screen p-4 pb-20 relative overflow-hidden">
        {/* Background ambient decorations */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-[#046A38]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md mx-auto space-y-6 relative z-10 pt-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Executive Header Banner */}
          <div className="bg-slate-900 text-white p-6 rounded-[28px] border border-slate-800 shadow-md relative overflow-hidden select-none">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none" />
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shrink-0 shadow-sm">
                <Smartphone className="w-5.5 h-5.5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-lg font-black uppercase tracking-wider leading-none">Postpaid Mobile</h1>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-emerald-500" /> Instant Payouts
                </p>
              </div>
            </div>
          </div>

          {/* Core Form Component */}
          <PostpaidBillForm />
        </div>
      </div>
    </Layout>
  );
};

export default PostpaidPage;
