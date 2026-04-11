import React from 'react';
import { cn } from '@/lib/utils';

type AnimationType = 'bounce' | 'pulse' | 'spin';

interface BrandLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animation?: AnimationType;
  color?: string;
}

/**
 * BrandLoader - A premium "PP" animated loader for Prepe.
 * Supports 3 animation types: bounce, pulse, and spin.
 * Default color is emerald (Green).
 */
export const BrandLoader: React.FC<BrandLoaderProps> = ({
  className,
  size = 'md',
  animation = 'bounce',
  color = 'text-emerald-500',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xl',
    md: 'w-10 h-10 text-2xl',
    lg: 'w-16 h-16 text-4xl',
    xl: 'w-24 h-24 text-6xl',
  };

  const renderBounce = () => (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      <span className={cn("font-black tracking-tighter animate-bounce [animation-delay:-0.3s]", color, sizeClasses[size])}>P</span>
      <span className={cn("font-black tracking-tighter animate-bounce [animation-delay:-0.15s]", color, sizeClasses[size])}>P</span>
    </div>
  );

  const renderPulse = () => (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div className={cn("absolute inset-0 bg-emerald-400/20 rounded-full blur-xl animate-pulse")} />
      <div className="flex font-black tracking-tighter animate-in zoom-in-50 duration-1000 repeat-infinite">
        <span className={cn(color, sizeClasses[size], "animate-pulse")}>P</span>
        <span className={cn(color, sizeClasses[size], "animate-pulse [animation-delay:200ms]")}>P</span>
      </div>
    </div>
  );

  const renderSpin = () => (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className={cn("absolute border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin", sizeClasses[size])} />
        <div className="flex font-black tracking-tighter scale-75">
            <span className={cn(color, "text-2xl")}>P</span>
            <span className={cn(color, "text-2xl")}>P</span>
        </div>
      </div>
    </div>
  );

  switch (animation) {
    case 'pulse': return renderPulse();
    case 'spin': return renderSpin();
    case 'bounce':
    default: return renderBounce();
  }
};

/**
 * Global Full Screen Overlay Loader
 */
export const LoadingOverlay: React.FC<{ message?: string; animation?: AnimationType }> = ({ 
  message = "Loading Securely...", 
  animation = 'bounce' 
}) => (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md animate-in fade-in duration-500">
    <BrandLoader size="lg" animation={animation} />
    {message && (
      <p className="mt-4 text-emerald-800 font-bold tracking-widest text-xs uppercase animate-pulse">
        {message}
      </p>
    )}
  </div>
);
