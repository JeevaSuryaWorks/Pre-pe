import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { cn } from '@/lib/utils';

// Lottie animation source (bundled locally for offline/Capacitor support)
const LOTTIE_SRC = '/prepe-loader.lottie';

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
// PrePeSpinner — dotLottie spinner with CSS fallback for tiny sizes
// ─────────────────────────────────────────────────
export const PrePeSpinner: React.FC<{ className?: string }> = ({ className }) => {
  // Detect if the spinner is being used as a small inline element (like inside a button)
  const isSmall = className?.includes('w-3') || 
                  className?.includes('w-4') || 
                  className?.includes('w-5') || 
                  className?.includes('w-6') || 
                  className?.includes('h-3') || 
                  className?.includes('h-4') || 
                  className?.includes('h-5') || 
                  className?.includes('h-6');

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center',
        className,
      )}
      aria-label="Loading…"
    >
      {isSmall ? (
        // Simple, clean, high-performance CSS spinner for buttons and inline elements
        <svg
          className="animate-spin w-full h-full text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3.5"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        // dotLottie animation for larger spinners
        <DotLottieReact
          src={LOTTIE_SRC}
          loop
          autoplay
          speed={1}
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </span>
  );
};

// ─────────────────────────────────────────────────
// BrandLoader — dotLottie loader with optional message
// Sizes: sm | md | lg | xl
// ─────────────────────────────────────────────────
type LoaderSize = 'sm' | 'md' | 'lg' | 'xl';

interface BrandLoaderProps {
  className?: string;
  size?: LoaderSize;
  message?: string;
}

const sizePxMap: Record<LoaderSize, number> = {
  sm: 48,
  md: 64,
  lg: 96,
  xl: 160,
};

const sizeMap: Record<LoaderSize, string> = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-40 h-40',
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
      
      {/* dotLottie Animation */}
      <DotLottieReact
        src={LOTTIE_SRC}
        loop
        autoplay
        speed={1}
        style={{ width: sizePxMap[size], height: sizePxMap[size] }}
      />
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
