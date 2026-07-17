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
export const PrePeSpinner: React.FC<{ className?: string }> = ({ className }) => {
  const uniqueId = React.useId().replace(/:/g, "-");
  
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
        // Simple, clean, high-performance spinner for buttons and inline elements
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
        // Premium brand-styled vector SVG loader for page level / main dashboards
        <>
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <defs>
              <linearGradient id={`orangeGrad-${uniqueId}`} x1="30" y1="35" x2="80" y2="30" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFA040" />
                <stop offset="100%" stopColor="#FF671F" />
              </linearGradient>
              
              <linearGradient id={`greenGrad-${uniqueId}`} x1="28" y1="75" x2="75" y2="42" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#00A000" />
                <stop offset="100%" stopColor="#046A38" />
              </linearGradient>

              <linearGradient id={`spinnerGrad-${uniqueId}`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FF671F" />
                <stop offset="50%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#046A38" />
              </linearGradient>
            </defs>

            {/* Rotating outer BBPS orbit ring */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke={`url(#spinnerGrad-${uniqueId})`}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="60 120"
              className="animate-spin-loader"
              style={{ transformOrigin: 'center' }}
            />

            {/* Ambient pulse background */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="rgba(99, 102, 241, 0.03)"
              className="animate-pulse"
            />

            {/* Logo Group */}
            <g className="animate-logo-pulse" style={{ transformOrigin: 'center' }}>
              {/* P Left Stem (Green) */}
              <path d="M28,34 L48,34 L40,75 L28,75 Z" fill={`url(#greenGrad-${uniqueId})`} />
              
              {/* Lightning Bolt (White) */}
              <path d="M48,37 L33,56 L41,56 L31,73 L46,49 L38,49 Z" fill="#FFFFFF" />
              
              {/* P Loop (Orange) */}
              <path d="M30,35 C30,35 60,32 55,53 C51,70 30,55 30,55" fill="none" stroke={`url(#orangeGrad-${uniqueId})`} strokeWidth="10" strokeLinecap="round" />
              
              {/* Rupee Symbol (Green) */}
              <text x="35" y="68" fill="#046A38" fontSize="13" fontWeight="900" fontFamily="sans-serif">₹</text>

              {/* Rising swoosh green */}
              <path d="M48,75 Q70,75 75,42" fill="none" stroke={`url(#greenGrad-${uniqueId})`} strokeWidth="5.5" strokeLinecap="round" />
              
              {/* Rising swoosh white */}
              <path d="M49,71 Q68,71 72,45" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />

              {/* Rising swoosh orange + arrow head */}
              <path d="M57,63 Q74,63 78,35" fill="none" stroke={`url(#orangeGrad-${uniqueId})`} strokeWidth="6" strokeLinecap="round" />
              <path d="M72,30 L83,30 L80,41 Z" fill="#FF671F" />
            </g>
          </svg>

          <style>{`
            @keyframes spin-loader {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes logo-pulse {
              0% { transform: scale(1); opacity: 0.95; }
              50% { transform: scale(1.04); opacity: 1; }
              100% { transform: scale(1); opacity: 0.95; }
            }
            .animate-spin-loader {
              animation: spin-loader 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            }
            .animate-logo-pulse {
              animation: logo-pulse 2s ease-in-out infinite;
            }
          `}</style>
        </>
      )}
    </span>
  );
};

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
