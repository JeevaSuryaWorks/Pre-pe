import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useKYC } from '@/hooks/useKYC';
import { useProfile } from '@/hooks/useProfile';
import { Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';

export const ProtectedRoute = () => {
    const { user, loading: authLoading } = useAuth();
    const { status: kycStatus, isInitialLoading, isLoading: kycLoading } = useKYC();
    const { profile, loading: profileLoading } = useProfile();
    const location = useLocation();

    console.log('[ProtectedRoute] Rendering:', { 
        path: location.pathname, 
        authLoading, 
        isInitialLoading, 
        kycLoading,
        profileLoading,
        kycStatus,
        user: user?.email,
        planType: profile?.plan_type,
        consent: profile?.whatsapp_consent
    });

    const planType = profile?.plan_type;
    const isBusiness = planType === 'BUSINESS';

    // If data is still loading (or user exists but data undefined), show loader
    // derived from useKYC's hardened logic.
    // Use isInitialLoading here to prevent flickering on background updates.
    if (authLoading || isInitialLoading || profileLoading) {
        return (
            <Layout hideHeader>
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const AUTHORIZED_ADMINS = [
        'connect.prepe@gmail.com',
        'prepeindia@outlook.com',
        'prepeindia@zohomail.in',
        'jeevasuriya2007@gmail.com'
    ];

    const isAdmin = AUTHORIZED_ADMINS.includes(user.email || '');

    if (isAdmin) {
        // Admin is excluded from standard onboarding/KYC flow
        return <Outlet />;
    }

    // Force plan Selection FIRST - But allow /home to be a safe landing zone
    if (!profileLoading && !profile?.plan_type && 
        location.pathname !== '/onboarding/plans' && 
        location.pathname !== '/home' && 
        location.pathname !== '/onboarding/consent'
    ) {
        console.log('[ProtectedRoute] Redirecting to /onboarding/plans (No plan selected)');
        return <Navigate to="/onboarding/plans" replace />;
    }

    // Capture phone numbers missing from OAuth signups
    const hasPhone = user.phone || user.user_metadata?.phone;
    if (!hasPhone && location.pathname !== '/auth/complete-profile') {
        return <Navigate to="/auth/complete-profile" replace />;
    }

    // Ensure Whatsapp consent is handled
    if (profile?.whatsapp_consent === null && location.pathname !== '/onboarding/consent' && location.pathname !== '/onboarding/plans') {
        return <Navigate to="/onboarding/consent" replace />;
    }

    // Force KYC submission ONLY AFTER Plan is selected. 
    if (!kycLoading && kycStatus === null && location.pathname !== '/kyc' && location.pathname !== '/onboarding/plans' && location.pathname !== '/onboarding/consent') {
        console.log('[ProtectedRoute] Redirecting to /kyc (No kyc status found)');
        return <Navigate to="/kyc" replace />;
    }

    return <Outlet />;
}

