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
          className="cursor-pointer h-full"
      >
        <Card className={`relative aspect-[4/5] overflow-hidden rounded-[2.5rem] shadow-xl border-none transition-all duration-500 overflow-hidden ${
            status === 'SCRATCHED' ? 'opacity-70 bg-slate-100' : 'bg-white'
        }`}>
            {/* Card Content (Preview) */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center ${
                status === 'SCRATCHED' ? 'bg-slate-50' : 
                type === 'CASHBACK' ? 'bg-emerald-50/30' : 
                type === 'REWARD_POINTS' ? 'bg-indigo-50/30' : 
                'bg-amber-50/30'
            }`}>
                
                {status === 'SCRATCHED' ? (
                    <div className="flex flex-col items-center">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
                        <h4 className="font-black text-xl text-slate-400">Claimed</h4>
                        <p className="text-xs font-bold text-slate-300 mt-1 uppercase tracking-widest">{title}</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform ${isUnlocked ? 'animate-bounce' : ''} ${
                            type === 'CASHBACK' ? 'bg-emerald-100 text-emerald-600' : 
                            type === 'REWARD_POINTS' ? 'bg-indigo-100 text-indigo-600' : 
                            'bg-amber-100 text-amber-600'
                        }`}>
                            {type === 'REWARD_POINTS' && <Coins className="w-8 h-8" />}
                            {type === 'CASHBACK' && <Sparkles className="w-8 h-8" />}
                            {(type === 'PROMO_CODE' || type === 'OFFER' || type === 'GIFT_VOUCHER') && <Gift className="w-8 h-8" />}
                        </div>
                        <h4 className="font-black text-lg text-slate-800 leading-tight px-2">{title}</h4>
                        <div className="mt-4 px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                             <PlayCircle className="w-3 h-3" /> Tap to reveal
                        </div>
                    </div>
                )}
            </div>

            {/* Lock Overlay */}
            {!isUnlocked && (
                 <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-white text-center">
                    <Lock className="w-10 h-10 text-white/40 mb-4" />
                    <h5 className="font-black text-lg uppercase tracking-tight mb-2">Locked</h5>
                    <p className="text-[10px] font-bold text-white/50 leading-relaxed uppercase tracking-widest">Recharge to Unlock</p>
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
