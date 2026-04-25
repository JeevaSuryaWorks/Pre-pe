import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Coins, Sparkles, Lock, CheckCircle2, Trophy, ArrowRight, PlayCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScratchModal } from './ScratchModal';

interface ScratchCardProps {
  id: string;
  title: string;
  type: 'GIFT_VOUCHER' | 'REWARD_POINTS' | 'CASHBACK' | 'PROMO_CODE' | 'OFFER';
  value: number;
  isUnlocked: boolean;
  status: 'LOCKED' | 'UNLOCKED' | 'SCRATCHED';
  promo_code?: string;
  offer_url?: string;
  onScratchComplete: (id: string, value: number) => void;
}

export function ScratchCardItem({ id, title, type, value, isUnlocked, status, promo_code, offer_url, onScratchComplete }: ScratchCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    if (isUnlocked && status !== 'SCRATCHED') {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <motion.div
          whileHover={isUnlocked && status !== 'SCRATCHED' ? { scale: 1.05, y: -5 } : {}}
          whileTap={isUnlocked && status !== 'SCRATCHED' ? { scale: 0.95 } : {}}
          onClick={handleClick}
          className="cursor-pointer h-full group"
      >
        <Card className={`relative aspect-[4/5] overflow-hidden rounded-[2.5rem] shadow-2xl border transition-all duration-500 ${
            status === 'SCRATCHED' ? 'opacity-70 bg-slate-100 border-slate-200' : 'border-white/20'
        }`}>
            {/* Card Content (Preview) */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center ${
                status === 'SCRATCHED' ? 'bg-slate-50' : 
                type === 'CASHBACK' ? 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white' : 
                type === 'REWARD_POINTS' ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white' : 
                'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
            }`}>
                
                {status === 'SCRATCHED' ? (
                    <div className="flex flex-col items-center">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
                        <h4 className="font-black text-xl text-slate-400">Claimed</h4>
                        <p className="text-xs font-bold text-slate-300 mt-1 uppercase tracking-widest">{title}</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 shadow-xl backdrop-blur-md bg-white/20 border border-white/30 transition-transform ${isUnlocked ? 'animate-bounce' : ''}`}>
                            {type === 'REWARD_POINTS' && <Coins className="w-8 h-8 text-white drop-shadow-md" />}
                            {type === 'CASHBACK' && <Sparkles className="w-8 h-8 text-white drop-shadow-md" />}
                            {(type === 'PROMO_CODE' || type === 'OFFER' || type === 'GIFT_VOUCHER') && <Gift className="w-8 h-8 text-white drop-shadow-md" />}
                        </div>
                        <h4 className="font-black text-xl text-white leading-tight px-2 drop-shadow-md">{title}</h4>
                        <div className="mt-6 px-5 py-2 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2 border border-white/30 shadow-lg group-hover:bg-white/30 transition-colors">
                             <PlayCircle className="w-3.5 h-3.5" /> Tap to reveal
                        </div>
                        {/* Decorative floating elements */}
                        <div className="absolute top-4 right-4 w-12 h-12 bg-white/10 rounded-full blur-xl" />
                        <div className="absolute bottom-4 left-4 w-16 h-16 bg-black/10 rounded-full blur-xl" />
                    </div>
                )}
            </div>

            {/* Lock Overlay */}
            {!isUnlocked && (
                 <div className="absolute inset-0 bg-gradient-to-br from-slate-800/95 to-slate-950/95 backdrop-blur-xl z-10 flex flex-col items-center justify-center p-6 text-white text-center border-t border-white/10">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
                    <div className="w-20 h-20 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center mb-6 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                        <Lock className="w-8 h-8 text-slate-400 drop-shadow-md" />
                    </div>
                    <h5 className="font-black text-2xl uppercase tracking-tight mb-3 text-slate-100 drop-shadow-sm">Locked</h5>
                    <div className="h-1 w-12 bg-indigo-500/50 rounded-full mb-4 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                    <p className="text-[10px] font-black text-slate-400 leading-relaxed uppercase tracking-[0.25em]">Recharge to Unlock</p>
                 </div>
            )}
        </Card>
      </motion.div>

      <ScratchModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        card={{ id, title, type, value, promo_code, offer_url }}
        onComplete={onScratchComplete}
      />
    </>
  );
}
