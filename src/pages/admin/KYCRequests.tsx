import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Loader2,
    CheckCircle,
    XCircle,
    ChevronRight,
    Calendar,
    User,
    FileText,
    Shield,
    Mail,
    ShieldAlert,
    ShieldCheck,
    Clock,
    AlertTriangle,
    Check,
    X,
    Maximize2,
    ChevronLeft,
    Search,
    Filter,
    Copy,
    RotateCw,
    RotateCcw,
    ZoomIn,
    ZoomOut,
    Info,
    Lock,
    Unlock,
    ArrowRight,
    CornerDownRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { decryptSensitiveData, maskAadhaar, maskPAN } from '@/lib/crypto';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export const KYCRequests = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    
    // UI Workspace States
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [planFilter, setPlanFilter] = useState<'ALL' | 'BASIC' | 'PRO' | 'BUSINESS'>('ALL');

    useEffect(() => {
        const handleKycUpdate = () => {
            console.log("Instant KYC update event received from Telegram bot...");
            queryClient.invalidateQueries({ queryKey: ['admin_kyc_requests'] });
        };
        window.addEventListener('admin_kyc_requests_updated', handleKycUpdate);
        return () => window.removeEventListener('admin_kyc_requests_updated', handleKycUpdate);
    }, [queryClient]);
    
    // Details Panel loading states
    const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
    const [loadingImages, setLoadingImages] = useState(false);
    const [decryptedData, setDecryptedData] = useState<{ pan: string, aadhar: string } | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Rejection Dialog States
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectDialog, setShowRejectDialog] = useState(false);

    // Custom Interactive Lightbox States
    const [activeLightboxImage, setActiveLightboxImage] = useState<{ key: string; url: string; label: string } | null>(null);
    const [lightboxZoom, setLightboxZoom] = useState(1);
    const [lightboxRotation, setLightboxRotation] = useState(0);

    // Inline Verification Checklist State
    const [approveChecklist, setApproveChecklist] = useState<Record<string, boolean>>({});

    // Helper: Determine required files by Plan Type
    const isKeyRequiredForPlan = (key: string, planType: string) => {
        const plan = (planType || 'BASIC').toUpperCase();
        if (key === 'shop_photo') {
            return plan === 'BUSINESS';
        }
        if (key === 'selfie') {
            return plan === 'PRO' || plan === 'BUSINESS';
        }
        return true; // Aadhaar front, back, and PAN are required for all
    };

    // Helper: Get human description of why a document is required under the plan
    const getDocumentRequirementMessage = (key: string, planType: string) => {
        const plan = (planType || 'BASIC').toUpperCase();
        switch (key) {
            case 'aadhar_front':
            case 'aadhar_back':
                return `Identity Proof (Required for all plans)`;
            case 'pan_card':
                return `Tax & Income Verification (Required for all plans)`;
            case 'selfie':
                if (plan === 'BASIC') return `Not required under Basic Plan (Exempt)`;
                return `Bio-Face Authenticity Match (Required for ${plan} Plan)`;
            case 'shop_photo':
                if (plan === 'BASIC' || plan === 'PRO') return `Not required under ${plan === 'PRO' ? 'Pro' : 'Basic'} Plan (Exempt)`;
                return `Business Address Proof (Required for Business Plan)`;
            default:
                return '';
        }
    };

    // Helper: Get active checklist items dynamically for Plan Type
    const getChecklistItems = (planType: string) => {
        const plan = (planType || 'BASIC').toUpperCase();
        const base = [
            { key: 'numbersMatch', label: "Digital entry matches printed text on Aadhaar & PAN exactly" },
            { key: 'photosClear', label: "Images are high-resolution, clear, and text is fully legible" },
            { key: 'originalDocuments', label: "Scans are of original physical cards (no printouts/photocopies)" },
            { key: 'tamperCheck', label: "No signs of editing, overlay, pixelation, or image tampering" },
            { key: 'notExpired', label: "Documents are active, not expired, and show no physical damage" }
        ];
        
        if (plan === 'PRO') {
            return [
                ...base,
                { key: 'selfieMatches', label: "Selfie photo matches the facial features on Aadhaar & PAN" },
                { key: 'selfieLiveness', label: "Selfie is a live shot under clear lighting with proper contrast" }
            ];
        } else if (plan === 'BUSINESS') {
            return [
                ...base,
                { key: 'selfieMatches', label: "Selfie photo matches the facial features on Aadhaar & PAN" },
                { key: 'selfieLiveness', label: "Selfie is a live shot under clear lighting with proper contrast" },
                { key: 'shopAuthentic', label: "Shop storefront photo matches business name and street address" },
                { key: 'storefrontMatch', label: "Active commercial activity visible with authentic branding signage" }
            ];
        }
        return base;
    };

    const activeChecklistItems = useMemo(() => {
        if (!selectedRequest) return [];
        return getChecklistItems(selectedRequest?.profiles?.plan_type);
    }, [selectedRequest]);

    const isApproveEnabled = useMemo(() => {
        if (activeChecklistItems.length === 0) return false;
        return activeChecklistItems.every(item => approveChecklist[item.key]);
    }, [activeChecklistItems, approveChecklist]);

    // Fetch Pending Requests and Enriched Profiles
    const { data: requests, isLoading, error: queryError } = useQuery<any[]>({
        queryKey: ['admin_kyc_requests'],
        queryFn: async () => {
            // 1. Fetch KYC Requests (PENDING)
            const { data: kycData, error: kycError } = await (supabase as any)
                .from('kyc_verifications')
                .select('*')
                .eq('status', 'PENDING')
                .order('created_at', { ascending: false });

            if (kycError) throw kycError;
            if (!kycData || kycData.length === 0) return [];

            // 2. Fetch Profiles for these users
            const userIds = kycData.map((req: any) => req.user_id);
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('*') // Safe select all columns to prevent column-not-found errors (like sim_provider)
                .in('user_id', userIds);

            if (profilesError) {
                console.error("Error fetching profiles:", profilesError);
                // Return kyc data even if profile query fails
                return kycData.map((req: any) => ({ ...req, profiles: null }));
            }

            // 3. Merge Data
            const enrichedData = kycData.map((req: any) => {
                const profile = profilesData?.find((p: any) => p.user_id === req.user_id);
                return {
                    ...req,
                    profiles: profile
                };
            });

            return enrichedData;
        }
    });

    // Handle Sensitive Decryption safely
    const safeDecrypt = async (encryptedValue: string) => {
        if (!encryptedValue) return "";
        try {
            const decrypted = await decryptSensitiveData(encryptedValue);
            if (decrypted === "DECRYPTION_ERROR") {
                // If it fails (e.g. database has plaintext instead of cipher), fall back to raw value
                return encryptedValue;
            }
            return decrypted;
        } catch (err) {
            console.warn("Failed decrypting string, using raw value:", err);
            return encryptedValue;
        }
    };

    // Load Signed URLs and Decrypt data when a request is selected
    useEffect(() => {
        const loadRequestDetails = async () => {
            if (!selectedRequest) {
                setDecryptedData(null);
                setImageUrls({});
                setApproveChecklist({});
                return;
            }

            setLoadingImages(true);

            // 1. Decrypt Sensitive Numbers with safe fallbacks
            try {
                const [pan, aadhar] = await Promise.all([
                    safeDecrypt(selectedRequest.pan_number),
                    safeDecrypt(selectedRequest.aadhar_number)
                ]);
                setDecryptedData({ pan, aadhar });
            } catch (err) {
                console.error("Decryption pipeline error:", err);
                toast({ title: "Decryption Warning", description: "Identity numbers could not be fully decrypted. Displaying raw data.", variant: "destructive" });
                setDecryptedData({ 
                    pan: selectedRequest.pan_number || "N/A", 
                    aadhar: selectedRequest.aadhar_number || "N/A" 
                });
            }

            // 2. Load Signed Images for files that actually have paths in document_urls
            const urls: Record<string, string> = {};
            const keys = ['aadhar_front', 'aadhar_back', 'pan_card', 'selfie', 'shop_photo'];
            const docUrls = selectedRequest.document_urls || {};

            try {
                await Promise.all(keys.map(async (key) => {
                    const path = docUrls[key];
                    if (path) {
                        const { data, error } = await supabase.storage
                            .from('kyc-documents')
                            .createSignedUrl(path, 3600); // 1 hour expiry
                        if (error) {
                            console.warn(`Could not fetch signed url for ${key}:`, error.message);
                        } else if (data?.signedUrl) {
                            urls[key] = data.signedUrl;
                        }
                    }
                }));
                setImageUrls(urls);
            } catch (error) {
                console.error("Error loading images:", error);
                toast({ title: "Image Load Issues", description: "Some secure images failed to load.", variant: "destructive" });
            } finally {
                setLoadingImages(false);
            }
        };

        loadRequestDetails();
    }, [selectedRequest]);

    // Copy to clipboard utility
    const handleCopy = (text: string, fieldName: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        toast({ title: "Copied!", description: `${fieldName} copied to clipboard.` });
        setTimeout(() => setCopiedField(null), 2000);
    };

    // Filtered applicant requests list
    const filteredRequests = useMemo(() => {
        if (!requests) return [];
        return requests.filter((req) => {
            const profile = req.profiles;
            const userName = (profile?.full_name || 'Anonymous').toLowerCase();
            const userEmail = (profile?.email || '').toLowerCase();
            const query = searchQuery.toLowerCase();
            
            const matchesSearch = userName.includes(query) || userEmail.includes(query) || req.id.toLowerCase().includes(query);
            const matchesPlan = planFilter === 'ALL' || (profile?.plan_type || 'BASIC').toUpperCase() === planFilter;
            
            return matchesSearch && matchesPlan;
        });
    }, [requests, searchQuery, planFilter]);

    // Active pending queue stats calculated from live data
    const queueStats = useMemo(() => {
        if (!requests) return { total: 0, basic: 0, pro: 0, business: 0 };
        return requests.reduce((acc, req) => {
            const plan = (req.profiles?.plan_type || 'BASIC').toUpperCase();
            acc.total += 1;
            if (plan === 'BASIC') acc.basic += 1;
            else if (plan === 'PRO') acc.pro += 1;
            else if (plan === 'BUSINESS') acc.business += 1;
            return acc;
        }, { total: 0, basic: 0, pro: 0, business: 0 });
    }, [requests]);

    // Approve/Reject Mutation
    const updateStatus = useMutation({
        mutationFn: async ({ id, status, userId, reason }: { id: string, status: 'APPROVED' | 'REJECTED', userId: string, reason?: string }) => {
            const { error: updateError, data: updatedRecords } = await supabase
                .from('kyc_verifications' as any)
                .update({ 
                    status, 
                    rejection_reason: reason || null,
                    updated_at: new Date().toISOString() 
                })
                .eq('id', id)
                .select();

            if (updateError) throw updateError;
            if (!updatedRecords || updatedRecords.length === 0) {
                throw new Error("Update blocked by database security. You may not have administrative privileges.");
            }

            // Log Audit
            const { data: { user: adminUser } } = await supabase.auth.getUser();
            if (adminUser) {
                const { error: auditError } = await (supabase as any).from('admin_audit_logs').insert({
                    admin_id: adminUser.id,
                    action_type: `KYC_${status}`,
                    target_id: userId,
                    details: { kyc_id: id, reason: reason || null }
                });
                if (auditError) {
                    console.warn("Audit Log Warning: Could not write to admin_audit_logs table.", auditError);
                }
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin_kyc_requests'] });
            setSelectedRequest(null);
            setShowRejectDialog(false);
            setRejectReason("");
            setApproveChecklist({});
            toast({
                title: variables.status === 'APPROVED' ? "Application Approved" : "Application Rejected",
                description: `Successfully processed the KYC request.`,
            });
        },
        onError: (err) => {
            toast({ title: "Operation Failed", description: (err as any).message, variant: "destructive" });
        }
    });

    const handleExecuteApprove = () => {
        if (!selectedRequest || !isApproveEnabled) return;
        
        // Build detailed audit notification message with verified checklist items
        const checkedLabels = activeChecklistItems
            .filter(item => approveChecklist[item.key])
            .map(item => item.label);
        const approvalDetailsText = `Verified Checklist:\n` + checkedLabels.map(l => `• ${l}`).join('\n');

        updateStatus.mutate({
            id: selectedRequest.id,
            status: 'APPROVED',
            userId: selectedRequest.user_id,
            reason: approvalDetailsText
        });
    };

    const handleRejectSubmit = () => {
        if (!selectedRequest || !rejectReason.trim()) {
            toast({ title: "Reason Required", description: "Please provide a reason for rejection", variant: "destructive" });
            return;
        }
        updateStatus.mutate({
            id: selectedRequest.id,
            status: 'REJECTED',
            userId: selectedRequest.user_id,
            reason: rejectReason
        });
    };

    // Lightbox image rotation and zoom functions
    const handleRotate = (dir: 'cw' | 'ccw') => {
        setLightboxRotation(prev => (dir === 'cw' ? prev + 90 : prev - 90) % 360);
    };

    const handleZoom = (type: 'in' | 'out') => {
        setLightboxZoom(prev => {
            const next = type === 'in' ? prev + 0.25 : prev - 0.25;
            return Math.max(0.5, Math.min(3, next));
        });
    };

    const handleResetLightbox = () => {
        setLightboxZoom(1);
        setLightboxRotation(0);
    };

    // Cycle through uploaded images in the lightbox
    const handleCycleImage = (direction: 'next' | 'prev') => {
        if (!selectedRequest || !activeLightboxImage) return;
        const availableKeys = Object.keys(imageUrls).filter(k => imageUrls[k]);
        if (availableKeys.length <= 1) return;

        const currentIndex = availableKeys.indexOf(activeLightboxImage.key);
        let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        
        if (nextIndex >= availableKeys.length) nextIndex = 0;
        if (nextIndex < 0) nextIndex = availableKeys.length - 1;

        const nextKey = availableKeys[nextIndex];
        const nextUrl = imageUrls[nextKey];
        const nextLabel = nextKey.replace('_', ' ').toUpperCase();

        setActiveLightboxImage({
            key: nextKey,
            url: nextUrl,
            label: nextLabel
        });
        handleResetLightbox();
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <p className="text-slate-500 font-medium">Loading applications database...</p>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto px-4 pb-12 h-[calc(100vh-100px)] overflow-hidden flex flex-col">
            
            {/* Top Workspace Bar */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 pb-4 border-b border-slate-200/60 mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-md shadow-blue-500/10">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Identity Compliance Audit</h1>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Verify plan-specific KYC requests and manage document approval checklists.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white border border-slate-200/80 px-4 py-2 rounded-2xl shadow-sm">
                        <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span className="text-xs font-bold text-slate-700">{queueStats.total} Total Pending</span>
                    </div>
                </div>
            </header>

            {/* Split Screen Workspace */}
            <div className="flex-1 flex flex-col md:flex-row items-stretch gap-6 overflow-hidden min-h-0">
                
                {/* Left Side: Applicant Queue Panel */}
                <div className={cn(
                    "w-full md:w-[380px] lg:w-[420px] flex flex-col bg-white rounded-3xl border border-slate-200/70 shadow-sm overflow-hidden shrink-0",
                    selectedRequest ? "hidden md:flex" : "flex"
                )}>
                    
                    {/* Search & Filter Controls */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3 shrink-0">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, ID..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-xs font-medium bg-white shadow-sm transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Plan Filter Segment Buttons */}
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            {(['ALL', 'BASIC', 'PRO', 'BUSINESS'] as const).map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setPlanFilter(filter)}
                                    className={cn(
                                        "flex-1 text-[10px] font-black tracking-wider py-1.5 rounded-lg transition-all uppercase",
                                        planFilter === filter
                                            ? "bg-white text-slate-900 shadow-sm font-black"
                                            : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Applicant Scrollable List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {filteredRequests.length === 0 ? (
                            <div className="p-8 text-center border border-dashed border-slate-200 bg-slate-50/30 rounded-2xl">
                                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                                <h4 className="font-bold text-xs text-slate-700">No Pending Applications</h4>
                                <p className="text-[10px] text-slate-400 max-w-xs mx-auto mt-1">
                                    {planFilter !== 'ALL' 
                                        ? `No pending ${planFilter} applicants match your filters.` 
                                        : "All received KYC applications have been reviewed successfully."}
                                </p>
                            </div>
                        ) : (
                            filteredRequests.map((req) => {
                                const profile = req.profiles;
                                const plan = (profile?.plan_type || 'BASIC').toUpperCase();
                                const isSelected = selectedRequest?.id === req.id;
                                
                                // Calculate how many documents have paths uploaded
                                const docUrls = req.document_urls || {};
                                const keysToCheck = ['aadhar_front', 'aadhar_back', 'pan_card', 'selfie', 'shop_photo'];
                                const uploadedCount = keysToCheck.filter(k => isKeyRequiredForPlan(k, plan) && docUrls[k]).length;
                                const requiredCount = keysToCheck.filter(k => isKeyRequiredForPlan(k, plan)).length;

                                return (
                                    <button
                                        key={req.id}
                                        onClick={() => {
                                            setSelectedRequest(req);
                                            handleResetLightbox();
                                        }}
                                        className={cn(
                                            "w-full text-left p-4 rounded-2xl border transition-all duration-300 group flex items-start gap-4",
                                            isSelected
                                                ? "border-blue-600/30 bg-blue-50/20 shadow-md shadow-blue-500/5 ring-1 ring-blue-500/10"
                                                : "border-slate-100 hover:border-slate-300 bg-white hover:bg-slate-50/40"
                                        )}
                                    >
                                        {/* Avatar / Circle */}
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm uppercase shrink-0 transition-colors duration-300",
                                            isSelected
                                                ? "bg-blue-600 text-white"
                                                : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                                        )}>
                                            {profile?.full_name ? profile.full_name[0] : <User className="w-5 h-5" />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <h4 className="text-xs font-black text-slate-800 truncate group-hover:text-blue-600 transition-colors duration-300">
                                                    {profile?.full_name || 'Test User'}
                                                </h4>
                                                <Badge className={cn(
                                                    "text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded border-0 uppercase shrink-0",
                                                    plan === 'BUSINESS'
                                                        ? "bg-purple-100 text-purple-700"
                                                        : plan === 'PRO'
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "bg-slate-100 text-slate-600"
                                                )}>
                                                    {plan}
                                                </Badge>
                                            </div>

                                            <p className="text-[10px] text-slate-400 truncate font-semibold mb-2">{profile?.email || 'No email associated'}</p>

                                            <div className="flex items-center justify-between">
                                                {/* Upload completion status */}
                                                <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                                                    <FileText className="w-3 h-3 text-slate-400" />
                                                    {uploadedCount === 0 ? (
                                                        <span className="text-amber-600">Empty Submission</span>
                                                    ) : (
                                                        <span>{uploadedCount}/{requiredCount} Documents</span>
                                                    )}
                                                </span>

                                                <span className="text-[8px] font-medium text-slate-400 flex items-center gap-1 shrink-0 font-mono">
                                                    <Calendar className="w-2.5 h-2.5" />
                                                    {new Date(req.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Side: Active Workspace Reviewer */}
                <div className={cn(
                    "flex-1 bg-white rounded-3xl border border-slate-200/70 shadow-sm overflow-hidden flex flex-col min-w-0",
                    selectedRequest ? "flex animate-in slide-in-from-right duration-300" : "hidden md:flex"
                )}>
                    
                    {!selectedRequest ? (
                        /* Empty State: Queue Analytics Board */
                        <div className="flex-1 overflow-y-auto p-8 flex flex-col justify-center max-w-4xl mx-auto space-y-8">
                            <div className="text-center space-y-2">
                                <div className="h-16 w-16 bg-blue-50 border border-blue-100 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                                    <ShieldCheck className="w-8 h-8 text-blue-600 animate-pulse" />
                                </div>
                                <h2 className="text-xl font-black text-slate-800">Review Panel Active</h2>
                                <p className="text-slate-500 text-xs max-w-md mx-auto">Select a pending KYC request from the left column to run identity audits and check documents against compliance checklists.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="border border-slate-100 bg-gradient-to-tr from-slate-50/50 to-slate-100/50 shadow-sm">
                                    <CardContent className="p-5 text-center">
                                        <Badge className="bg-slate-100 text-slate-600 mb-2 border-0">BASIC KYC</Badge>
                                        <p className="text-2xl font-black text-slate-800">{queueStats.basic}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Pending Requests</p>
                                    </CardContent>
                                </Card>

                                <Card className="border border-slate-100 bg-gradient-to-tr from-blue-50/30 to-blue-100/20 shadow-sm">
                                    <CardContent className="p-5 text-center">
                                        <Badge className="bg-blue-100 text-blue-700 mb-2 border-0">PRO KYC</Badge>
                                        <p className="text-2xl font-black text-blue-700">{queueStats.pro}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Pending Requests</p>
                                    </CardContent>
                                </Card>

                                <Card className="border border-slate-100 bg-gradient-to-tr from-purple-50/30 to-purple-100/20 shadow-sm">
                                    <CardContent className="p-5 text-center">
                                        <Badge className="bg-purple-100 text-purple-700 mb-2 border-0">BUSINESS KYC</Badge>
                                        <p className="text-2xl font-black text-purple-700">{queueStats.business}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Pending Requests</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                    <Info className="w-3.5 h-3.5 text-slate-400" /> General Guidelines
                                </h4>
                                <ul className="space-y-2.5">
                                    <li className="flex items-start gap-2.5 text-xs text-slate-600 leading-snug">
                                        <CornerDownRight className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                        <span>Ensure digital record entries (Aadhaar & PAN digits) exactly match the printed numbers on the physical card.</span>
                                    </li>
                                    <li className="flex items-start gap-2.5 text-xs text-slate-600 leading-snug">
                                        <CornerDownRight className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                        <span>Confirm document photos are authentic, have clear text, and show no signs of digital edit tampering.</span>
                                    </li>
                                    <li className="flex items-start gap-2.5 text-xs text-slate-600 leading-snug">
                                        <CornerDownRight className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                        <span>For Pro & Business applicants, compare the facial details on the live selfie with the identity photo records.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        /* Workspace Active Request Review Panel */
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            
                            {/* Request Sub-header / Profile Banner */}
                            <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                                <div className="flex items-center gap-3 md:gap-4">
                                    {/* Mobile Back button to return to applicant queue list */}
                                    <button
                                        onClick={() => setSelectedRequest(null)}
                                        className="md:hidden p-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl transition-all mr-1 shrink-0"
                                        title="Back to Queue"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                                    </button>

                                    <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                                        <User className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                                            {selectedRequest.profiles?.full_name || 'Test User'}
                                            <Badge className={cn(
                                                "text-[9px] font-black px-2 py-0.5 rounded border-0 uppercase font-mono",
                                                (selectedRequest.profiles?.plan_type || 'BASIC').toUpperCase() === 'BUSINESS'
                                                    ? "bg-purple-600 text-white shadow-sm shadow-purple-200"
                                                    : (selectedRequest.profiles?.plan_type || 'BASIC').toUpperCase() === 'PRO'
                                                        ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                                                        : "bg-slate-800 text-white shadow-sm shadow-slate-200"
                                            )}>
                                                {selectedRequest.profiles?.plan_type || 'BASIC'} PLAN
                                            </Badge>
                                        </h2>
                                        <p className="text-xs text-slate-400 font-semibold mt-0.5 flex items-center gap-1.5">
                                            <span>{selectedRequest.profiles?.email || 'No email associated'}</span>
                                            {selectedRequest.profiles?.phone && (
                                                <>
                                                    <span className="text-slate-300">•</span>
                                                    <span>{selectedRequest.profiles.phone}</span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedRequest(null)}
                                        className="rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50 shadow-none text-xs"
                                    >
                                        Close Application
                                    </Button>
                                </div>
                            </div>

                            {/* Main Scrollable workspace contents */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                                
                                {/* Info Grids (Gender, DOB, Identity Digits) */}
                                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    
                                    {/* Personal details cards */}
                                    <div className="lg:col-span-1 grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Gender</p>
                                            <p className="text-sm font-black text-slate-800 capitalize">{selectedRequest.gender || 'Not entered'}</p>
                                        </div>
                                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Date of Birth</p>
                                            <p className="text-sm font-black text-slate-800">
                                                {selectedRequest.dob 
                                                    ? new Date(selectedRequest.dob).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
                                                    : 'Not entered'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* PAN ID Record */}
                                    <div className="bg-slate-900 p-4 rounded-2xl shadow-sm text-white flex flex-col justify-between group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
                                        
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PAN Card Number</p>
                                            <button 
                                                onClick={() => handleCopy(decryptedData?.pan || '', "PAN Number")}
                                                className="text-slate-400 hover:text-white transition-colors"
                                                title="Copy to clipboard"
                                            >
                                                {copiedField === 'PAN Number' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>

                                        <p className="text-lg font-mono font-black tracking-widest text-blue-200">
                                            {decryptedData ? decryptedData.pan : '••••••••••'}
                                        </p>
                                    </div>

                                    {/* Aadhaar ID Record */}
                                    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col justify-between group relative">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aadhaar Card Number</p>
                                            <button 
                                                onClick={() => handleCopy(decryptedData?.aadhar || '', "Aadhaar Number")}
                                                className="text-slate-400 hover:text-slate-700 transition-colors"
                                                title="Copy to clipboard"
                                            >
                                                {copiedField === 'Aadhaar Number' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>

                                        <p className="text-lg font-mono font-black tracking-widest text-slate-800">
                                            {decryptedData ? maskAadhaar(decryptedData.aadhar) : '••••-••••-••••'}
                                        </p>
                                    </div>

                                </section>

                                {/* Plan Requirements Dynamic Banner */}
                                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/5 to-indigo-500/5 border border-blue-500/10 flex items-start gap-3">
                                    <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-black text-blue-900 uppercase tracking-wider">Required Proofs Checklist ({selectedRequest.profiles?.plan_type || 'BASIC'} Plan)</p>
                                        <p className="text-slate-500 text-[10px] font-medium mt-0.5 leading-relaxed">
                                            {selectedRequest.profiles?.plan_type === 'BUSINESS' 
                                                ? "Applicant is required to submit Aadhar Front, Aadhar Back, PAN, Selfie, and Shop Photo proofs."
                                                : selectedRequest.profiles?.plan_type === 'PRO'
                                                    ? "Applicant is required to submit Aadhar Front, Aadhar Back, PAN, and Selfie proofs (Shop Photo is Exempt)."
                                                    : "Applicant is required to submit Aadhaar Front, Aadhaar Back, and PAN proofs only (Selfie & Shop Photo are Exempt)."}
                                        </p>
                                    </div>
                                </div>

                                {/* Documents Cards Stage */}
                                <section className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Proof Gallery</h4>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {['aadhar_front', 'aadhar_back', 'pan_card', 'selfie', 'shop_photo'].map((key) => {
                                            const isRequired = isKeyRequiredForPlan(key, selectedRequest.profiles?.plan_type);
                                            const path = selectedRequest.document_urls?.[key];
                                            const loadedUrl = imageUrls[key];
                                            
                                            return (
                                                <Card 
                                                    key={key} 
                                                    className={cn(
                                                        "overflow-hidden rounded-2xl border transition-all duration-300 flex flex-col shadow-none relative group",
                                                        !isRequired
                                                            ? "border-emerald-100 bg-emerald-50/10"
                                                            : !path
                                                                ? "border-amber-100 bg-amber-50/10"
                                                                : "border-slate-200/80 hover:shadow-md hover:border-slate-300"
                                                    )}
                                                >
                                                    {/* Card Header Label */}
                                                    <div className="px-4 py-2.5 border-b border-slate-100 bg-white flex justify-between items-center shrink-0 min-w-0 gap-2">
                                                        <span className="text-[9px] font-black text-slate-800 uppercase tracking-wider truncate min-w-0" title={key.replace('_', ' ')}>
                                                            {key.replace('_', ' ')}
                                                        </span>
                                                        
                                                        {!isRequired ? (
                                                            <Badge className="bg-emerald-100 text-emerald-800 border-none text-[8px] font-black px-1.5 h-4 py-0 shrink-0">EXEMPT</Badge>
                                                        ) : !path ? (
                                                            <Badge className="bg-amber-100 text-amber-800 border-none text-[8px] font-black px-1.5 h-4 py-0 shrink-0">REQUIRED</Badge>
                                                        ) : (
                                                            <Badge className="bg-blue-100 text-blue-800 border-none text-[8px] font-black px-1.5 h-4 py-0 shrink-0">UPLOADED</Badge>
                                                        )}
                                                    </div>

                                                    {/* Document Card Viewer Stage */}
                                                    <div className="h-36 relative bg-slate-50 flex items-center justify-center overflow-hidden flex-1 select-none">
                                                        {loadingImages ? (
                                                            <div className="w-full h-full p-3 space-y-2">
                                                                <Skeleton className="w-full h-full rounded-lg" />
                                                            </div>
                                                        ) : loadedUrl ? (
                                                            <>
                                                                <img
                                                                    src={loadedUrl}
                                                                    alt={key}
                                                                    className="w-full h-full object-contain p-2 bg-slate-100/50 transition-transform duration-500 group-hover:scale-102"
                                                                />
                                                                
                                                                {/* Hover Action overlay */}
                                                                <button
                                                                    onClick={() => setActiveLightboxImage({
                                                                        key,
                                                                        url: loadedUrl,
                                                                        label: key.replace('_', ' ').toUpperCase()
                                                                    })}
                                                                    className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 backdrop-blur-[2px] cursor-pointer"
                                                                >
                                                                    <Maximize2 className="w-5 h-5 text-white" />
                                                                    <span className="text-[9px] font-black tracking-widest uppercase">Inspect Proof</span>
                                                                </button>
                                                            </>
                                                        ) : (
                                                            /* File Missing / Not required / Access Error block states */
                                                            <div className="p-4 text-center flex flex-col items-center justify-center space-y-2">
                                                                {!isRequired ? (
                                                                    <>
                                                                        <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                                                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[10px] font-black uppercase text-emerald-700">Plan Exempt</p>
                                                                            <p className="text-[8px] text-emerald-600/70 max-w-[130px] mx-auto mt-0.5 leading-snug">
                                                                                {getDocumentRequirementMessage(key, selectedRequest.profiles?.plan_type)}
                                                                            </p>
                                                                        </div>
                                                                    </>
                                                                ) : !path ? (
                                                                    <>
                                                                        <div className="h-10 w-10 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center animate-pulse">
                                                                            <Clock className="w-5 h-5 text-amber-500" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[10px] font-black uppercase text-amber-700">Not Uploaded</p>
                                                                            <p className="text-[8px] text-amber-600/70 max-w-[130px] mx-auto mt-0.5 leading-snug">
                                                                                {getDocumentRequirementMessage(key, selectedRequest.profiles?.plan_type)}
                                                                            </p>
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <div className="h-10 w-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center">
                                                                            <ShieldAlert className="w-5 h-5 text-rose-500" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[10px] font-black uppercase text-rose-700">Access Issue</p>
                                                                            <p className="text-[8px] text-rose-600/70 max-w-[130px] mx-auto mt-0.5 leading-snug">
                                                                                Signed URL creation failed. RLS permissions or path error.
                                                                            </p>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </section>

                                {/* Interactive Verification Actions Hub */}
                                <section className="p-6 bg-slate-50 border border-slate-200/60 rounded-3xl space-y-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 pb-4">
                                        <div>
                                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                                                <ShieldCheck className="w-4 h-4 text-blue-600" /> compliance Audit Checklist
                                            </h4>
                                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Please check off each box as you verify the documents above.</p>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                const allChecked = activeChecklistItems.every(item => approveChecklist[item.key]);
                                                const updated = { ...approveChecklist };
                                                activeChecklistItems.forEach(item => {
                                                    updated[item.key] = !allChecked;
                                                });
                                                setApproveChecklist(updated);
                                            }}
                                            className="text-[9px] font-black tracking-widest uppercase text-blue-600 hover:bg-blue-50 px-3 h-7 rounded-lg shrink-0"
                                        >
                                            {activeChecklistItems.every(item => approveChecklist[item.key]) ? 'Deselect All' : 'Select All Verification Checks'}
                                        </Button>
                                    </div>

                                    {/* Checklist Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {activeChecklistItems.map(({ key, label }) => (
                                            <div
                                                key={key}
                                                onClick={() => setApproveChecklist(prev => ({ ...prev, [key]: !prev[key] }))}
                                                className={cn(
                                                    "flex items-start gap-3.5 bg-white p-4 rounded-xl border cursor-pointer select-none transition-all duration-300 hover:shadow-sm",
                                                    approveChecklist[key] 
                                                        ? "border-emerald-500/30 bg-emerald-50/10 ring-1 ring-emerald-500/10" 
                                                        : "border-slate-100 hover:border-slate-200"
                                                )}
                                            >
                                                <Checkbox
                                                    id={`chk-${key}`}
                                                    checked={approveChecklist[key]}
                                                    className="mt-0.5 w-5 h-5 rounded-md border-2 border-slate-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-none text-white pointer-events-none"
                                                />
                                                <span className={cn(
                                                    "text-xs font-bold leading-tight select-none",
                                                    approveChecklist[key] 
                                                        ? "text-emerald-700/60 line-through decoration-emerald-500/30 decoration-2" 
                                                        : "text-slate-600"
                                                )}>
                                                    {label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Action row */}
                                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200/50">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowRejectDialog(true)}
                                            disabled={updateStatus.isPending}
                                            className="h-12 px-6 rounded-xl border border-rose-200 text-rose-600 font-bold hover:bg-rose-50 hover:text-rose-700 transition-all text-xs"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" /> Reject & Return Application
                                        </Button>

                                        <Button
                                            onClick={handleExecuteApprove}
                                            disabled={!isApproveEnabled || updateStatus.isPending || loadingImages}
                                            className={cn(
                                                "h-12 px-8 rounded-xl font-black shadow-lg transition-all duration-300 text-xs border-0",
                                                isApproveEnabled
                                                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-600"
                                                    : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                                            )}
                                        >
                                            {updateStatus.isPending ? (
                                                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Auditing...</>
                                            ) : (
                                                <><CheckCircle className="w-4 h-4 mr-2" /> Approve & Unlock KYC Account</>
                                            )}
                                        </Button>
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Immersive Image Lightbox */}
            {activeLightboxImage && (
                <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-6 select-none animate-in fade-in duration-300">
                    
                    {/* Lightbox Top Header */}
                    <div className="flex items-center justify-between w-full shrink-0 border-b border-white/10 pb-4 text-white gap-2">
                        <div>
                            <span className="text-[8px] sm:text-[9px] font-black tracking-widest text-slate-400 uppercase">Document Inspection</span>
                            <h3 className="text-xs sm:text-sm font-bold mt-0.5 tracking-wide text-blue-400 truncate max-w-[150px] sm:max-w-none">{activeLightboxImage.label}</h3>
                        </div>
                        
                        <div className="flex items-center gap-1.5 sm:gap-3">
                            <span className="text-slate-400 text-[10px] sm:text-xs font-mono bg-white/5 border border-white/10 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl shrink-0">
                                {Object.keys(imageUrls).indexOf(activeLightboxImage.key) + 1} / {Object.keys(imageUrls).filter(k => imageUrls[k]).length}
                            </span>
                            <button
                                onClick={() => setActiveLightboxImage(null)}
                                className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                            >
                                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Lightbox Center Image Stage */}
                    <div className="flex-1 flex items-center justify-center overflow-hidden relative p-4 my-4">
                        
                        {/* Prev Image shortcut arrow */}
                        {Object.keys(imageUrls).filter(k => imageUrls[k]).length > 1 && (
                            <button
                                onClick={() => handleCycleImage('prev')}
                                className="absolute left-2 sm:left-6 z-10 p-2.5 sm:p-4 rounded-full bg-black/60 border border-white/5 text-white hover:bg-blue-600 transition-all cursor-pointer shadow-lg"
                                title="Previous document"
                            >
                                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        )}

                        {/* Img Box wrapper with zoom and rotation applied */}
                        <div 
                            className="transition-transform duration-300 ease-out flex items-center justify-center max-w-[85vw] max-h-[70vh]"
                            style={{ 
                                transform: `scale(${lightboxZoom}) rotate(${lightboxRotation}deg)`
                            }}
                        >
                            <img
                                src={activeLightboxImage.url}
                                alt={activeLightboxImage.label}
                                className="max-w-full max-h-[70vh] object-contain rounded-lg border border-white/10 shadow-2xl"
                                draggable="false"
                            />
                        </div>

                        {/* Next Image shortcut arrow */}
                        {Object.keys(imageUrls).filter(k => imageUrls[k]).length > 1 && (
                            <button
                                onClick={() => handleCycleImage('next')}
                                className="absolute right-2 sm:right-6 z-10 p-2.5 sm:p-4 rounded-full bg-black/60 border border-white/5 text-white hover:bg-blue-600 transition-all cursor-pointer shadow-lg"
                                title="Next document"
                            >
                                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        )}
                    </div>

                    {/* Lightbox Action controls toolbar */}
                    <div className="flex items-center justify-center gap-1.5 sm:gap-3 shrink-0 border-t border-white/10 pt-4 flex-wrap pb-2 sm:pb-0">
                        <button
                            onClick={() => handleZoom('in')}
                            className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/15 hover:text-white transition-all cursor-pointer"
                            title="Zoom In"
                        >
                            <ZoomIn className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                        </button>
                        
                        <button
                            onClick={() => handleZoom('out')}
                            className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/15 hover:text-white transition-all cursor-pointer"
                            title="Zoom Out"
                        >
                            <ZoomOut className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                        </button>

                        <div className="h-6 w-px bg-white/10 mx-1 sm:mx-2" />

                        <button
                            onClick={() => handleRotate('ccw')}
                            className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/15 hover:text-white transition-all cursor-pointer"
                            title="Rotate 90° Counter-Clockwise"
                        >
                            <RotateCcw className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                        </button>

                        <button
                            onClick={() => handleRotate('cw')}
                            className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/15 hover:text-white transition-all cursor-pointer"
                            title="Rotate 90° Clockwise"
                        >
                            <RotateCw className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                        </button>

                        <div className="h-6 w-px bg-white/10 mx-1 sm:mx-2" />

                        <button
                            onClick={handleResetLightbox}
                            className="px-3 sm:px-5 h-9 sm:h-11 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-[10px] sm:text-xs font-bold text-slate-300 hover:bg-white/15 hover:text-white transition-all cursor-pointer"
                        >
                            Reset
                        </button>
                    </div>

                </div>
            )}

            {/* Rejection Capture Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent className="max-w-md rounded-[32px] p-8 border-none shadow-2xl bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-slate-900 tracking-tight">Reject Application</DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs">
                            Please provide a detailed reason. This message will be sent to the applicant to help them correct their document uploads.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-5">
                        <textarea
                            className="w-full h-32 rounded-2xl border-2 border-slate-100 p-4 font-medium text-xs text-slate-800 placeholder:text-slate-400 focus:border-rose-300 focus:outline-none transition-all resize-none bg-slate-50/50"
                            placeholder="e.g., Aadhaar Back photo is blurry and illegible. Please take a clear, high-resolution photo and re-upload..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button 
                            variant="ghost" 
                            className="rounded-xl font-bold text-slate-500 text-xs" 
                            onClick={() => {
                                setShowRejectDialog(false);
                                setRejectReason("");
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="rounded-xl bg-rose-600 text-white font-bold px-6 hover:bg-rose-700 shadow-lg shadow-rose-600/10 text-xs"
                            onClick={handleRejectSubmit}
                            disabled={updateStatus.isPending || !rejectReason.trim()}
                        >
                            {updateStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Rejection"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
};
