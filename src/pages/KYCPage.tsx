import { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import {
    CheckCircle,
    Upload,
    ShieldCheck,
    User,
    CreditCard,
    ChevronRight,
    ChevronLeft,
    Camera,
    X,
    AlertCircle,
    XCircle,
    Building2
} from 'lucide-react';
import { PageLoader, PrePeSpinner } from '@/components/ui/BrandLoader';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { submitKYC, uploadKYCDocument } from '@/services/kyc.service';
import { useKYC } from '@/hooks/useKYC';
import { encryptSensitiveData } from '@/lib/crypto';
import { Separator } from '@/components/ui/separator';
import { ImageCropperModal } from '@/components/ui/ImageCropperModal';
import { useProfile } from '@/hooks/useProfile';
import { sendTelegramAdminKYCAlert } from '@/services/telegramBot.service';
import { supabase } from '@/integrations/supabase/client';

export const KYCPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { toast } = useToast();
    const { status: kycStatusFromHook, kycData: hookData, isLoading: hookLoading } = useKYC({
        onApproved: () => navigate('/home', { replace: true })
    });
    const { profile, loading: profileLoading } = useProfile();

    const planType = (profile?.plan_type || 'BASIC').toUpperCase();
    const isBusiness = planType === 'BUSINESS';
    const isBasic = planType === 'BASIC';

    // Local state for UI
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Sync with hook data
    const [kycStatus, setKycStatus] = useState<string | null>(null);
    const [kycData, setKycData] = useState<any>(null);

    // Form States
    const [panNumber, setPanNumber] = useState('');
    const [aadharNumber, setAadharNumber] = useState('');
    const [dob, setDob] = useState('');
    const [gender, setGender] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);

    // Document States
    const [aadharFront, setAadharFront] = useState<File | null>(null);
    const [aadharBack, setAadharBack] = useState<File | null>(null);
    const [panCard, setPanCard] = useState<File | null>(null);
    const [selfie, setSelfie] = useState<File | null>(null);
    const [shopPhoto, setShopPhoto] = useState<File | null>(null);
    const [isInitialRedirectDone, setIsInitialRedirectDone] = useState(false);


    // Effect to check email and handle redirection based on status
    useEffect(() => {
        if (!user) return;

        // 1. Check Email
        if (!user.email_confirmed_at) {
            toast({
                title: "Email not verified",
                description: "Please verify your email address to proceed with KYC.",
                variant: "destructive"
            });
            navigate('/auth/verify-email');
            return;
        }

        // 2. Sync Hook Data
        if (!hookLoading) {
            setKycStatus(kycStatusFromHook);
            setKycData(hookData);

            // 3. Auto-redirect if already approved
            if (kycStatusFromHook === 'APPROVED' && !isInitialRedirectDone) {
                console.log("[KYCPage] User already approved, redirecting to home...");
                setIsInitialRedirectDone(true);
                navigate('/home', { replace: true });
            }
        }
    }, [user, navigate, toast, kycStatusFromHook, hookData, hookLoading, isInitialRedirectDone]);

    const handleNext = () => {
        if (step === 1) {
            if (!dob || !gender) {
                toast({ title: "Missing details", description: "Please fill in all fields", variant: "destructive" });
                return;
            }
            const birthDate = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            if (age < 18) {
                toast({ title: "Age Restriction", description: "You must be at least 18 years old to complete KYC", variant: "destructive" });
                return;
            }
        }
        if (step === 2) {
            if (isBasic) {
                // For basic users, Aadhaar and PAN are optional.
                // If they entered a PAN, validate it:
                if (panNumber.trim() !== '') {
                    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
                    if (!panRegex.test(panNumber)) {
                        toast({ title: "Invalid PAN", description: "Please provide a valid 10-character PAN (e.g., BNJPV6685R)", variant: "destructive" });
                        return;
                    }
                }
                // If they entered Aadhaar, validate it:
                if (aadharNumber.replace(/\D/g, '') !== '') {
                    if (aadharNumber.length < 14) {
                        toast({ title: "Invalid Aadhaar", description: "Please provide a valid 12-digit Aadhaar number", variant: "destructive" });
                        return;
                    }
                }
            } else {
                // For PRO/BUSINESS plan users, both Aadhaar and PAN are strictly mandatory:
                const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
                if (!panRegex.test(panNumber)) {
                    toast({ title: "Invalid PAN", description: "Please provide a valid 10-character PAN (e.g., BNJPV6685R)", variant: "destructive" });
                    return;
                }
                
                if (aadharNumber.length < 14) { // Including hyphens
                    toast({ title: "Invalid Aadhaar", description: "Please provide a valid 12-digit Aadhaar number", variant: "destructive" });
                    return;
                }

                if (!aadharFront || !aadharBack || !panCard || !selfie || (isBusiness && !shopPhoto)) {
                    toast({ title: "Documents Missing", description: "Please upload all required photos", variant: "destructive" });
                    return;
                }
            }
        }
        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        console.log("handleSubmit called. Current user state:", user, "termsAccepted:", termsAccepted);
        
        if (!termsAccepted) {
            toast({
                title: "Terms Required",
                description: "Please accept the declaration to proceed.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            // Retrieve fresh user session dynamically from Supabase
            const { data: { user: freshUser }, error: sessionError } = await supabase.auth.getUser();

            if (sessionError || !freshUser) {
                console.error("[KYCPage] Supabase user session fetch error:", sessionError);
                toast({
                    title: "Authentication Required",
                    description: "Your session has expired. Please log in again to verify your KYC.",
                    variant: "destructive"
                });
                navigate('/auth/login');
                return;
            }

            let afPath = null, abPath = null, panPath = null, selfiePath = null, shopPath = null;

            if (!isBasic) {
                // 1. Upload Documents
                afPath = await uploadKYCDocument(freshUser.id, aadharFront!, 'aadhar_front');
                abPath = await uploadKYCDocument(freshUser.id, aadharBack!, 'aadhar_back');
                panPath = await uploadKYCDocument(freshUser.id, panCard!, 'pan_card');
                selfiePath = await uploadKYCDocument(freshUser.id, selfie!, 'selfie');
                shopPath = shopPhoto ? await uploadKYCDocument(freshUser.id, shopPhoto, 'shop_photo') : null;
            }

            // 2. Securely Encrypt Sensitive Numbers
            const encryptedPan = panNumber && panNumber.trim() !== '' ? await encryptSensitiveData(panNumber) : null;
            const cleanedAadhar = aadharNumber.replace(/\s/g, '');
            const encryptedAadhar = cleanedAadhar && cleanedAadhar !== '' ? await encryptSensitiveData(cleanedAadhar) : null;

            // 3. Submit Data
            await submitKYC(freshUser.id, {
                pan_number: encryptedPan,
                aadhar_number: encryptedAadhar,
                dob,
                gender,
                document_urls: {
                    aadhar_front: afPath,
                    aadhar_back: abPath,
                    pan_card: panPath,
                    selfie: selfiePath,
                    shop_photo: shopPath
                }
            }, 'PENDING');

            // Dispatch Telegram Alert Notification in background
            try {
                sendTelegramAdminKYCAlert(profile, planType, 'PENDING');
            } catch (telegramErr) {
                console.error("Failed to send KYC Telegram notification:", telegramErr);
            }

            toast({
                title: "KYC Submitted",
                description: "Your verification request has been successfully submitted for review. It will be activated once approved by the administrator.",
            });
            localStorage.removeItem('kyc_draft');
            // Invalidate cache so ProtectedRoute sees the new status
            await queryClient.invalidateQueries({ queryKey: ['kycStatus', freshUser.id] });
            navigate('/home', { replace: true });
        } catch (error: any) {
            console.error("KYC Submission Error:", error);
            const errorMsg = error.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
            toast({
                title: "Submission Failed",
                description: errorMsg,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Helper for file upload UI
    const DocumentUpload = ({
        label,
        file,
        setFile,
        captureMode = "environment"
    }: {
        label: string,
        file: File | null,
        setFile: (f: File | null) => void,
        captureMode?: "user" | "environment"
    }) => {
        const inputRef = useRef<HTMLInputElement>(null);
        const [imageToCrop, setImageToCrop] = useState<string | null>(null);

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files[0]) {
                const selectedFile = e.target.files[0];
                // Simple validation
                if (selectedFile.size > 5 * 1024 * 1024) {
                    toast({ title: "File too large", description: "Max 5MB allowed", variant: "destructive" });
                    return;
                }
                const imgUrl = URL.createObjectURL(selectedFile);
                setImageToCrop(imgUrl);
            }
        };

        const onCropComplete = (croppedFile: File) => {
            setFile(croppedFile);
            if (imageToCrop) {
                URL.revokeObjectURL(imageToCrop);
            }
            setImageToCrop(null);
            if (inputRef.current) inputRef.current.value = '';
        };

        const triggerUpload = (mode: 'camera' | 'gallery') => {
            if (inputRef.current) {
                if (mode === 'camera') {
                    inputRef.current.setAttribute('capture', captureMode);
                } else {
                    inputRef.current.removeAttribute('capture');
                }
                inputRef.current.click();
            }
        };

        return (
            <div className="space-y-2">
                <Label>{label}</Label>
                {file ? (
                    <div className="relative border rounded-xl p-3 flex items-center gap-3 bg-blue-50 border-blue-200">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                            <CheckCircle className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                            <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button onClick={() => setFile(null)} className="p-2 hover:bg-blue-100 rounded-full transition-colors">
                            <X className="w-4 h-4 text-slate-500" />
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => triggerUpload('gallery')}
                            className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all gap-2"
                        >
                            <div className="p-2 bg-slate-100 rounded-full">
                                <Upload className="w-4 h-4 text-slate-600" />
                            </div>
                            <span className="text-xs font-medium text-slate-600">Upload</span>
                        </button>
                        <button
                            onClick={() => triggerUpload('camera')}
                            className="flex flex-col items-center justify-center p-4 border border-blue-100 bg-blue-50/50 rounded-xl hover:bg-blue-50 transition-all gap-2"
                        >
                            <div className="p-2 bg-blue-100 rounded-full">
                                <Camera className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-xs font-medium text-blue-700">Take Photo</span>
                        </button>
                        <input
                            type="file"
                            ref={inputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>
                )}
                {imageToCrop && (
                    <ImageCropperModal
                        imageSrc={imageToCrop}
                        isOpen={!!imageToCrop}
                        onClose={() => {
                            if (imageToCrop) URL.revokeObjectURL(imageToCrop);
                            setImageToCrop(null);
                            if (inputRef.current) inputRef.current.value = '';
                        }}
                        onCropComplete={onCropComplete}
                        aspect={label.includes('Selfie') ? 1 : 1.6}
                    />
                )}
            </div>
        );
    };

    if (kycStatus === 'APPROVED' && kycData) {
        return (
            <Layout hideHeader>
                <div className="min-h-screen bg-gradient-to-br from-[#FF671F]/5 via-white to-[#046A38]/5 flex flex-col items-center pt-8 px-4">
                    <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                            <button onClick={() => navigate('/home')} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-all">
                                <ChevronLeft className="w-5 h-5 text-slate-600" />
                            </button>
                            <h1 className="text-lg font-black text-slate-800 tracking-tight">Identity Verified</h1>
                        </div>

                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-[#046A38]/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-[#046A38]/5">
                                <div className="w-14 h-14 bg-[#046A38] rounded-full flex items-center justify-center shadow-lg shadow-[#046A38]/20">
                                    <CheckCircle className="w-8 h-8 text-white" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Jai Hind! 🇮🇳</h2>
                            <p className="text-slate-500 mb-8 max-w-xs font-medium">
                                Your KYC is approved. You are now a verified member of the PrePe Digital India family.
                            </p>

                            <div className="w-full space-y-3">
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4 text-left shadow-inner">
                                    <div className="w-10 h-10 bg-white border border-[#FF671F]/20 rounded-xl flex items-center justify-center shrink-0">
                                        <ShieldCheck className="w-6 h-6 text-[#FF671F]" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm">Aadhaar Card</p>
                                        <p className="text-xs text-[#046A38] font-black flex items-center gap-1">
                                            VERIFIED <span className="text-slate-300">•</span> <span className="text-slate-600 font-mono">•••• {kycData.decrypted_aadhar ? kycData.decrypted_aadhar.slice(-4) : '****'}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4 text-left shadow-inner">
                                    <div className="w-10 h-10 bg-white border border-[#FF671F]/20 rounded-xl flex items-center justify-center shrink-0">
                                        <CreditCard className="w-6 h-6 text-[#FF671F]" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm">PAN Card</p>
                                        <p className="text-xs text-[#046A38] font-black flex items-center gap-1">
                                            VERIFIED <span className="text-slate-300">•</span> <span className="text-slate-600 font-mono">•••• {kycData.decrypted_pan ? kycData.decrypted_pan.slice(-4) : '****'}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 bg-orange-50 border border-[#FF671F]/10 rounded-2xl p-4 text-left w-full">
                                <p className="text-[11px] text-orange-900 font-bold leading-relaxed">
                                    <span className="text-[#FF671F] uppercase tracking-tighter">Official Note:</span> Your data is protected with 256-bit encryption under Digital India guidelines.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    if (hookLoading || profileLoading) {
        return (
            <Layout hideHeader>
                <PageLoader message="Loading KYC..." />
            </Layout>
        );
    }

    if (kycStatus === 'PENDING') {
        return (
            <Layout hideHeader>
                <div className="min-h-screen bg-gradient-to-br from-[#FF671F]/5 via-white to-[#046A38]/5 flex flex-col items-center pt-8 px-4">
                    <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                            <button
                                onClick={() => navigate('/home', { replace: true })}
                                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-lg font-black text-slate-800 tracking-tight">Processing KYC</h1>
                        </div>

                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-orange-50/50">
                                <div className="w-14 h-14 bg-[#FF671F] rounded-full flex items-center justify-center shadow-lg shadow-orange-600/20">
                                    <PrePeSpinner className="w-7 h-7" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Review in Progress</h2>
                            <p className="text-slate-500 mb-8 max-w-xs font-medium">
                                Our officials are verifying your documents. This usually takes 2-4 working hours.
                            </p>

                            <div className="w-full space-y-3">
                                <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 text-left shadow-inner">
                                    <p className="text-xs text-orange-900 font-black flex items-center gap-2 uppercase tracking-tight">
                                        <AlertCircle className="w-4 h-4" />
                                        Limited Access Mode
                                    </p>
                                    <p className="text-[11px] text-orange-800 mt-1 font-medium">
                                        You can browse the app, but transaction limits will be unlocked after approval.
                                    </p>
                                </div>
                                <Button
                                    className="w-full h-12 bg-white border-2 border-[#FF671F] text-[#FF671F] hover:bg-orange-50 font-black rounded-xl"
                                    onClick={() => window.location.reload()}
                                >
                                    Check Status Again
                                </Button>
                                <Button
                                    className="w-full h-12 bg-[#FF671F] hover:bg-orange-600 text-white font-black rounded-xl shadow-lg shadow-orange-600/20"
                                    onClick={() => navigate('/home', { replace: true })}
                                >
                                    Go to Dashboard
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Layout >
        );
    }

    return (
        <Layout hideHeader>
            <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-8 px-4 pb-24">
                {/* Stepper */}
                <div className="w-full max-w-md mb-8 flex justify-between items-center relative px-2">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-0 rounded-full" />
                    <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#FF671F] transition-all duration-300 -z-0 rounded-full"
                        style={{ width: `${((step - 1) / 2) * 100}%` }}
                    />

                    {[1, 2, 3].map((num) => (
                        <div key={num} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm ${step >= num ? 'bg-[#FF671F] text-white shadow-orange-200 scale-110' : 'bg-white text-slate-400 border border-slate-200'
                            }`}>
                            {step > num ? <CheckCircle className="w-6 h-6" /> : num}
                        </div>
                    ))}
                </div>

                <div className="text-center mb-6">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Complete KYC</h1>
                    <p className="text-slate-500 text-sm font-medium">Verify your identity to unlock <span className="text-[#046A38] font-bold">{planType}</span> plan features</p>
                </div>

                <Card className="w-full max-w-md shadow-2xl border-slate-100 overflow-hidden bg-white/90 backdrop-blur-md rounded-[32px]">
                    <CardHeader className="bg-gradient-to-r from-[#FF671F]/5 via-white to-[#046A38]/5 border-b border-slate-100 pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg font-black text-slate-800">
                            {step === 1 && <User className="w-5 h-5 text-[#FF671F]" />}
                            {step === 2 && <CreditCard className="w-5 h-5 text-[#FF671F]" />}
                            {step === 3 && <ShieldCheck className="w-5 h-5 text-[#046A38]" />}

                            {step === 1 && "Personal Details"}
                            {step === 2 && "Identity Proof"}
                            {step === 3 && "Final Verification"}
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="pt-6 min-h-[300px] flex flex-col">

                        {/* Step 1: Personal Details */}
                        {step === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Date of Birth</Label>
                                    <Input
                                        type="date"
                                        value={dob}
                                        onChange={(e) => setDob(e.target.value)}
                                        className="h-12 bg-slate-50 border-slate-200 focus:border-[#FF671F] focus:ring-[#FF671F]/20 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2 pt-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Gender</Label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['Male', 'Female', 'Other'].map((g) => (
                                            <button
                                                key={g}
                                                onClick={() => setGender(g)}
                                                className={`h-11 rounded-xl border text-sm font-bold transition-all ${gender === g
                                                    ? 'border-[#FF671F] bg-[#FF671F]/5 text-[#FF671F] ring-1 ring-[#FF671F]'
                                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Identity Proof */}
                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Numbers Section */}
                                <div className="grid grid-cols-1 gap-4 p-4 bg-slate-50/50 rounded-[24px] border border-slate-100">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <Label className="text-[10px] uppercase text-slate-500 font-black tracking-[0.15em]">
                                                PAN Number {isBasic && <span className="text-slate-400 font-bold tracking-normal text-[9px] lowercase italic">(Optional)</span>}
                                            </Label>
                                            <span className="text-[10px] text-[#FF671F] font-black font-mono">{panNumber.length}/10</span>
                                        </div>
                                        <Input
                                            placeholder="BNJPV6685R"
                                            maxLength={10}
                                            value={panNumber}
                                            onChange={(e) => {
                                                const val = e.target.value.toUpperCase();
                                                if (val.length <= 10) setPanNumber(val);
                                            }}
                                            className="font-mono bg-white border-slate-200 focus:border-[#FF671F] focus:ring-[#FF671F]/20 rounded-xl uppercase tracking-widest text-lg h-12"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase text-slate-500 font-black tracking-[0.15em]">
                                            Aadhaar Number {isBasic && <span className="text-slate-400 font-bold tracking-normal text-[9px] lowercase italic">(Optional)</span>}
                                        </Label>
                                        <Input
                                            placeholder="1234-5678-9012"
                                            maxLength={14}
                                            type="text"
                                            inputMode="numeric"
                                            value={aadharNumber}
                                            onChange={(e) => {
                                                // Remove all non-digits
                                                let val = e.target.value.replace(/\D/g, '');

                                                // Limit to 12 digits
                                                if (val.length > 12) val = val.slice(0, 12);

                                                // Add hyphens
                                                let formatted = val;
                                                if (val.length > 4) {
                                                    formatted = val.slice(0, 4) + '-' + val.slice(4);
                                                }
                                                if (val.length > 8) {
                                                    formatted = formatted.slice(0, 9) + '-' + formatted.slice(9);
                                                }

                                                setAadharNumber(formatted);
                                            }}
                                            className="font-mono bg-white border-slate-200 focus:border-[#FF671F] focus:ring-[#FF671F]/20 rounded-xl text-lg h-12"
                                        />
                                    </div>
                                </div>

                                {/* Uploads Section */}
                                {!isBasic && (
                                    <div className="space-y-6 pt-2">
                                        <DocumentUpload
                                            label="Aadhaar Front Photo"
                                            file={aadharFront}
                                            setFile={setAadharFront}
                                        />
                                        <DocumentUpload
                                            label="Aadhaar Back Photo"
                                            file={aadharBack}
                                            setFile={setAadharBack}
                                        />
                                        <DocumentUpload
                                            label="PAN Card Photo"
                                            file={panCard}
                                            setFile={setPanCard}
                                        />

                                        <div className="pt-4 border-t border-slate-100">
                                            <DocumentUpload
                                                label="Live Selfie Verification"
                                                file={selfie}
                                                setFile={setSelfie}
                                                captureMode="user"
                                            />
                                        </div>
                                        {isBusiness && (
                                            <div className="pt-4 border-t border-slate-100">
                                                <div className="bg-[#FF671F]/5 p-3 rounded-xl mb-3 border border-[#FF671F]/10">
                                                    <p className="text-[10px] font-black text-[#FF671F] uppercase tracking-widest flex items-center gap-1.5">
                                                        <Building2 className="w-3 h-3" /> Required for Business Plan
                                                    </p>
                                                </div>
                                                <DocumentUpload
                                                    label="Shop Photo"
                                                    file={shopPhoto}
                                                    setFile={setShopPhoto}
                                                    captureMode="environment"
                                                />
                                                <p className="text-[10px] text-slate-400 mt-2 px-1 italic">
                                                    Please capture a clear photo of your shop front showing the name board if possible.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Verification */}
                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-center">
                                <div className="w-20 h-20 bg-[#046A38]/10 rounded-full flex items-center justify-center mx-auto ring-8 ring-[#046A38]/5">
                                    <ShieldCheck className="w-10 h-10 text-[#046A38]" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Confirm Details</h3>
                                    <p className="text-slate-500 mt-2 text-sm font-medium">
                                        Please verify that all uploaded documents are clear and readable.
                                    </p>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-2xl space-y-3 text-sm border border-slate-100 shadow-inner">
                                    {!isBasic && (
                                        <div className="flex justify-between border-b border-slate-200/50 pb-2">
                                            <span className="text-slate-500 font-bold">PAN Number</span>
                                            <span className="font-mono font-black text-[#FF671F]">{panNumber}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between border-b border-slate-200/50 pb-2">
                                        <span className="text-slate-500 font-bold">Aadhaar</span>
                                        <span className="font-mono font-black text-[#046A38]">XXXX-XXXX-{aadharNumber.slice(-4)}</span>
                                    </div>
                                    {!isBasic && (
                                        <div className="grid grid-cols-5 gap-2 pt-1">
                                            {[
                                                { file: aadharFront, label: 'AAD' }, 
                                                { file: aadharBack, label: 'AAD' }, 
                                                { file: panCard, label: 'PAN' }, 
                                                { file: selfie, label: 'SELF' }, 
                                                ...(isBusiness ? [{ file: shopPhoto, label: 'SHOP' }] : [])
                                            ].map((item, i) => (
                                                <div key={i} className={`aspect-square rounded-lg flex flex-col items-center justify-center overflow-hidden border border-slate-200 relative ${item.file ? 'bg-white shadow-sm' : 'bg-red-50'}`}>
                                                    {item.file ? (
                                                        <img
                                                            src={URL.createObjectURL(item.file)}
                                                            alt="Preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <X className="w-5 h-5 text-red-400" />
                                                    )}
                                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[7px] text-white text-center py-0.5 font-black tracking-tighter uppercase">
                                                        {item.label}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-start gap-3 text-left p-4 bg-[#FF671F]/5 rounded-2xl border border-[#FF671F]/10">
                                    <input
                                        type="checkbox"
                                        className="mt-1 accent-[#FF671F] w-4 h-4 cursor-pointer"
                                        id="terms"
                                        checked={termsAccepted}
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                    />
                                    <label htmlFor="terms" className="text-xs text-orange-900 font-bold cursor-pointer leading-relaxed">
                                        I hereby declare that the proofs submitted are valid and belong to me. 🇮🇳
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className="mt-auto pt-8 flex gap-3">
                            {step > 1 && (
                                <Button variant="outline" onClick={handleBack} className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-600">
                                    <ChevronLeft className="w-4 h-4 mr-2" /> Back
                                </Button>
                            )}
                            <Button
                                onClick={step === 3 ? handleSubmit : handleNext}
                                className="flex-1 bg-[#FF671F] hover:bg-orange-600 h-12 rounded-xl font-black text-white shadow-lg shadow-orange-600/20 active:scale-95 transition-all"
                                disabled={loading}
                            >
                                {step === 3 ? (loading ? 'Submitting...' : 'Submit Verification') : (
                                    <>Next <ChevronRight className="w-4 h-4 ml-2" /></>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default KYCPage;
