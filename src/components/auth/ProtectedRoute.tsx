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

    if (user.email === 'connect.prepe@gmail.com') {
        return <Navigate to="/admin" replace />;
    }

    // Capture phone numbers missing from OAuth signups
    const hasPhone = user.phone || user.user_metadata?.phone;
    if (!hasPhone && location.pathname !== '/auth/complete-profile') {
        return <Navigate to="/auth/complete-profile" replace />;
    }

    // Ensure plan is selected
    if (!profile?.plan_type && location.pathname !== '/onboarding/plans') {
        return <Navigate to="/onboarding/plans" replace />;
    }

    // Ensure Whatsapp consent is handled
    if (profile?.whatsapp_consent === null && location.pathname !== '/onboarding/consent' && location.pathname !== '/onboarding/plans') {
        return <Navigate to="/onboarding/consent" replace />;
    }

    // Force KYC submission. If status is null, it means no record exists.
    // Ensure we don't redirect if we are still loading or fetching data.
    if (!kycLoading && kycStatus === null && location.pathname !== '/kyc' && location.pathname !== '/onboarding/plans' && location.pathname !== '/onboarding/consent') {
        console.log('[ProtectedRoute] Redirecting to /kyc (No kyc status found)');
        return <Navigate to="/kyc" replace />;
    }

    return <Outlet />;
}

