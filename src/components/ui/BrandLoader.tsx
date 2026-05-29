import React from 'react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────
// Pre-pe Brand Logo Component (Renders the new branding icon)
// ─────────────────────────────────────────────────
export const PrePeLogo: React.FC<{ className?: string; animated?: boolean }> = ({
  className,
  animated = false,
}) => (
  <div className={cn('relative flex items-center justify-center rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/25 shadow-sm p-1', className)}>
    <img 
      src="/icon_new.png" 
      alt="Pre-pe logo" 
      className={cn(
        'w-full h-full object-contain rounded-xl select-none',
        animated && 'animate-[logo-breathe_2s_ease-in-out_infinite]'
      )}
    />
  </div>
);

// ─────────────────────────────────────────────────
// PrePeSpinner — Premium concentric rotating spinner
// ─────────────────────────────────────────────────
export const PrePeSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <span
    className={cn(
      'relative inline-flex shrink-0 items-center justify-center',
      className,
    )}
    aria-label="Loading…"
  >
    <style>{`
      @keyframes logo-breathe {
        0%, 100% {
          transform: scale(0.93);
          filter: drop-shadow(0 0 6px rgba(62, 207, 178, 0.4)) drop-shadow(0 0 15px rgba(123, 94, 167, 0.2));
        }
        50% {
          transform: scale(1.05);
          filter: drop-shadow(0 0 12px rgba(62, 207, 178, 0.6)) drop-shadow(0 0 25px rgba(123, 94, 167, 0.4));
        }
      }
      @keyframes rotate-cw {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes rotate-ccw {
        0% { transform: rotate(360deg); }
        100% { transform: rotate(0deg); }
      }
      @keyframes pulse-ring {
        0% {
          transform: scale(0.85);
          opacity: 0.9;
        }
        100% {
          transform: scale(1.25);
          opacity: 0;
        }
      }
      @keyframes loader-glow-pulse {
        0%, 100% {
          transform: scale(1);
          opacity: 0.4;
          filter: blur(16px);
        }
        50% {
          transform: scale(1.15);
          opacity: 0.7;
          filter: blur(24px);
        }
      }
      @keyframes shimmer-text {
        0% { background-position: 0% 50%; }
        100% { background-position: 200% 50%; }
      }
    `}</style>
    
    {/* Outer Expanding Ripples (Radar Waves) */}
    <div className="absolute inset-0 rounded-full border border-teal-400/35 animate-[pulse-ring_2.2s_cubic-bezier(0.215,0.61,0.355,1)_infinite]" />
    <div className="absolute inset-0 rounded-full border border-purple-400/25 animate-[pulse-ring_2.2s_cubic-bezier(0.215,0.61,0.355,1)_infinite] [animation-delay:0.8s]" />

    {/* Concentric Double-Rotation Rings */}
    {/* Outer Dashed Ring (Clockwise) */}
    <svg
      viewBox="0 0 36 36"
      className="absolute inset-0 w-full h-full animate-[rotate-cw_6.5s_linear_infinite]"
      fill="none"
    >
      <circle
        cx="18"
        cy="18"
        r="16.5"
        stroke="url(#outer-ring-grad)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeDasharray="50 30 15 25"
      />
      <defs>
        <linearGradient id="outer-ring-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3ECFB2" />
          <stop offset="1" stopColor="#7B5EA7" />
        </linearGradient>
      </defs>
    </svg>

    {/* Inner Glowing Segmented Ring (Counter-Clockwise) */}
    <svg
      viewBox="0 0 36 36"
      className="absolute inset-[9%] w-[82%] h-[82%] animate-[rotate-ccw_3.2s_linear_infinite]"
      fill="none"
    >
      <circle
        cx="18"
        cy="18"
        r="15"
        stroke="url(#inner-ring-grad)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeDasharray="40 40"
        opacity="0.85"
      />
      <defs>
        <linearGradient id="inner-ring-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7B5EA7" />
          <stop offset="1" stopColor="#3ECFB2" />
        </linearGradient>
      </defs>
    </svg>

    {/* Central Pulsing/Breathing Logo (New Rebranded Icon) */}
    <div className="absolute w-[50%] h-[50%] z-10 flex items-center justify-center animate-[logo-breathe_2s_ease-in-out_infinite]">
      <img 
        src="/icon_new.png" 
        alt="Pre-pe logo" 
        className="w-full h-full object-contain rounded-lg shadow-md bg-white p-0.5" 
      />
    </div>
  </span>
);

// ─────────────────────────────────────────────────
// BrandLoader — High-fidelity loaded with message
// Sizes: sm | md | lg | xl
// ─────────────────────────────────────────────────
type LoaderSize = 'sm' | 'md' | 'lg' | 'xl';

interface BrandLoaderProps {
  className?: string;
  size?: LoaderSize;
  message?: string;
}

const sizeMap: Record<LoaderSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-20 h-20',
  xl: 'w-32 h-32',
};

export const BrandLoader: React.FC<BrandLoaderProps> = ({
  className,
  size = 'md',
  message,
}) => (
  <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
    <div className={cn('relative', sizeMap[size])}>
      {/* Background radial glow aura */}
      <div className="absolute inset-[-18%] rounded-full bg-gradient-to-br from-teal-400/20 to-purple-500/20 blur-xl animate-[loader-glow-pulse_3s_ease-in-out_infinite]" />
      
      {/* New Concentric Spinner */}
      <PrePeSpinner className={sizeMap[size]} />
    </div>
    
    {message && (
      <div className="flex flex-col items-center gap-1.5 mt-1">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-purple-500 to-teal-500 bg-[length:200%_auto] animate-[shimmer-text_2.5s_linear_infinite] text-center">
          {message}
        </p>
        {/* Shimmering indicator line */}
        <span className="h-[2px] w-8 rounded-full bg-gradient-to-r from-teal-400 to-purple-500 opacity-60 animate-[loader-glow-pulse_1.5s_infinite]" />
      </div>
    )}
  </div>
);

// ─────────────────────────────────────────────────
// PageLoader — Glassmorphic fullscreen overlay loader
// ─────────────────────────────────────────────────
export const PageLoader: React.FC<{ message?: string }> = ({
  message = 'Loading Securely…',
}) => (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/25 backdrop-blur-md animate-in fade-in duration-300">
    <div className="bg-white/80 border border-white/30 px-10 py-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center max-w-[320px] w-full mx-4">
      <BrandLoader size="lg" message={message} />
    </div>
  </div>
);

// ─────────────────────────────────────────────────
// LoadingOverlay — alias of PageLoader (backwards compat)
// ─────────────────────────────────────────────────
export const LoadingOverlay = PageLoader;

export default BrandLoader;
