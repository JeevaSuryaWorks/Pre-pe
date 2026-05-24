
import { Button } from "@/components/ui/button";
import { ChevronLeft, FileText, Shield, FileCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LegalPageProps {
    title: string;
    type: 'terms' | 'privacy' | 'refund';
}

const LegalPage = ({ title, type }: LegalPageProps) => {
    const navigate = useNavigate();

    const getIcon = () => {
        switch (type) {
            case 'terms': return <FileText className="h-12 w-12 text-blue-500" />;
            case 'privacy': return <Shield className="h-12 w-12 text-green-500" />;
            case 'refund': return <FileCheck className="h-12 w-12 text-orange-500" />;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FF671F]/5 via-white to-[#046A38]/5 flex justify-center w-full relative overflow-x-hidden">
            {/* Decorative patriotic elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF671F]/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#046A38]/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

            <div className="w-full max-w-md min-h-screen relative flex flex-col z-10">
                {/* Header */}
                <div className="bg-white/80 backdrop-blur-xl px-4 py-5 flex items-center gap-4 sticky top-0 z-20 border-b border-slate-100 shadow-sm">
                    <Button variant="ghost" size="icon" className="rounded-full bg-slate-50 h-10 w-10 text-slate-600 hover:bg-[#FF671F]/10 hover:text-[#FF671F] transition-all" onClick={() => navigate(-1)}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">{title} 🇮🇳</h1>
                </div>

                {/* Content */}
                <div className="p-6 pb-20 flex flex-col items-center">
                    <div className="mb-8 p-6 bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-50 flex items-center justify-center ring-8 ring-slate-50">
                        {getIcon()}
                    </div>

                    <div className="bg-white/90 backdrop-blur-md rounded-[32px] p-8 shadow-2xl shadow-slate-200/40 border border-white space-y-6 text-slate-600 leading-relaxed text-sm text-justify">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#FF671F] via-white to-[#046A38] rounded-t-[32px]" />
                        
                        {type === 'terms' && (
                            <div className="space-y-4 pt-2">
                                <p className="font-medium">
                                    Welcome to <strong className="text-slate-900">Prepe</strong>! By using our platform, you agree to comply with and be bound by the following terms and conditions. Please review them carefully.
                                </p>

                                <div className="p-4 bg-[#FF671F]/5 rounded-2xl border border-[#FF671F]/10">
                                    <h3 className="font-black text-[#FF671F] uppercase tracking-wider text-xs mb-1">1. Acceptance of Terms</h3>
                                    <p className="text-xs leading-relaxed text-slate-700">
                                        By accessing and using <strong>Prepe</strong>, you accept and agree to be bound by these terms. If you do not agree, please refrain from using the app.
                                    </p>
                                </div>

                                <h3 className="font-black text-slate-900 mt-6 border-l-4 border-[#046A38] pl-3">2. Use of Cookies</h3>
                                <p>
                                    Our app uses cookies to enhance user experience. By using the app, you consent to the use of cookies in accordance with our Privacy Policy.
                                </p>

                                <h3 className="font-black text-slate-900 mt-6 border-l-4 border-[#046A38] pl-3">3. Intellectual Property</h3>
                                <p>
                                    Unless otherwise stated, <strong>Prepe</strong> and/or its licensors own the intellectual property rights for all material in the app. All rights are reserved.
                                </p>

                                <h3 className="font-black text-slate-900 mt-6 border-l-4 border-[#046A38] pl-3">4. Content Liability</h3>
                                <p>
                                    We shall not be held responsible for any content that appears in the app. No link(s) should appear in any context that may be interpreted as libelous, obscene, or criminal.
                                </p>
 
                                <h3 className="font-black text-slate-900 mt-6 border-l-4 border-[#046A38] pl-3">5. Third-Party Data</h3>
                                <p className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs italic">
                                    We use third-party sources to provide plan details. Before making any recharge, please verify the plan directly with the official operator. We are not responsible for discrepancies in third-party information.
                                </p>

                                <h3 className="font-black text-slate-900 mt-6 border-l-4 border-[#046A38] pl-3">6. WhatsApp Billing Alerts & Consent</h3>
                                <p className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/30 text-xs text-slate-700 leading-relaxed">
                                    By using <strong>PrePe</strong>, you consent to receive automated billing notifications, payment reminders, and circle alerts directly on your registered mobile number via WhatsApp. This consent is integrated directly into our platform terms to guarantee secure and timely payment alerts. Reminders can be monitored within the My Circle settings page.
                                </p>
                            </div>
                        )}

                        {type === 'privacy' && (
                            <div className="space-y-4 pt-2">
                                <p className="font-medium">
                                    At <strong className="text-slate-900">Prepe</strong>, accessible from <a href="https://pre-pe.com/" className="text-[#FF671F] font-bold underline">https://pre-pe.com/</a>, your privacy is our priority.
                                </p>

                                <div className="bg-[#046A38]/5 p-5 rounded-2xl border border-[#046A38]/10 space-y-3">
                                    <h3 className="font-black text-[#046A38] uppercase tracking-wider text-xs">Information We Collect</h3>
                                    <ul className="space-y-2 text-xs font-medium text-slate-700">
                                        <li className="flex items-start gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-[#046A38] mt-1.5 shrink-0" />
                                            Name, email address, and phone number.
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-[#046A38] mt-1.5 shrink-0" />
                                            KYC documents for identity verification.
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-[#046A38] mt-1.5 shrink-0" />
                                            Transaction history and usage patterns.
                                        </li>
                                    </ul>
                                </div>

                                <h3 className="font-black text-slate-900 mt-6 border-l-4 border-[#FF671F] pl-3">How We Use Data</h3>
                                <p>We use the information we collect to provide, operate, and maintain our services, and to prevent fraud in line with Digital India security standards.</p>

                                <h3 className="font-black text-slate-900 mt-6 border-l-4 border-[#FF671F] pl-3">Log Files</h3>
                                <p className="text-xs">Prepe follows standard procedures using log files to analyze trends and gather demographic information for platform improvement.</p>

                                <div className="mt-8 p-4 bg-slate-900 rounded-2xl text-white">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Contact Security</h4>
                                    <p className="text-xs">Questions? Email us at <a href="mailto:connect.prepe@gmail.com" className="text-[#FF671F] font-bold">connect.prepe@gmail.com</a></p>
                                </div>
                            </div>
                        )}

                        {type === 'refund' && (
                            <div className="space-y-4 pt-2">
                                <p className="font-medium">
                                    Thank you for choosing <strong className="text-slate-900">Prepe</strong>. We strive for seamless transactions, but we have a clear policy for failed payments.
                                </p>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                                        <h3 className="font-black text-orange-900 text-xs uppercase mb-1">Refund Duration</h3>
                                        <p className="text-xs text-orange-800">Refunds for failed transactions are initiated within 7 business days.</p>
                                    </div>
                                    <div className="p-4 bg-green-50 border border-green-100 rounded-2xl">
                                        <h3 className="font-black text-green-900 text-xs uppercase mb-1">Automatic Refunds</h3>
                                        <p className="text-xs text-green-800">Failed orders result in a full automatic refund to the source account.</p>
                                    </div>
                                </div>

                                <h3 className="font-black text-slate-900 mt-6 border-l-4 border-[#046A38] pl-3">Modes of Refund</h3>
                                <p className="text-xs">Refunds will be credited back to the original payment method utilized. No additional fees or deductions apply to your refunds.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">© 2024 PrePe Technologies 🇮🇳</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LegalPage;
