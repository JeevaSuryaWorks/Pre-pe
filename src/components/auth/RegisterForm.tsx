import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Lock, User, Smartphone, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export function RegisterForm() {
    const navigate = useNavigate();
    const { signUp, signInWithGoogle } = useAuth();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string; phone?: string }>({});

    const validateForm = () => {
        const newErrors: { email?: string; password?: string; fullName?: string; phone?: string } = {};

        try {
            emailSchema.parse(email);
        } catch (e) {
            if (e instanceof z.ZodError) {
                newErrors.email = e.errors[0].message;
            }
        }

        try {
            passwordSchema.parse(password);
        } catch (e) {
            if (e instanceof z.ZodError) {
                newErrors.password = e.errors[0].message;
            }
        }

        if (!fullName.trim()) {
            newErrors.fullName = 'Please enter your full name';
        }

        // Simple 10 digit validation as we prepend +91
        if (!phone.trim() || phone.length !== 10) {
            newErrors.phone = 'Please enter a valid 10-digit mobile number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        const fullPhone = `+91${phone}`;
        const { error } = await signUp(email, password, fullName, fullPhone);
        setLoading(false);

        if (error) {
            if (error.message.includes('already registered')) {
                toast({
                    title: 'Account exists',
                    description: 'This email is already registered. Please sign in instead.',
                    variant: 'destructive',
                });
                navigate('/login');
            } else {
                toast({
                    title: 'Sign up failed',
                    description: error.message,
                    variant: 'destructive',
                });
            }
        } else {
            toast({
                title: 'Account created!',
                description: 'Please check your email to verify your account.',
            });
            navigate('/auth/verify-email');
        }
    };

    const handleGoogleSignUp = async () => {
        setLoading(true);
        const { error } = await signInWithGoogle();
        if (error) {
            toast({
                title: 'Google Sign up failed',
                description: error.message,
                variant: 'destructive',
            });
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200 pt-4">
            <Button
                type="button"
                variant="outline"
                className="w-full h-11 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 font-medium transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                onClick={handleGoogleSignUp}
                disabled={loading}
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    <svg className="h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                        <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                    </svg>
                )}
                Continue with Google
            </Button>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500">Or register with</span>
                </div>
            </div>

            <form onSubmit={handleSignUp} className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullname">Full Name</Label>
                        <div className="relative group">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                id="fullname"
                                placeholder="John Doe"
                                className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 transition-all"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>
                        {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <div className="relative group flex items-center">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10">
                                <Smartphone />
                            </div>
                            <div className="absolute left-9 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 z-10">
                                +91
                            </div>
                            <Input
                                id="phone"
                                placeholder="9876543210"
                                type="tel"
                                maxLength={10}
                                className="pl-20 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 transition-all"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                            />
                        </div>
                        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                    </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-base font-semibold mt-2 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-slate-200">
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Account...
                        </>
                    ) : (
                        <>Create Account <ArrowRight className="ml-2 w-4 h-4" /></>
                    )}
                </Button>

                <div className="text-center mt-6">
                    <p className="text-sm text-slate-500">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                            Sign In here
                        </Link>
                    </p>
                </div>
            </form>
        </div>
    );
}
