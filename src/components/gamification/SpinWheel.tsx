import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Gift, Coins, Zap, Star } from 'lucide-react';

interface SpinWheelProps {
  onSpinComplete: (points: number) => void;
  disabled?: boolean;
}

const slices = [
  { id: 1, label: '10 Pts', value: 10, color: '#f87171', icon: Coins },
  { id: 2, label: '50 Pts', value: 50, color: '#fbbf24', icon: Star },
  { id: 3, label: '100 Pts', value: 100, color: '#34d399', icon: Zap },
  { id: 4, label: 'Oops', value: 0, color: '#94a3b8', icon: Gift },
  { id: 5, label: '20 Pts', value: 20, color: '#60a5fa', icon: Coins },
  { id: 6, label: '5 Pts', value: 5, color: '#a78bfa', icon: Star },
];

export function SpinWheel({ onSpinComplete, disabled }: SpinWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const { toast } = useToast();
  
  const spin = () => {
    if (isSpinning || disabled) return;
    setIsSpinning(true);
    
    // In a real app, you'd call the backend here to determine the prize,
    // to prevent client-side manipulation. For now, we simulate a random prize.
    const prizeIndex = Math.floor(Math.random() * slices.length);
    const prize = slices[prizeIndex];
    
    // Calculate new rotation to land on the chosen prize
    // 360 / slices.length is the angle per slice.
    // We add 5 full rotations (360 * 5) for dramatic effect.
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
    }, 4000); // Wait for the transition to finish
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      <div className="relative w-72 h-72">
        {/* Pointer */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 z-20 drop-shadow-md">
            <svg viewBox="0 0 24 24" fill="currentColor" className="text-slate-800">
                <path d="M12 2L2 22h20L12 2z" />
            </svg>
        </div>

        {/* Wheel container */}
        <motion.div
          className="w-full h-full rounded-full border-4 border-white shadow-2xl relative overflow-hidden"
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.1, 0.9, 0.2, 1] }} // smooth deceleration
        >
          {slices.map((slice, index) => {
            const angle = (360 / slices.length) * index;
            const Icon = slice.icon;
            return (
              <div
                key={slice.id}
                className="absolute w-[50%] h-[50%] top-0 right-0 origin-bottom-left flex items-center justify-center p-4 border border-white/20 hover:brightness-110 transition-all"
                style={{
                  backgroundColor: slice.color,
                  transform: `rotate(${angle}deg)`,
                  clipPath: 'polygon(0 100%, 100% 0, 100% 100%)',
                }}
              >
                 <div 
                    className="absolute bottom-4 right-4 flex flex-col items-center transform -rotate-45"
                 >
                    <Icon className="w-5 h-5 text-white mb-1" />
                    <span className="text-white font-bold text-sm tracking-tight">{slice.label}</span>
                 </div>
              </div>
            );
          })}
        </motion.div>
        
        {/* Center Button */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full p-1 shadow-lg z-10 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-full border-2 border-white flex items-center justify-center shadow-inner">
                <span className="text-white font-bold text-sm">SPIN</span>
            </div>
        </div>
      </div>

      <Button 
        onClick={spin} 
        disabled={isSpinning || disabled}
        className="w-full max-w-xs h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-lg rounded-xl shadow-lg transform active:scale-95 transition-all"
      >
        {isSpinning ? 'SPINNING...' : (disabled ? 'COME BACK LATER' : 'SPIN TO WIN!')}
      </Button>
    </div>
  );
}
