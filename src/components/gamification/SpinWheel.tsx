import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Gift, Coins, Zap, Star, Lock, Timer } from 'lucide-react';

interface SpinWheelProps {
  onSpinComplete: (points: number) => void;
  disabled?: boolean;
}

const slices = [
  { id: 1, label: '50 Pts', value: 50, color: 'from-amber-400 to-yellow-500', icon: Star },
  { id: 2, label: '10 Pts', value: 10, color: 'from-rose-400 to-red-500', icon: Coins },
  { id: 3, label: '200 Pts', value: 200, color: 'from-emerald-400 to-green-500', icon: Zap },
  { id: 4, label: 'Oops', value: 0, color: 'from-slate-400 to-slate-500', icon: Gift },
  { id: 5, label: '100 Pts', value: 100, color: 'from-indigo-400 to-blue-500', icon: Star },
  { id: 6, label: '20 Pts', value: 20, color: 'from-violet-400 to-purple-500', icon: Coins },
];

export function SpinWheel({ onSpinComplete, disabled }: SpinWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const { toast } = useToast();
  
  const spin = () => {
    if (isSpinning || disabled) return;
    setIsSpinning(true);
    
    const prizeIndex = Math.floor(Math.random() * slices.length);
    const prize = slices[prizeIndex];
    
    const sliceAngle = 360 / slices.length;
    const targetAngle = 360 * 5 + (slices.length - prizeIndex - 0.5) * sliceAngle;
    
    setRotation(prev => prev + targetAngle);
    
    setTimeout(() => {
      setIsSpinning(false);
      onSpinComplete(prize.value);
      if (prize.value > 0) {
        toast({
          title: "Congratulations!",
          description: `You won ${prize.value} Points!`,
        });
      } else {
        toast({
          title: "Better luck next time!",
          description: `Sorry, you didn't win anything this time.`,
        });
      }
    }, 4000); 
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-12">
      <div className="relative w-80 h-80 md:w-96 md:h-96">
        
        {/* Outer Ring Decorations */}
        <div className="absolute -inset-4 border-2 border-dashed border-slate-200 rounded-full animate-spin-slow opacity-20" />
        <div className="absolute -inset-8 border-1 border-slate-100 rounded-full opacity-10" />

        {/* Pointer */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-10 h-10 z-30 drop-shadow-[0_10px_10px_rgba(0,0,0,0.2)]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="text-slate-900 drop-shadow-lg">
                <path d="M12 2L4 20h16L12 2z" />
            </svg>
        </div>

        {/* Wheel container */}
        <div className="relative w-full h-full p-2 bg-white rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.15)] border-4 border-slate-50">
          <motion.div
            className="w-full h-full rounded-full relative overflow-hidden ring-4 ring-slate-100/50"
            animate={{ rotate: rotation }}
            transition={{ duration: 4, ease: [0.1, 0.9, 0.2, 1] }} 
          >
            {slices.map((slice, index) => {
              const angle = (360 / slices.length) * index;
              const Icon = slice.icon;
              return (
                <div
                  key={slice.id}
                  className={`absolute w-[50%] h-[50%] top-0 right-0 origin-bottom-left flex items-center justify-center border-l-2 border-white/30 transition-all bg-gradient-to-br ${slice.color}`}
                  style={{
                    transform: `rotate(${angle}deg)`,
                    clipPath: 'polygon(0 100%, 100% 0, 100% 100%)',
                  }}
                >
                   <div 
                      className="absolute bottom-6 right-6 flex flex-col items-center transform -rotate-45"
                   >
                      <Icon className="w-6 h-6 text-white mb-2 drop-shadow-md" />
                      <span className="text-white font-black text-xs md:text-sm tracking-tighter uppercase drop-shadow-md">{slice.label}</span>
                   </div>
                </div>
              );
            })}
          </motion.div>

          {/* Center piece */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white rounded-full p-1.5 shadow-2xl z-20">
              <div className="w-full h-full bg-slate-950 rounded-full border-4 border-slate-50 flex items-center justify-center shadow-inner group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent animate-pulse" />
                  <span className="text-white font-black text-[10px] tracking-widest relative z-10 transition-transform group-hover:scale-110">LUCKY</span>
              </div>
          </div>
        </div>

        {/* Daily Limit Overlay */}
        <AnimatePresence>
            {disabled && !isSpinning && (
                <motion.div 
                    initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                    animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
                    className="absolute inset-0 z-40 rounded-full bg-slate-900/40 flex flex-col items-center justify-center text-white p-10 text-center"
                >
                    <div className="bg-white/20 p-4 rounded-3xl mb-4 border border-white/20">
                        <Timer className="w-10 h-10 text-white" />
                    </div>
                    <h4 className="font-black text-xl uppercase tracking-tight mb-2">Check Back Tomorrow</h4>
                    <p className="text-xs font-medium text-white/70 leading-relaxed uppercase tracking-widest">You have used your free daily spin. Reset at midnight.</p>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <Button 
        onClick={spin} 
        disabled={isSpinning || disabled}
        className="w-full max-w-sm h-16 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-black hover:to-slate-950 text-white font-black text-xl rounded-[2rem] shadow-2xl transform active:scale-95 transition-all group overflow-hidden relative"
      >
        <span className="relative z-10 flex items-center gap-3">
            {isSpinning ? 'SPINNING...' : (disabled ? 'SPUN TODAY' : 'SPIN TO WIN!')}
            {!isSpinning && !disabled && <Star className="w-5 h-5 text-yellow-400 animate-pulse" />}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-violet-600/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      </Button>
    </div>
  );
}
