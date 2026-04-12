import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Gift, Coins, Zap, Star, Timer, Sparkles, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinWheelProps {
  onSpinComplete: (points: number) => void;
  disabled?: boolean;
  lastSpinTime?: string | null;
}

const slices = [
  { id: 1, label: '50 Pts', value: 50, color: 'from-amber-400 to-yellow-600', icon: Star },
  { id: 2, label: '10 Pts', value: 10, color: 'from-rose-500 to-red-600', icon: Coins },
  { id: 3, label: '500 Pts', value: 500, color: 'from-indigo-600 to-violet-700', icon: Trophy },
  { id: 4, label: 'Oops', value: 0, color: 'from-slate-500 to-slate-700', icon: Gift },
  { id: 5, label: '100 Pts', value: 100, color: 'from-emerald-500 to-green-600', icon: Zap },
  { id: 6, label: '25 Pts', value: 25, color: 'from-sky-400 to-blue-600', icon: Coins },
  { id: 7, label: 'Bonus', value: 150, color: 'from-fuchsia-500 to-purple-600', icon: Sparkles },
  { id: 8, label: '5 Pts', value: 5, color: 'from-orange-400 to-orange-600', icon: Coins },
];

export function SpinWheel({ onSpinComplete, disabled, lastSpinTime }: SpinWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showPrize, setShowPrize] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const pointerControls = useAnimation();
  
  // Calculate time until next spin (rolling 24h)
  const calculateTimeLeft = useCallback(() => {
    if (!lastSpinTime) return 0;
    const lastSpin = new Date(lastSpinTime).getTime();
    const now = Date.now();
    const diff = (lastSpin + 24 * 60 * 60 * 1000) - now;
    return Math.max(0, Math.floor(diff / 1000));
  }, [lastSpinTime]);

  useEffect(() => {
    const initialTime = calculateTimeLeft();
    setTimeLeft(initialTime);

    if (initialTime > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
           if (prev <= 1) {
              clearInterval(timer);
              return 0;
           }
           return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [calculateTimeLeft, lastSpinTime]); // Added lastSpinTime to dependencies to ensure timer restarts after a successful spin

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  
  const spin = () => {
    if (isSpinning || disabled || timeLeft > 0) return;
    setIsSpinning(true);
    setShowPrize(null);
    
    const prizeIndex = Math.floor(Math.random() * slices.length);
    const prize = slices[prizeIndex];
    
    const sliceAngle = 360 / slices.length;
    const targetAngle = 360 * 8 + (slices.length - prizeIndex - 0.5) * sliceAngle;
    
    setRotation(prev => prev + targetAngle);
    
    // Ticking animation
    const tickInterval = setInterval(() => {
        pointerControls.start({
            rotate: [0, -15, 0],
            transition: { duration: 0.1 }
        });
    }, 150);

    setTimeout(() => {
      clearInterval(tickInterval);
      setIsSpinning(false);
      setShowPrize(prize.value);
      
      setTimeout(() => {
        onSpinComplete(prize.value);
      }, 1500);
    }, 4500); 
  };

  // Only lock if we actually have time remaining. 
  // We prioritize the timer over the 'disabled' prop to prevent the 00:00:00 lock bug.
  const isActuallyDisabled = (timeLeft > 0 || (disabled && !lastSpinTime)) && !isSpinning;

  return (
    <div className="flex flex-col items-center justify-center space-y-10">
      <div className="relative w-72 h-72 md:w-80 md:h-80">
        
        {/* Outer Metallic Rim with Lights */}
        <div className="absolute -inset-6 rounded-full bg-gradient-to-br from-slate-200 via-slate-400 to-slate-300 shadow-[0_0_50px_rgba(0,0,0,0.2)] p-1.5 overflow-hidden">
            <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.4),transparent)] animate-spin-slow pointer-events-none" />
            
            {/* LED Dots around the rim */}
            {[...Array(12)].map((_, i) => (
                <motion.div
                    key={i}
                    animate={isSpinning ? { 
                        opacity: [0.3, 1, 0.3],
                        scale: [0.8, 1.2, 0.8],
                        backgroundColor: i % 2 === 0 ? '#fbbf24' : '#6366f1'
                    } : { opacity: 0.6 }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                    className="absolute w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]"
                    style={{
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-144px)`
                    }}
                />
            ))}
            
            <div className="w-full h-full rounded-full bg-slate-900 shadow-inner" />
        </div>

        {/* Pointer (The Needle) */}
        <motion.div 
            animate={pointerControls}
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-12 h-16 z-30 drop-shadow-2xl"
        >
            <div className="relative w-full h-full flex justify-center">
                <svg viewBox="0 0 40 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <path d="M20 60L5 10C5 10 5 0 20 0C35 0 35 10 35 10L20 60Z" fill="url(#needle-grad)" />
                    <circle cx="20" cy="15" r="5" fill="white" fillOpacity="0.5" />
                    <defs>
                        <linearGradient id="needle-grad" x1="20" y1="0" x2="20" y2="60" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#1e293b" />
                            <stop offset="1" stopColor="#0f172a" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        </motion.div>

        {/* Wheel container */}
        <div className={cn(
            "relative w-full h-full p-1.5 bg-slate-950 rounded-full shadow-2xl border-4 border-slate-800 overflow-hidden transition-all duration-700",
            isActuallyDisabled && "opacity-40 grayscale-[0.5] scale-95"
        )}>
          {/* Slices */}
          <motion.div
            className="w-full h-full rounded-full relative overflow-hidden"
            animate={{ rotate: rotation }}
            transition={{ duration: 4.5, ease: [0.15, 0, 0.15, 1] }} 
          >
            {slices.map((slice, index) => {
              const angle = (360 / slices.length) * index;
              const Icon = slice.icon;
              return (
                <div
                  key={slice.id}
                  className={cn(
                    "absolute w-[50%] h-[50%] top-0 right-0 origin-bottom-left flex items-center justify-center border-l border-white/10 transition-all bg-gradient-to-br",
                    slice.color
                  )}
                  style={{
                    transform: `rotate(${angle}deg)`,
                    clipPath: 'polygon(0 100%, 100% 0, 100% 100%)',
                  }}
                >
                   <div 
                      className="absolute bottom-4 right-4 flex flex-col items-center transform -rotate-[22.5deg] scale-90 md:scale-100"
                   >
                      <Icon className="w-5 h-5 text-white mb-1 drop-shadow-lg" />
                      <span className="text-white font-black text-[9px] md:text-[10px] tracking-tighter uppercase drop-shadow-lg whitespace-nowrap">
                        {slice.label}
                      </span>
                   </div>
                </div>
              );
            })}
          </motion.div>

          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none z-10" />
          <div className="absolute inset-4 border border-white/5 rounded-full pointer-events-none z-10" />

          {/* Center piece */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-300 rounded-full p-1 shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-20">
              <div className="w-full h-full bg-slate-950 rounded-full border-2 border-slate-50 flex items-center justify-center shadow-inner overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/30 to-transparent animate-pulse" />
                  <Star className={cn("w-6 h-6 text-yellow-400 relative z-10", isSpinning && "animate-spin")} />
              </div>
          </div>
        </div>

        {/* Big Reward Celebration */}
        <AnimatePresence>
            {showPrize !== null && (
                <motion.div 
                   initial={{ opacity: 0, scale: 0.5, y: 20 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.5 }}
                   className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
                >
                    <div className="bg-white rounded-full p-8 shadow-[0_0_60px_rgba(79,70,229,0.5)] border-4 border-indigo-100 flex flex-col items-center">
                        <Sparkles className="w-10 h-10 text-yellow-500 mb-2 animate-bounce" />
                        <h2 className="text-4xl font-black text-slate-950 tracking-tighter">WINNER!</h2>
                        <p className="text-2xl font-black text-indigo-600">+{showPrize} PTS</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Rolling 24h Timer Overlay */}
        <AnimatePresence>
            {isActuallyDisabled && (
                <motion.div 
                    initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                    animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
                    exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                    className="absolute inset-0 z-40 rounded-full bg-slate-900/60 flex flex-col items-center justify-center text-white p-6 text-center"
                >
                    <div className="bg-indigo-500/20 p-4 rounded-3xl mb-4 border border-white/10 shadow-2xl">
                        <Timer className="w-8 h-8 text-white animate-pulse" />
                    </div>
                    <h4 className="font-black text-lg uppercase tracking-tight mb-2">Next Spin Available</h4>
                    <div className="bg-white/10 px-6 py-2 rounded-2xl border border-white/5 font-mono text-xl font-black tracking-widest text-indigo-300">
                        {formatTime(timeLeft)}
                    </div>
                    <p className="text-[9px] font-bold text-white/40 leading-tight uppercase tracking-[0.2em] mt-4 max-w-[150px]">
                        Rolling 24-hour reward system
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <div className="w-full max-w-xs space-y-4">
          <Button 
            onClick={spin} 
            disabled={isSpinning || isActuallyDisabled}
            className={cn(
                "w-full h-14 bg-slate-950 hover:bg-black text-white font-black text-lg rounded-2xl shadow-xl transition-all group overflow-hidden relative border border-white/5",
                isActuallyDisabled && "bg-slate-900/50 text-slate-500 cursor-not-allowed border-slate-800 shadow-none"
            )}
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
                {isSpinning ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        SPINNING...
                    </>
                 ) : (isActuallyDisabled ? formatTime(timeLeft) : 'SPIN TO WIN!')}
                {!isSpinning && !isActuallyDisabled && <Zap className="w-4 h-4 text-emerald-400 fill-current animate-pulse" />}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
          </Button>
          
          {!isActuallyDisabled && !isSpinning && (
            <p className="text-[10px] text-slate-400 text-center font-black uppercase tracking-widest animate-pulse">
                Click to unlock executive rewards
            </p>
          )}
      </div>
    </div>
  );
}

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={cn("animate-spin", className)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
