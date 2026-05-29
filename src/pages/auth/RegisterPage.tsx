import { Layout } from '@/components/layout/Layout';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    if (loading) {
        return (
            <Layout hideHeader>
                <div className="container py-8 flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    if (user) {
        return <Navigate to="/home" replace />;
    }

    return (
        <Layout hideHeader>
            <div className="min-h-screen flex items-center justify-center p-4 py-12 bg-gradient-to-br from-[#FF671F]/5 via-white to-[#046A38]/10 relative">
                {/* Decorative patriotic elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF671F]/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#046A38]/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />
                
                <div className="w-full max-w-md space-y-8 relative z-10">
                    <div className="text-center space-y-2">
                        <img src="/icon_new.png" alt="PrePe Logo" className="h-16 w-16 mb-4 mx-auto object-contain shadow-xl rounded-2xl bg-white p-1" />
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create Account</h1>
                        <p className="text-slate-500 font-medium">Join PrePe for fast and secure payments. 🇮🇳</p>
                    </div>

                    <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white/90 backdrop-blur-xl rounded-[32px] overflow-hidden">
                        <CardContent className="pt-6">
                            <RegisterForm />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
};

export default RegisterPage;
