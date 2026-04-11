import { ShoppingBag } from "lucide-react";

export const PromoBanner = () => {
    return (
        <div className="px-4 py-2 mb-2">
            {/* Ticket wrapper */}
            <div className="relative w-full bg-[#1A73E8] p-2 flex gap-1 shadow-sm"
                 style={{ 
                     // Wavy edge pure CSS effect approximation 
                     borderRadius: '16px',
                     backgroundImage: 'radial-gradient(circle at 10px 0, transparent 10px, #1a73e8 11px), radial-gradient(circle at 10px 100%, transparent 10px, #1a73e8 11px)',
                     backgroundSize: '100% 100%',
                     backgroundRepeat: 'no-repeat'
                 }}>
                
                {/* Left Section - Brand */}
                <div className="flex-1 bg-white rounded-l-[8px] flex flex-col items-center justify-center py-4 px-2 relative min-h-[90px]">
                    {/* Wavy Cutout dots on left */}
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                        {[1,2,3,4].map(i => <div key={i} className="w-2 h-2 rounded-full bg-[#1a73e8]" />)}
                    </div>

                    <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-[#0046BE] font-black italic text-xl tracking-tight">Flipkart</span>
                        <div className="bg-[#FFC200] p-0.5 rounded shadow-sm">
                            <ShoppingBag className="w-3.5 h-3.5 text-[#0046BE]" />
                        </div>
                    </div>
                    <div className="text-[#0046BE] font-black text-sm uppercase tracking-tight">
                        Shopping Voucher
                    </div>
                </div>

                {/* Dashed Separator inside blue container */}
                <div className="w-[1px] border-r-2 border-dashed border-white/60 my-2 shadow-[0_0_5px_rgba(255,255,255,0.5)]"></div>

                {/* Right Section - Discount */}
                <div className="w-24 bg-white rounded-r-[8px] flex items-center justify-center p-2 relative min-h-[90px]">
                     {/* Wavy Cutout dots on right */}
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                        {[1,2,3,4].map(i => <div key={i} className="w-2 h-2 rounded-full bg-[#1a73e8]" />)}
                    </div>

                    <div className="bg-[#FFEB3B] w-full h-full flex flex-col items-center justify-center p-2 border border-[#FBC02D]">
                        <span className="text-[#0046BE] font-extrabold text-[10px] leading-tight mb-0.5">GET</span>
                        <span className="text-[#0046BE] font-black text-[17px] leading-none mb-0.5 tracking-tighter">1.25%</span>
                        <span className="text-[#0046BE] font-extrabold text-[12px] leading-tight">OFF</span>
                    </div>
                </div>

            </div>
        </div>
    );
};
