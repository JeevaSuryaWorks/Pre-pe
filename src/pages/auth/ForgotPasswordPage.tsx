import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/update-password`,
        });

        setLoading(false);

        if (error) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } else {
            setSuccess(true);
            toast({
                title: "Email Sent",
                description: "Check your inbox for the password reset link.",
            });
        }
    };

    return (
        <Layout hideHeader>
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#FF671F]/5 via-white to-[#046A38]/10 relative overflow-hidden">
                {/* Decorative patriotic elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF671F]/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#046A38]/10 rounded-full blur-3xl -ml-32 -mb-32" />

                <Card className="w-full max-w-md shadow-2xl border-none bg-white/90 backdrop-blur-xl rounded-[32px] overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-[#FF671F]/5 to-transparent border-b border-slate-100">
                        <Button variant="ghost" className="w-fit p-0 h-auto mb-4 hover:bg-transparent text-[#FF671F] font-bold" onClick={() => navigate('/login')}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                        </Button>
                        <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">Reset Password</CardTitle>
                        <CardDescription className="text-slate-500 font-medium pt-1">
                            Enter your email address and we'll send you a link to reset your password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {success ? (
                            <div className="text-center py-8 space-y-4">
                                <div className="w-20 h-20 bg-[#046A38]/10 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-[#046A38]/5">
                                    <Mail className="w-10 h-10 text-[#046A38]" />
                                </div>
                                <h3 className="font-black text-2xl text-slate-900 tracking-tight">Check your email</h3>
                                <p className="text-slate-500 font-medium">
                                    We have sent a password reset link to <br />
                                    <span className="font-black text-[#FF671F]">{email}</span>.
                                </p>
                                <Button className="w-full h-12 bg-[#046A38] hover:bg-[#035a2f] text-white font-bold rounded-xl shadow-lg shadow-[#046A38]/20" onClick={() => navigate('/login')}>
                                    Return to Sign In 🇮🇳
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleReset} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-xs font-black uppercase tracking-wider text-slate-500">Email Address</Label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#FF671F] transition-colors" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-[#FF671F] rounded-xl transition-all"
                                        />
                                    </div>
                                </div>
                                <Button className="w-full h-12 bg-[#FF671F] hover:bg-orange-600 text-white font-black rounded-xl shadow-lg shadow-orange-600/20 active:scale-95 transition-all" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : "Send Reset Link 🇮🇳"}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default ForgotPasswordPage;
