import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Star, Timer, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinWheelProps {
  onSpinComplete: (points: number) => void;
  disabled?: boolean;
  remainingSpins?: number;
  nextResetTime?: string | null;
}

const slices = [
  { id: 1, label: '50 Pts', value: 50, color: 'from-amber-400 to-yellow-600' },
  { id: 2, label: '10 Pts', value: 10, color: 'from-rose-500 to-red-600' },
  { id: 3, label: '500 Pts', value: 500, color: 'from-indigo-500 to-purple-600' },
  { id: 4, label: 'Oops', value: 0, color: 'from-slate-700 to-slate-900' },
  { id: 5, label: '100 Pts', value: 100, color: 'from-emerald-500 to-green-600' },
  { id: 6, label: '25 Pts', value: 25, color: 'from-sky-400 to-blue-600' },
  { id: 7, label: 'Bonus', value: 150, color: 'from-fuchsia-500 to-purple-600' },
  { id: 8, label: '5 Pts', value: 5, color: 'from-orange-400 to-orange-600' },
];

export function SpinWheel({ onSpinComplete, disabled, remainingSpins = 0, nextResetTime }: SpinWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [showPrize, setShowPrize] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const angleRef = useRef(0);
  const isSpinningRef = useRef(false);
  const requestRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastSliceIndexRef = useRef(-1);

  // Setup Initial Canvas Draw
  useEffect(() => {
    drawWheel(angleRef.current);
    
    const handleResize = () => {
      drawWheel(angleRef.current);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Calculate time until next reset (Calendar Day)
  useEffect(() => {
    if (remainingSpins > 0 || !nextResetTime) {
        setTimeLeft(0);
        return;
    }

    const calculateTimeLeft = () => {
        const reset = new Date(nextResetTime).getTime();
        const now = Date.now();
        const diff = reset - now;
        return Math.max(0, Math.floor(diff / 1000));
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
        const remaining = calculateTimeLeft();
        setTimeLeft(remaining);
        if (remaining <= 0) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSpins, nextResetTime]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const playTickSound = (vel: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // High to low frequency sweep to simulate a snappy mechanical "peg click"
    osc.type = 'sine';
    const startFreq = 900 + Math.min(vel * 1200, 700);
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.03);
    
    // Volume envelope linked to velocity for maximum tactile realism
    gain.gain.setValueAtTime(0.06 * Math.min(vel * 5, 1.2), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    
    osc.start(now);
    osc.stop(now + 0.035);
  };

  const playVictoryChime = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // Rich synthesized major arpeggio
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      
      gain.gain.setValueAtTime(0, now + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.55);
      
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.6);
    });
  };

  const drawWheel = (currentAngle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const size = canvas.clientWidth;
    
    if (canvas.width !== size * dpr) {
      canvas.width = size * dpr;
      canvas.height = size * dpr;
    }
    
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);
    
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 4;
    
    ctx.translate(cx, cy);
    ctx.rotate(currentAngle);
    
    const sliceAngle = Math.PI / 4;
    
    slices.forEach((slice, i) => {
      const startAngle = i * sliceAngle;
      const endAngle = (i + 1) * sliceAngle;
      
      // Draw Slice Sector
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      
      // Slice Gradients
      const grad = ctx.createLinearGradient(0, 0, radius * Math.cos(startAngle + sliceAngle / 2), radius * Math.sin(startAngle + sliceAngle / 2));
      if (slice.color === 'from-amber-400 to-yellow-600') {
        grad.addColorStop(0, '#fbbf24');
        grad.addColorStop(1, '#ca8a04');
      } else if (slice.color === 'from-rose-500 to-red-600') {
        grad.addColorStop(0, '#f43f5e');
        grad.addColorStop(1, '#e11d48');
      } else if (slice.color === 'from-indigo-500 to-purple-600') {
        grad.addColorStop(0, '#6366f1');
        grad.addColorStop(1, '#7c3aed');
      } else if (slice.color === 'from-slate-700 to-slate-900') {
        grad.addColorStop(0, '#475569');
        grad.addColorStop(1, '#0f172a');
      } else if (slice.color === 'from-emerald-500 to-green-600') {
        grad.addColorStop(0, '#10b981');
        grad.addColorStop(1, '#059669');
      } else if (slice.color === 'from-sky-400 to-blue-600') {
        grad.addColorStop(0, '#38bdf8');
        grad.addColorStop(1, '#2563eb');
      } else if (slice.color === 'from-fuchsia-500 to-purple-600') {
        grad.addColorStop(0, '#d946ef');
        grad.addColorStop(1, '#9333ea');
      } else {
        grad.addColorStop(0, '#fb923c');
        grad.addColorStop(1, '#ea580c');
      }
      
      ctx.fillStyle = grad;
      ctx.fill();
      
      // Segment Borders
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Draw Outer Pegs
      ctx.save();
      const midAngle = startAngle + sliceAngle / 2;
      ctx.rotate(midAngle);
      
      ctx.beginPath();
      ctx.arc(radius - 6, 0, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Draw Text label & Emojis
      ctx.translate(radius * 0.62, 0);
      ctx.rotate(Math.PI / 2);
      
      const emojiMap: Record<number, string> = {
        1: '⭐', // 50 Pts
        2: '🪙', // 10 Pts
        3: '🏆', // 500 Pts
        4: '🎁', // Oops
        5: '⚡', // 100 Pts
        6: '🪙', // 25 Pts
        7: '✨', // Bonus
        8: '🪙', // 5 Pts
      };
      
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.font = '16px sans-serif';
      ctx.fillText(emojiMap[slice.id] || '🪙', 0, -11);
      
      ctx.font = '900 10px "Outfit", "Inter", sans-serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 3;
      ctx.fillText(slice.label.toUpperCase(), 0, 9);
      ctx.shadowBlur = 0;
      
      ctx.restore();
    });
    
    ctx.restore();
  };

  const spin = () => {
    if (isSpinning || disabled || timeLeft > 0 || remainingSpins <= 0) return;
    
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    
    setIsSpinning(true);
    isSpinningRef.current = true;
    setShowPrize(null);
    
    // Physics Deceleration Setup
    let velocity = 0.28 + Math.random() * 0.12; 
    const friction = 0.983 + Math.random() * 0.003; 
    
    const animate = () => {
      if (velocity < 0.0015) {
        // Stopped completely!
        isSpinningRef.current = false;
        setIsSpinning(false);
        
        let normalized = (1.5 * Math.PI - angleRef.current) % (2 * Math.PI);
        if (normalized < 0) normalized += 2 * Math.PI;
        
        const sliceAngle = Math.PI / 4;
        const prizeIndex = Math.floor(normalized / sliceAngle) % 8;
        const prize = slices[prizeIndex];
        
        setShowPrize(prize.value);
        playVictoryChime();
        
        setTimeout(() => {
          onSpinComplete(prize.value);
        }, 500);
        
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
          requestRef.current = null;
        }
        return;
      }
      
      angleRef.current += velocity;
      velocity *= friction;
      
      // Calculate Peg Clicking crossings
      const sliceAngle = Math.PI / 4;
      const currentSlice = Math.floor((angleRef.current + Math.PI / 2) / sliceAngle);
      if (currentSlice !== lastSliceIndexRef.current) {
        lastSliceIndexRef.current = currentSlice;
        playTickSound(velocity);
      }
      
      drawWheel(angleRef.current);
      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);
  };

  const isActuallyDisabled = (remainingSpins <= 0 || disabled) && !isSpinning;

  return (
    <div className="flex flex-col items-center justify-center space-y-10 relative">
      <div className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center">
        
        {/* Outer Metallic Rim with Lights */}
        <div className="absolute -inset-6 rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 shadow-[0_0_60px_rgba(99,102,241,0.6)] p-2 overflow-hidden">
            <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.6),transparent)] animate-spin-slow pointer-events-none" />
            
            {/* LED Dots around the rim */}
            {[...Array(12)].map((_, i) => (
                <motion.div
                    key={i}
                    animate={isSpinning ? { 
                        opacity: [0.5, 1, 0.5],
                        scale: [0.8, 1.4, 0.8],
                        backgroundColor: i % 2 === 0 ? '#fde047' : '#ffffff',
                        boxShadow: i % 2 === 0 ? '0 0 20px #fde047' : '0 0 20px #ffffff'
                    } : { opacity: 0.6 }}
                    transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.08 }}
                    className="absolute w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_white]"
                    style={{
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-144px)`
                    }}
                />
            ))}
            
            <div className="w-full h-full rounded-full bg-slate-900 shadow-inner" />
        </div>

        {/* Pointer (The Needle) - Stationary */}
        <div 
            className="absolute z-30 drop-shadow-2xl origin-[50%_150px]"
            style={{ top: '-10px', height: '160px', width: '30px' }}
        >
            <div className="relative w-full h-[60px] flex justify-center">
                <svg viewBox="0 0 40 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                    <path d="M20 60L5 10C5 10 5 0 20 0C35 0 35 10 35 10L20 60Z" fill="url(#needle-grad)" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                    <circle cx="20" cy="15" r="6" fill="url(#dot-grad)" />
                    <defs>
                        <linearGradient id="needle-grad" x1="20" y1="0" x2="20" y2="60" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#f8fafc" />
                            <stop offset="1" stopColor="#94a3b8" />
                        </linearGradient>
                        <linearGradient id="dot-grad" x1="20" y1="9" x2="20" y2="21" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#f43f5e" />
                            <stop offset="1" stopColor="#e11d48" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        </div>

        {/* High-DPI Canvas Wheel container */}
        <div className={cn(
            "relative w-full h-full p-1 bg-slate-950 rounded-full shadow-2xl border-4 border-slate-900 overflow-hidden transition-all duration-500 flex items-center justify-center",
            isActuallyDisabled && "opacity-40 grayscale-[0.5] scale-95"
        )}>
          <canvas 
            ref={canvasRef} 
            className="w-full h-full rounded-full bg-slate-950 pointer-events-none"
            style={{ aspectRatio: '1/1' }}
          />

          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none z-10" />
          <div className="absolute inset-4 border border-white/5 rounded-full pointer-events-none z-10" />

          {/* Center piece */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-300 rounded-full p-1 shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-20">
              <div className="w-full h-full bg-slate-950 rounded-full border-2 border-slate-50 flex items-center justify-center shadow-inner overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/30 to-transparent animate-pulse" />
                  <Star className={cn("w-6 h-6 text-yellow-400 relative z-10")} />
              </div>
          </div>
        </div>

        {/* Rolling Timer Overlay */}
        <AnimatePresence>
            {isActuallyDisabled && !isSpinning && (
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
                        Limits reset at midnight
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <div className="w-full max-w-xs space-y-4">
          <AnimatePresence>
             {!isSpinning && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                      <Button 
                        onClick={spin} 
                        disabled={isActuallyDisabled}
                        className={cn(
                            "w-full h-16 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xl rounded-2xl shadow-[0_10px_30px_rgba(79,70,229,0.4)] transition-all group overflow-hidden relative border border-white/20",
                            isActuallyDisabled && "bg-slate-900/50 bg-none text-slate-500 cursor-not-allowed border-slate-800 shadow-none hover:bg-slate-900/50"
                        )}
                      >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            {isActuallyDisabled ? `0 SPINS REMAINING` : `SPIN NOW (${remainingSpins} LEFT)`}
                            {!isActuallyDisabled && <Zap className="w-4 h-4 text-emerald-400 fill-current animate-pulse" />}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                      </Button>
                      
                      {showPrize !== null && (
                        <motion.div 
                           initial={{ opacity: 0, scale: 0.5, y: -20 }}
                           animate={{ opacity: 1, scale: 1, y: 0 }}
                           className="mt-4 bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-[0_0_80px_rgba(79,70,229,0.3)] border-2 border-indigo-100 flex flex-col items-center"
                        >
                            <span className="text-3xl mb-2 animate-bounce">🎉</span>
                            <h2 className="text-2xl font-black text-slate-950 tracking-tighter drop-shadow-sm">POINT EARNED!</h2>
                            <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 drop-shadow-sm">+{showPrize} PTS</p>
                        </motion.div>
                      )}
                  </motion.div>
             )}
          </AnimatePresence>
          
          {isSpinning && (
              <div className="w-full h-16 flex items-center justify-center">
                  <span className="text-indigo-400 font-black tracking-widest animate-pulse flex items-center gap-2 text-lg">
                      <Loader2 className="w-6 h-6" /> SPINNING...
                  </span>
              </div>
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
