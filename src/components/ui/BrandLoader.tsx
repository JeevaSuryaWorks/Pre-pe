import React from 'react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────
// Pre-pe Brand SVG Logo (exact icon from app icon)
// ─────────────────────────────────────────────────
const PrePeLogo: React.FC<{ className?: string; animated?: boolean }> = ({
  className,
  animated = false,
}) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn('select-none', className)}
    aria-label="Pre-pe logo"
  >
    <defs>
      <linearGradient id="pp-grad-a" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#3ECFB2" />
        <stop offset="100%" stopColor="#7B5EA7" />
      </linearGradient>
      <linearGradient id="pp-grad-b" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#4FD1C5" />
        <stop offset="100%" stopColor="#805AD5" />
      </linearGradient>
    </defs>

    {/* Rounded-rect background */}
    <rect width="100" height="100" rx="22" fill="url(#pp-grad-a)" />

    {/* ── Left "P" shape ── */}
    <g fill="white">
      {/* Left P outer stroke */}
      <path d="M20 72 L20 28 L20 28 C20 28 34 28 34 28 C42 28 47 33 47 40 C47 47 42 52 34 52 L28 52 L28 72 Z" />
      {/* Left P counter (cutout) */}
      <rect x="26" y="33" width="8" height="13" rx="1" fill="url(#pp-grad-a)" />
    </g>

    {/* ── Right "P" shape (mirrored) ── */}
    <g fill="white">
      <path d="M80 72 L80 28 L80 28 C80 28 66 28 66 28 C58 28 53 33 53 40 C53 47 58 52 66 52 L72 52 L72 72 Z" />
      {/* Right P counter (cutout) */}
      <rect x="66" y="33" width="8" height="13" rx="1" fill="url(#pp-grad-a)" />
    </g>

    {/* ── Centre vertical bar (bridge of the PP icon) ── */}
    <rect x="46" y="50" width="8" height="22" rx="2" fill="white" opacity="0.9" />

    {/* Animated glow ring – only when animated=true */}
    {animated && (
      <circle
        cx="50"
        cy="50"
        r="44"
        stroke="url(#pp-grad-b)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="276"
        strokeDashoffset="276"
        opacity="0.7"
        className="animate-[dash_1.4s_ease-in-out_infinite]"
      />
    )}
  </svg>
);

// ─────────────────────────────────────────────────
// PrePeSpinner  — inline spinner (replaces Loader2)
// Usage: <PrePeSpinner className="w-5 h-5" />
// ─────────────────────────────────────────────────
export const PrePeSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <span
    className={cn(
      'relative inline-flex shrink-0 items-center justify-center',
      className,
    )}
    aria-label="Loading…"
  >
    {/* Spinning gradient ring */}
    <svg
      viewBox="0 0 36 36"
      className="absolute inset-0 w-full h-full animate-spin"
      fill="none"
    >
      <circle
        cx="18"
        cy="18"
        r="15"
        stroke="url(#ring-grad)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="70 25"
      />
      <defs>
        <linearGradient id="ring-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3ECFB2" />
          <stop offset="1" stopColor="#7B5EA7" />
        </linearGradient>
      </defs>
    </svg>
    {/* Tiny PP logo centred */}
    <PrePeLogo className="w-[55%] h-[55%] z-10" />
  </span>
);

// ─────────────────────────────────────────────────
// BrandLoader — larger display loader with message
// Sizes: sm | md | lg | xl
// Animations: bounce | pulse | spin (all use logo)
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
  <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
    <div className={cn('relative', sizeMap[size])}>
      {/* Pulsing glow halo */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-400/30 to-purple-500/30 blur-xl animate-pulse" />
      {/* Spinning brand logo */}
      <PrePeSpinner className={cn('relative z-10', sizeMap[size])} />
    </div>
    {message && (
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">
        {message}
      </p>
    )}
  </div>
);

// ─────────────────────────────────────────────────
// PageLoader — fullscreen overlay loader
// Usage: <PageLoader message="Loading..." />
// ─────────────────────────────────────────────────
export const PageLoader: React.FC<{ message?: string }> = ({
  message = 'Loading Securely…',
}) => (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 backdrop-blur-md animate-in fade-in duration-300">
    <BrandLoader size="lg" message={message} />
  </div>
);

// ─────────────────────────────────────────────────
// LoadingOverlay — alias of PageLoader (backwards compat)
// ─────────────────────────────────────────────────
export const LoadingOverlay = PageLoader;

export default BrandLoader;
