import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Coins, Sparkles, Trophy, Copy, ExternalLink, CheckCircle2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ScratchModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: {
    id: string;
    title: string;
    type: 'GIFT_VOUCHER' | 'REWARD_POINTS' | 'CASHBACK' | 'PROMO_CODE' | 'OFFER';
    value: number;
    promo_code?: string;
    offer_url?: string;
  };
  onComplete: (id: string, value: number) => void;
}

export function ScratchModal({ isOpen, onClose, card, onComplete }: ScratchModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratched, setIsScratched] = useState(false);
  const [percent, setPercent] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen || isScratched) return;
    
    // Short delay to ensure dialog animation finishes
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Scale for high DPI
      const r = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      canvas.width = r.width * scale;
      canvas.height = r.height * scale;
      ctx.scale(scale, scale);

      // Draw metallic cover
      const gradient = ctx.createLinearGradient(0, 0, r.width, r.height);
      gradient.addColorStop(0, '#e2e8f0');
      gradient.addColorStop(0.5, '#94a3b8');
      gradient.addColorStop(1, '#475569');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, r.width, r.height);

      // Noise/Texture
      for (let i = 0; i < 200; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.1})`;
        ctx.beginPath();
        ctx.arc(Math.random() * r.width, Math.random() * r.height, Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SCRATCH HERE', r.width / 2, r.height / 2);

      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 45;

      let isDrawing = false;
      const totalPixels = r.width * r.height;

      const getPos = (e: MouseEvent | TouchEvent) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
      };

      const handleStart = (e: any) => { isDrawing = true; handleMove(e); };
      const handleMove = (e: any) => {
        if (!isDrawing) return;
        const { x, y } = getPos(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y);
        ctx.stroke();
        if (Math.random() > 0.95) checkPercent();
      };
      const handleEnd = () => { isDrawing = false; checkPercent(); };

      const checkPercent = () => {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let clear = 0;
        for (let i = 0; i < imgData.data.length; i += 4) {
          if (imgData.data[i + 3] === 0) clear++;
        }
        const p = (clear / (canvas.width * canvas.height)) * 100;
        setPercent(p);
        if (p > 50 && !isScratched) {
          setIsScratched(true);
          onComplete(card.id, card.value);
        }
      };

      canvas.addEventListener('mousedown', handleStart);
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      canvas.addEventListener('touchstart', handleStart);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);

      return () => {
        canvas.removeEventListener('mousedown', handleStart);
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        canvas.removeEventListener('touchstart', handleStart);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, isScratched]);

  const copyCode = () => {
    if (card.promo_code) {
      navigator.clipboard.writeText(card.promo_code);
      toast({ title: "Code Copied!", description: "The promo code has been copied to your clipboard." });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogOverlay className="backdrop-blur-xl bg-slate-900/60" />
      <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-lg w-[90vw]">
        <div className="relative overflow-hidden rounded-[3rem] bg-white shadow-[0_0_50px_rgba(0,0,0,0.3)] min-h-[450px] flex flex-col">
            
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 z-50 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>

            {/* Revealed Content (underneath) */}
            <div className={`flex-1 flex flex-col items-center justify-center p-10 text-center bg-gradient-to-br ${
                card.type === 'CASHBACK' ? 'from-emerald-50 to-green-100' : 
                card.type === 'REWARD_POINTS' ? 'from-indigo-50 to-violet-100' : 
                card.type === 'PROMO_CODE' ? 'from-amber-50 to-orange-100' :
                'from-blue-50 to-indigo-100'
            }`}>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={isScratched ? { scale: 1, opacity: 1 } : { opacity: 0.2 }}
                  className="space-y-6"
                >
                  <div className={`mx-auto w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl rotate-3 ${
                      card.type === 'CASHBACK' ? 'bg-emerald-500 text-white' : 
                      card.type === 'REWARD_POINTS' ? 'bg-indigo-600 text-white' : 
                      'bg-amber-500 text-white'
                  }`}>
                      <Trophy className="w-12 h-12" />
                  </div>
                  
                  <div>
                    <h2 className="text-3xl font-black tracking-tighter text-slate-900 mb-2">
                        {card.type === 'CASHBACK' ? `₹${card.value} Cashback` : 
                         card.type === 'REWARD_POINTS' ? `${card.value} Reward Points` :
                         card.type === 'PROMO_CODE' ? 'Promo Code Unlocked!' :
                         'Exclusive Offer'}
                    </h2>
                    <p className="text-slate-500 font-medium max-w-[300px] mx-auto leading-relaxed">
                        {card.title}
                    </p>
                  </div>

                  {isScratched && (
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="space-y-6 pt-4"
                    >
                        {card.promo_code && (
                            <div className="bg-white/60 p-4 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-between gap-4">
                                <span className="font-mono font-black text-xl tracking-widest text-slate-700">{card.promo_code}</span>
                                <Button size="sm" onClick={copyCode} className="rounded-xl flex gap-2">
                                    <Copy className="w-4 h-4" /> Copy
                                </Button>
                            </div>
                        )}

                        {card.offer_url && (
                             <Button className="w-full h-14 rounded-2xl shadow-lg flex gap-2 font-bold text-lg" asChild>
                                <a href={card.offer_url} target="_blank" rel="noopener noreferrer">
                                    Claim Now <ExternalLink className="w-5 h-5" />
                                </a>
                             </Button>
                        )}

                        {!card.promo_code && !card.offer_url && (
                             <div className="flex items-center gap-2 justify-center text-emerald-600 font-bold bg-emerald-50 py-3 rounded-2xl">
                                <CheckCircle2 className="w-5 h-5" /> Added to your account
                             </div>
                        )}
                    </motion.div>
                  )}
                </motion.div>
            </div>

            {/* Canvas (Cover) */}
            <AnimatePresence>
                {!isScratched && (
                    <motion.div
                        exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
                        className="absolute inset-0 z-40 touch-none"
                    >
                        <canvas 
                            ref={canvasRef}
                            className="w-full h-full cursor-crosshair"
                        />
                        
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-widest pointer-events-none">
                            Scratch Reveal: {Math.round(percent)}%
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
