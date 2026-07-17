import React from 'react';

interface PrepeLoaderProps {
    size?: 'sm' | 'md' | 'lg' | number;
    className?: string;
    showText?: boolean;
    text?: string;
}

export const PrepeLoader: React.FC<PrepeLoaderProps> = ({
    size = 'md',
    className = '',
    showText = true,
    text = 'Processing Securely...'
}) => {
    // Map preset sizes to pixel dimensions
    const dimensions = typeof size === 'number' 
        ? size 
        : size === 'sm' ? 48 : size === 'lg' ? 96 : 64;

    return (
        <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
            <div className="relative" style={{ width: dimensions, height: dimensions }}>
                <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full"
                >
                    <defs>
                        <linearGradient id="orangeGrad" x1="30" y1="35" x2="80" y2="30" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#FFA040" />
                            <stop offset="100%" stopColor="#FF671F" />
                        </linearGradient>
                        
                        <linearGradient id="greenGrad" x1="28" y1="75" x2="75" y2="42" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#00A000" />
                            <stop offset="100%" stopColor="#046A38" />
                        </linearGradient>

                        <linearGradient id="spinnerGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
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
                        stroke="url(#spinnerGrad)"
                        strokeWidth="2.5"
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
                        <path d="M28,34 L48,34 L40,75 L28,75 Z" fill="url(#greenGrad)" />
                        
                        {/* Lightning Bolt (White) */}
                        <path d="M48,37 L33,56 L41,56 L31,73 L46,49 L38,49 Z" fill="#FFFFFF" />
                        
                        {/* P Loop (Orange) */}
                        <path d="M30,35 C30,35 60,32 55,53 C51,70 30,55 30,55" fill="none" stroke="url(#orangeGrad)" strokeWidth="10" strokeLinecap="round" />
                        
                        {/* Rupee Symbol (Green) */}
                        <text x="35" y="68" fill="#046A38" fontSize="13" fontWeight="900" fontFamily="sans-serif">₹</text>

                        {/* Rising swoosh green */}
                        <path d="M48,75 Q70,75 75,42" fill="none" stroke="url(#greenGrad)" strokeWidth="5.5" strokeLinecap="round" />
                        
                        {/* Rising swoosh white */}
                        <path d="M49,71 Q68,71 72,45" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />

                        {/* Rising swoosh orange + arrow head */}
                        <path d="M57,63 Q74,63 78,35" fill="none" stroke="url(#orangeGrad)" strokeWidth="6" strokeLinecap="round" />
                        <path d="M72,30 L83,30 L80,41 Z" fill="#FF671F" />
                    </g>
                </svg>
            </div>
            {showText && (
                <span className="text-xs text-slate-500 font-extrabold uppercase tracking-widest animate-pulse">
                    {text}
                </span>
            )}
            
            {/* Self-contained styling for specific spinning speeds and custom animations */}
            <style dangerouslySetInnerHTML={{__html: `
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
            `}} />
        </div>
    );
};
