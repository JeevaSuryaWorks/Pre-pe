import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const UpdatePasswordPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.updateUser({
            password: password
        });

        setLoading(false);

        if (error) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } else {
            toast({
                title: "Success",
                description: "Your password has been updated. Please sign in.",
            });
            navigate('/login');
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
                        <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">Set New Password</CardTitle>
                        <CardDescription className="text-slate-500 font-medium pt-1">
                            Please create a new secure password for your account. 🇮🇳
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-xs font-black uppercase tracking-wider text-slate-500">New Password</Label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#FF671F] transition-colors" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-[#FF671F] rounded-xl transition-all"
                                        minLength={6}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button className="w-full h-12 bg-[#FF671F] hover:bg-orange-600 text-white font-black rounded-xl shadow-lg shadow-orange-600/20 active:scale-95 transition-all" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : "Update Password 🇮🇳"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default UpdatePasswordPage;
