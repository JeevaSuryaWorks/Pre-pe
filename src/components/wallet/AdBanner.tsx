import React from 'react';
import { Button } from '@/components/ui/button';
import { Zap, X, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AdBanner() {
    const navigate = useNavigate();
    const [visible, setVisible] = React.useState(true);

    if (!visible) return null;

    return (
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 text-white shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="absolute top-[-10px] right-[-10px] opacity-10">
                <Star className="w-24 h-24 rotate-12" />
            </div>
            
            <button 
                onClick={() => setVisible(false)}
                className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded-full transition-colors"
            >
                <X className="w-4 h-4 text-white/60" />
            </button>

            <div className="flex items-center gap-4 relative z-10">
                <div className="bg-white/20 p-2 rounded-xl">
                    <Zap className="w-6 h-6 text-amber-300 fill-current" />
                </div>
                <div className="flex-1 pr-4">
                    <h3 className="text-sm font-black tracking-tight">UPGRADE TO PRO</h3>
                    <p className="text-[10px] text-white/80 font-medium">Remove ads & unlock ₹10k/day wallet limits instantly!</p>
                </div>
                <Button 
                    size="sm" 
                    className="bg-white text-blue-600 hover:bg-blue-50 font-black text-[10px] px-3 h-8"
                    onClick={() => navigate('/onboarding/plans')}
                >
                    UPGRADE
                </Button>
            </div>
        </div>
    );
}
