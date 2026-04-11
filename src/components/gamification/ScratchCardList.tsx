import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Coins, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ScratchCardProps {
  id: string;
  title: string;
  type: 'GIFT_VOUCHER' | 'REWARD_POINTS' | 'CASHBACK';
  value: number;
  isUnlocked: boolean;
  onScratchComplete: (id: string, value: number) => void;
}

export function ScratchCardItem({ id, title, type, value, isUnlocked, onScratchComplete }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratched, setIsScratched] = useState(false);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    if (!isUnlocked || isScratched) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Make canvas responsive
    canvas.width = canvas.parentElement?.clientWidth || 300;
    canvas.height = canvas.parentElement?.clientHeight || 200;

    // Fill with modern scratch cover (gradient)
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#94a3b8');
    gradient.addColorStop(1, '#64748b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorate the scratch layer
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Scratch to Reveal', canvas.width / 2, canvas.height / 2);

    ctx.globalCompositeOperation = 'destination-out';

    let isDrawing = false;
    let scratchedPixels = 0;
    const totalPixels = canvas.width * canvas.height;

    const getPosition = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ('clientX' in e ? e.clientX : e.touches[0].clientX) - rect.left;
      const y = ('clientY' in e ? e.clientY : e.touches[0].clientY) - rect.top;
      return { x, y };
    };

    const scratch = (x: number, y: number) => {
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();
    };

    const handleStart = (e: MouseEvent | TouchEvent) => {
      isDrawing = true;
      const { x, y } = getPosition(e);
      scratch(x, y);
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      const { x, y } = getPosition(e);
      scratch(x, y);

      // Naive percentage check every few frames
      if (Math.random() > 0.9) checkPercentage();
    };

    const handleEnd = () => {
      isDrawing = false;
      checkPercentage();
    };

    const checkPercentage = () => {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let clear = 0;
      for (let i = 0; i < imgData.data.length; i += 4) {
        if (imgData.data[i + 3] === 0) clear++;
      }
      const p = (clear / totalPixels) * 100;
      setPercent(p);
      if (p > 50 && !isScratched) { // Unveiled enough
        setIsScratched(true);
        onScratchComplete(id, value);
        canvas.style.transition = 'opacity 0.6s';
        canvas.style.opacity = '0'; // fade out the remaining canvas
      }
    };

    // Event listeners
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('touchstart', handleStart);
    canvas.addEventListener('touchmove', handleMove);
    canvas.addEventListener('touchend', handleEnd);

    return () => {
      canvas.removeEventListener('mousedown', handleStart);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseup', handleEnd);
      canvas.removeEventListener('touchstart', handleStart);
      canvas.removeEventListener('touchmove', handleMove);
      canvas.removeEventListener('touchend', handleEnd);
    };
  }, [isUnlocked, isScratched]);

  return (
    <Card className="relative w-full h-[200px] overflow-hidden rounded-2xl shadow-xl border border-slate-200">
        
      {/* Background/Revealed Content */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-br ${type === 'CASHBACK' ? 'from-green-100 to-emerald-200 text-emerald-800' : 'from-indigo-100 to-violet-200 text-indigo-800'}`}>
        {!isUnlocked && (
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-20 flex items-center justify-center flex-col text-white px-4 text-center">
              <Gift className="w-8 h-8 mb-2 opacity-50" />
              <p className="font-semibold text-lg">Locked Voucher</p>
              <p className="text-sm opacity-80 mt-1">Recharge more to unlock.</p>
           </div>
        )}
        <Sparkles className="w-12 h-12 mb-3 opacity-30 absolute top-4 left-4" />
        <div className="z-10 flex flex-col items-center">
            {type === 'REWARD_POINTS' && <Coins className="w-12 h-12 mb-2" />}
            {type === 'CASHBACK' && <span className="text-4xl font-black mb-2 opacity-80">₹</span>}
            {type === 'GIFT_VOUCHER' && <Gift className="w-12 h-12 mb-2" />}
            
            <h3 className="font-bold text-2xl mb-1">{type === 'CASHBACK' ? `₹${value}` : `${value} ${type === 'REWARD_POINTS' ? 'Pts' : ''}`}</h3>
            <p className="font-medium text-center opacity-80 max-w-[200px] leading-tight">{title}</p>
        </div>
      </div>

      {/* Canvas Cover */}
      {isUnlocked && !isScratched && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full z-30 cursor-crosshair touch-none"
        />
      )}
    </Card>
  );
}
