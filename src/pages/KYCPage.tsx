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
    Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { submitKYC, uploadKYCDocument } from '@/services/kyc.service';
import { useKYC } from '@/hooks/useKYC';
import { encryptSensitiveData } from '@/lib/crypto';
import { Separator } from '@/components/ui/separator';
import { ImageCropperModal } from '@/components/ui/ImageCropperModal';
import { useProfile } from '@/hooks/useProfile';

export const KYCPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { toast } = useToast();
    const { status: kycStatusFromHook, kycData: hookData, isLoading: hookLoading } = useKYC({
        onApproved: () => navigate('/home', { replace: true })
    });
    const { profile, loading: profileLoading } = useProfile();

    const planType = profile?.plan_type || 'BASIC';
    const isBusiness = planType === 'BUSINESS';

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
            if (!panNumber || aadharNumber.length < 12) {
                toast({ title: "Invalid details", description: "Please provide valid PAN and 12-digit Aadhaar number", variant: "destructive" });
                return;
            }
            if (!aadharFront || !aadharBack || !panCard || !selfie || (isBusiness && !shopPhoto)) {
                toast({ title: "Documents Missing", description: "Please upload all required photos", variant: "destructive" });
                return;
            }
        }
        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        if (!user) return;

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
            // 1. Upload Documents
            const afPath = await uploadKYCDocument(user.id, aadharFront!, 'aadhar_front');
            const abPath = await uploadKYCDocument(user.id, aadharBack!, 'aadhar_back');
            const panPath = await uploadKYCDocument(user.id, panCard!, 'pan_card');
            const selfiePath = await uploadKYCDocument(user.id, selfie!, 'selfie');
            const shopPath = shopPhoto ? await uploadKYCDocument(user.id, shopPhoto, 'shop_photo') : null;

            // 2. Securely Encrypt Sensitive Numbers
            const encryptedPan = await encryptSensitiveData(panNumber);
            const encryptedAadhar = await encryptSensitiveData(aadharNumber.replace(/\s/g, ''));

            // 3. Submit Data
            await submitKYC(user.id, {
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
            });

            toast({
                title: "KYC Submitted",
                description: "Your documents are under review. You can now access the dashboard.",
            });
            localStorage.removeItem('kyc_draft');
            // Invalidate cache so ProtectedRoute sees the new status
            await queryClient.invalidateQueries({ queryKey: ['kycStatus', user.id] });
            navigate('/home', { replace: true });
        } catch (error: any) {
            console.error("KYC Submission Error:", error);
            toast({
                title: "Submission Failed",
                description: error.message || "Failed to submit KYC. Please try again.",
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
                <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-8 px-4">
                    <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                            <button onClick={() => navigate('/home')} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100">
                                <ChevronLeft className="w-5 h-5 text-slate-600" />
                            </button>
                            <h1 className="text-lg font-bold text-slate-800">KYC Verification</h1>
                        </div>

                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-green-50/50">
                                <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
                                    <CheckCircle className="w-8 h-8 text-white" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Verified!</h2>
                            <p className="text-slate-500 mb-8 max-w-xs">
                                Your KYC documents have been approved. You have full access to all features.
                            </p>

                            <div className="w-full space-y-3">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-4 text-left">
                                    <div className="w-10 h-10 bg-white border border-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                        <ShieldCheck className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">Aadhaar Card</p>
                                        <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                                            VERIFIED <span className="text-slate-300">•</span> <span className="text-slate-600">•••• {kycData.decrypted_aadhar ? kycData.decrypted_aadhar.slice(-4) : '****'}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-4 text-left">
                                    <div className="w-10 h-10 bg-white border border-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                        <CreditCard className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">PAN Card</p>
                                        <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                                            VERIFIED <span className="text-slate-300">•</span> <span className="text-slate-600">•••• {kycData.decrypted_pan ? kycData.decrypted_pan.slice(-4) : '****'}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-left w-full">
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    <span className="font-bold">Note:</span> If you need to update your documents or re-verify, please contact our support team.
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
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    if (kycStatus === 'PENDING') {
        return (
            <Layout hideHeader>
                <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-8 px-4">
                    <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                            <button
                                onClick={() => navigate('/home', { replace: true })}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-lg font-bold text-slate-800">KYC Verification</h1>
                        </div>

                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-amber-50/50">
                                <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center shadow-lg shadow-amber-200">
                                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Verification Pending</h2>
                            <p className="text-slate-500 mb-8 max-w-xs">
                                Your KYC documents have been submitted and are currently under review.
                                <br /><br />
                                <span className="font-semibold text-slate-700">Please wait for admin approval.</span>
                            </p>

                            <div className="w-full space-y-3">
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-left">
                                    <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        Access Restricted
                                    </p>
                                    <p className="text-xs text-amber-700 mt-1">
                                        Full wallet features and limits will be unlocked once your verification is approved.
                                    </p>
                                </div>
                                <Button
                                    className="w-full" variant="outline"
                                    onClick={() => window.location.reload()}
                                >
                                    Check Status Again
                                </Button>
                                <Button
                                    className="w-full"
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
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-500 transition-all duration-300 -z-0 rounded-full"
                        style={{ width: `${((step - 1) / 2) * 100}%` }}
                    />

                    {[1, 2, 3].map((num) => (
                        <div key={num} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm ${step >= num ? 'bg-green-600 text-white shadow-green-200 scale-110' : 'bg-white text-slate-400 border border-slate-200'
                            }`}>
                            {step > num ? <CheckCircle className="w-6 h-6" /> : num}
                        </div>
                    ))}
                </div>

                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Complete KYC</h1>
                    <p className="text-slate-500 text-sm">Verify your identity to unlock {planType} plan features</p>
                </div>

                <Card className="w-full max-w-md shadow-xl border-slate-100 overflow-hidden bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            {step === 1 && <User className="w-5 h-5 text-blue-500" />}
                            {step === 2 && <CreditCard className="w-5 h-5 text-blue-500" />}
                            {step === 3 && <ShieldCheck className="w-5 h-5 text-blue-500" />}

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
                                    <Label>Date of Birth</Label>
                                    <Input
                                        type="date"
                                        value={dob}
                                        onChange={(e) => setDob(e.target.value)}
                                        className="bg-slate-50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Gender</Label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['Male', 'Female', 'Other'].map((g) => (
                                            <button
                                                key={g}
                                                onClick={() => setGender(g)}
                                                className={`py-2 rounded-lg border text-sm font-medium transition-all ${gender === g
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
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
                                <div className="grid grid-cols-1 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase text-slate-500 font-semibold tracking-wider">PAN Number</Label>
                                        <Input
                                            placeholder="ABCDE1234F"
                                            maxLength={10}
                                            value={panNumber}
                                            onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                                            className="font-mono bg-white border-slate-200 uppercase"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase text-slate-500 font-semibold tracking-wider">Aadhaar Number</Label>
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
                                            className="font-mono bg-white border-slate-200"
                                        />
                                    </div>
                                </div>

                                {/* Uploads Section */}
                                <div className="space-y-6">
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

                                    <div className="pt-2 border-t border-slate-100">
                                        <DocumentUpload
                                            label="Live Selfie Verification"
                                            file={selfie}
                                            setFile={setSelfie}
                                            captureMode="user"
                                        />
                                    </div>
                                    {isBusiness && (
                                        <div className="pt-2 border-t border-slate-100">
                                            <DocumentUpload
                                                label="Shop Photo"
                                                file={shopPhoto}
                                                setFile={setShopPhoto}
                                                captureMode="environment"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Verification */}
                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-center">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto ring-8 ring-green-50">
                                    <ShieldCheck className="w-10 h-10 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Confirm Details</h3>
                                    <p className="text-slate-500 mt-2 text-sm">
                                        Please verify that all uploaded documents are clear and readable.
                                    </p>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-xl space-y-3 text-sm border border-slate-100">
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500">PAN Number</span>
                                        <span className="font-mono font-medium">{panNumber}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500">Aadhaar</span>
                                        <span className="font-mono font-medium">XXXX-XXXX-{aadharNumber.slice(-4)}</span>
                                    </div>
                                    <div className="grid grid-cols-5 gap-2 pt-1">
                                        {[aadharFront, aadharBack, panCard, selfie, ...(isBusiness ? [shopPhoto] : [])].map((f, i) => (
                                            <div key={i} className={`aspect-square rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 ${f ? 'bg-white' : 'bg-red-50'}`}>
                                                {f ? (
                                                    <img
                                                        src={URL.createObjectURL(f)}
                                                        alt="Document Preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <X className="w-5 h-5 text-red-400" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 text-left p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                    <input
                                        type="checkbox"
                                        className="mt-1 accent-blue-600 w-4 h-4 cursor-pointer"
                                        id="terms"
                                        checked={termsAccepted}
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                    />
                                    <label htmlFor="terms" className="text-xs text-blue-800 font-medium cursor-pointer">
                                        I hereby declare that the proofs submitted are valid and belong to me.
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className="mt-auto pt-8 flex gap-3">
                            {step > 1 && (
                                <Button variant="outline" onClick={handleBack} className="flex-1 h-11">
                                    <ChevronLeft className="w-4 h-4 mr-2" /> Back
                                </Button>
                            )}
                            <Button
                                onClick={step === 3 ? handleSubmit : handleNext}
                                className="flex-1 bg-slate-900 hover:bg-slate-800 h-11"
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
