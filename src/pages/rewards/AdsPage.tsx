import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { AdReward } from "@/components/rewards/AdReward";
import { useNavigate } from "react-router-dom";
import { Play, Sparkles, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function AdsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleAdComplete = (points: number) => {
    // When the ad completes, wait a brief second for the success toast and then redirect to the Rewards Dashboard
    setTimeout(() => {
      navigate("/rewards");
    }, 1500);
  };

  return (
    <Layout title="Daily Streak Ad" showBottomNav>
      <div className="min-h-screen bg-[#F8FAFC] py-8 px-4">
        <div className="max-w-lg mx-auto space-y-6">
          
          {/* Back button */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/rewards")}
              className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-2xl px-4 py-2 font-black uppercase text-[10px] tracking-widest transition-all"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              Back
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Promo Banner Card */}
            <Card className="border-none shadow-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden border border-white/5">
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
              
              <CardContent className="p-0 space-y-6 relative z-10 flex flex-col items-center text-center">
                <div className="bg-white/5 px-4 py-1 rounded-full border border-white/10 flex items-center gap-1.5 shadow-inner">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                  <span className="tracking-widest uppercase text-[8px] font-black text-slate-200">Daily Streak Activator</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-3xl font-black tracking-tight text-white uppercase tracking-wider">
                    Activate Your Streak
                  </h3>
                  <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto leading-relaxed">
                    Watch this 6-second video ad completely to credit your <span className="text-orange-400 font-bold">Daily Streak Check-in (+10 Pts)</span> and earn extra video reward points instantly!
                  </p>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3 text-left w-full">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-400/90 font-semibold leading-relaxed">
                    The close option is disabled for this streak activator ad. Letting the video run to the end is required to secure points.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Simulated Ad Container */}
            <div className="w-full">
              {user && (
                <AdReward
                  userId={user.id}
                  onComplete={handleAdComplete}
                  forceNoClose={true}
                  autoStart={true}
                />
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </Layout>
  );
}
