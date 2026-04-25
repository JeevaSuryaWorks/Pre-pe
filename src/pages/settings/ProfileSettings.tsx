import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, User, Mail, Phone, Camera, Shield, CheckCircle2, Sparkles, LayoutPanelLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

const ProfileSettings = () => {
    const navigate = useNavigate();
    const { user, refreshSession } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
    const [simProvider, setSimProvider] = useState(user?.user_metadata?.sim_provider || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');
    const [uploading, setUploading] = useState(false);

    // Create a ref for the file input
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync state with user data when it becomes available
    useEffect(() => {
        if (user) {
            setFullName(user.user_metadata?.full_name || '');
            setSimProvider(user.user_metadata?.sim_provider || '');
            setAvatarUrl(user.user_metadata?.avatar_url || '');
        }
    }, [user]);

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                return;
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${user?.id}/${fileName}`;

            // Upload the file to Supabase storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // Get the public URL
            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatarUrl(data.publicUrl);

            toast({
                title: "Image uploaded",
                description: "Your new profile picture is ready to save.",
            });

        } catch (error: any) {
            toast({
                title: "Error uploading image",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: fullName,
                    avatar_url: avatarUrl,
                    sim_provider: simProvider,
                }
            });

            // Also update the public profile in the database
            const { error: profileError } = await (supabase
                .from('profiles')
                .update({ 
                    full_name: fullName, 
                    sim_provider: simProvider 
                } as any)
                .eq('user_id', user?.id) as any);

            if (profileError) throw profileError;

            if (error) throw error;

            await refreshSession();

            toast({
                title: "Profile updated",
                description: "Your profile has been successfully updated.",
            });

            navigate('/profile'); // Go back to profile instead of reloading here

        } catch (error: any) {
            toast({
                title: "Error updating profile",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex justify-center w-full">
            <div className="w-full max-w-md bg-[#F8FAFC] min-h-screen relative flex flex-col pb-10">
                
                {/* Premium Header */}
                <div className="bg-white/80 backdrop-blur-xl px-6 py-5 flex items-center justify-between sticky top-0 z-50 border-b border-slate-100/50 shadow-sm">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100" 
                        onClick={() => navigate(-1)}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em]">Personal Info</h1>
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                        <User className="w-4 h-4 text-indigo-600" />
                    </div>
                </div>

                <div className="p-8 space-y-10">
                    {/* Avatar Upload with Premium Styling */}
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <motion.div 
                                whileHover={{ scale: 1.05 }}
                                className="relative p-2 rounded-[2.5rem] bg-white shadow-2xl border border-white cursor-pointer group"
                                onClick={handleImageClick}
                            >
                                <Avatar className="h-32 w-32 rounded-[2rem] overflow-hidden">
                                    <AvatarImage src={avatarUrl} className="object-cover w-full h-full" />
                                    <AvatarFallback className="text-4xl font-black bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                                        {(fullName?.[0] || 'U').toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-2 bg-black/40 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                                    <Camera className="h-8 w-8 text-white" />
                                </div>
                            </motion.div>
                            <button 
                                onClick={handleImageClick}
                                className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-3 rounded-2xl border-4 border-white shadow-xl hover:scale-110 transition-transform active:scale-95"
                            >
                                <Camera className="h-4 w-4" />
                            </button>
                            {/* Hidden File Input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                        {uploading && (
                            <div className="mt-4 flex items-center gap-2 px-4 py-1.5 bg-indigo-50 rounded-full border border-indigo-100">
                                <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Uploading...</span>
                            </div>
                        )}
                    </div>

                    {/* Form Fields with Modern Design */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</Label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                    <User className="h-4 w-4" />
                                </div>
                                <Input
                                    id="name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="pl-12 h-14 bg-white border-slate-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold text-slate-700"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</Label>
                            <div className="relative opacity-60">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-slate-400">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <Input
                                    id="email"
                                    value={user?.email || ''}
                                    className="pl-12 h-14 bg-slate-100/50 border-slate-100 rounded-2xl cursor-not-allowed font-bold text-slate-500"
                                    readOnly
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <Shield className="w-4 h-4 text-slate-300" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Verified Mobile</Label>
                            <div className="relative opacity-60">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-slate-400">
                                    <Phone className="h-4 w-4" />
                                </div>
                                <Input
                                    id="phone"
                                    value={user?.phone || user?.user_metadata?.phone || ''}
                                    className="pl-12 h-14 bg-slate-100/50 border-slate-100 rounded-2xl cursor-not-allowed font-bold text-slate-500"
                                    readOnly
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sim-provider" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Network Operator</Label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                    <LayoutPanelLeft className="h-4 w-4" />
                                </div>
                                <select 
                                    id="sim-provider"
                                    value={simProvider}
                                    onChange={(e) => setSimProvider(e.target.value)}
                                    className="w-full pl-12 pr-4 h-14 bg-white border border-slate-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold text-slate-700 appearance-none"
                                >
                                    <option value="">Choose Provider</option>
                                    <option value="Airtel">Airtel 5G</option>
                                    <option value="Jio">Jio True 5G</option>
                                    <option value="Vi">Vodafone Idea</option>
                                    <option value="BSNL">BSNL Mobile</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Premium Update Button */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button
                            onClick={handleUpdateProfile}
                            disabled={loading || uploading}
                            className="w-full h-16 rounded-[2rem] bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-200 hover:bg-slate-800 transition-all border border-white/10"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <div className="flex items-center gap-3">
                                    <span>Update Executive Profile</span>
                                    <Shield className="w-4 h-4 text-indigo-400" />
                                </div>
                            )}
                        </Button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;

