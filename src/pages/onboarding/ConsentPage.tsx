import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Loader2, MessageCircle, BellRing, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function ConsentPage() {
    const navigate = useNavigate();
    const { updateProfile } = useProfile();
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState<boolean>(false);

    const handleConsent = async (consent: boolean) => {
        setSubmitting(true);
        try {
            const success = await updateProfile({ whatsapp_consent: consent });
            
            if (success) {
                toast({
                    title: consent ? "Subscribed to Reminders" : "Consent Saved",
                    description: consent ? "You'll now receive bill reminders on WhatsApp." : "You can always change this in settings later.",
                });
                navigate('/home'); // Send to home, ProtectedRoute will catch if KYC is missing
            } else {
                toast({
                    title: "Update Failed",
                    description: "We couldn't update your preferences. Please try again.",
                    variant: "destructive"
                });
            }
        } catch (err: any) {
             toast({
                title: "Error",
                description: err.message,
                variant: "destructive"
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Layout hideHeader>
            <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50/50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-lg"
                >
                    <Card className="border-none shadow-2xl bg-white overflow-hidden">
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-center text-white relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                            <div className="relative z-10 flex justify-center mb-6">
                                <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                                    <MessageCircle className="w-12 h-12 text-white" />
                                </div>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight relative z-10 mb-2">BharatConnect Reminders</h2>
                            <p className="text-green-50 relative z-10 text-lg">Never miss a bill payment again.</p>
                        </div>
                        
                        <CardContent className="p-8 space-y-8">
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="bg-green-100 p-3 rounded-xl h-fit">
                                        <BellRing className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900 text-lg">Timely Alerts</h4>
                                        <p className="text-slate-500 leading-relaxed">Receive automated WhatsApp notifications a few days before your bills are due.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="bg-blue-100 p-3 rounded-xl h-fit">
                                        <ShieldCheck className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900 text-lg">Secure & Spam-Free</h4>
                                        <p className="text-slate-500 leading-relaxed">We only send important alerts from verified BharatConnect. No marketing spam.</p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-slate-400 text-center px-4">
                                By allowing, you give PrePe consent to send messages to your registered mobile number via WhatsApp.
                            </p>
                        </CardContent>

                        <CardFooter className="p-8 pt-0 flex flex-col gap-3">
                            <Button 
                                onClick={() => handleConsent(true)} 
                                disabled={submitting}
                                className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700 text-white transition-all transform hover:scale-[1.02] shadow-lg shadow-green-600/20"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Yes, Enable WhatsApp Reminders"}
                            </Button>
                            <Button 
                                onClick={() => handleConsent(false)} 
                                disabled={submitting}
                                variant="ghost" 
                                className="w-full h-12 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                            >
                                Skip for now
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        </Layout>
    );
}
