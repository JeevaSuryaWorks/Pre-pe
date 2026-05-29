import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useKYC } from '@/hooks/useKYC';
import { useProfile } from '@/hooks/useProfile';
import { BrandLoader } from '@/components/ui/BrandLoader';
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
                    <BrandLoader size="md" />
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

    // 0. Terms Acceptance Guard
    if (!user.user_metadata?.terms_accepted && location.pathname !== '/terms-acceptance') {
        console.log('[ProtectedRoute] Redirecting to /terms-acceptance');
        return <Navigate to="/terms-acceptance" replace />;
    }

    // 1. Capture phone numbers missing from OAuth signups
    const hasPhone = user.phone || user.user_metadata?.phone;
    if (!hasPhone && location.pathname !== '/auth/complete-profile' && location.pathname !== '/terms-acceptance') {
        return <Navigate to="/auth/complete-profile" replace />;
    }

    // 2. Force plan Selection
    if (!profileLoading && !profile?.plan_type && 
        location.pathname !== '/onboarding/plans' &&
        location.pathname !== '/terms-acceptance'
    ) {
        console.log('[ProtectedRoute] Redirecting to /onboarding/plans (No plan selected)');
        return <Navigate to="/onboarding/plans" replace />;
    }

    // 3. Force KYC submission ONLY AFTER Plan is selected. 
    // Basic plan users are NOT forced to complete KYC to browse the dashboard, but their services are faded/locked.
    if (planType !== 'BASIC' && !kycLoading && kycStatus === null && 
        location.pathname !== '/kyc' && 
        location.pathname !== '/onboarding/plans' &&
        location.pathname !== '/terms-acceptance'
    ) {
        console.log('[ProtectedRoute] Redirecting to /kyc (No kyc status found)');
        return <Navigate to="/kyc" replace />;
    }

    return <Outlet />;
}

