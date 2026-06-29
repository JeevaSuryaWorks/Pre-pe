import { useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, LayoutDashboard, Users, Receipt, Wallet, Settings, LogOut, Shield, Banknote, CreditCard, Gift, HelpCircle, Bell, UserCheck, ChevronRight, ChevronDown, Menu, X, ShoppingBag, Package, ShoppingCart, Store, ExternalLink, MessageSquare } from "lucide-react";
import { BrandLoader } from "@/components/ui/BrandLoader";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { supportService } from "@/services/support.service";
import { Badge } from "@/components/ui/badge";

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [pendingComplaints, setPendingComplaints] = useState(0);
    const [adminEmail, setAdminEmail] = useState("");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isEcomPath = location.pathname.startsWith('/admin/buyers') || 
                       location.pathname.startsWith('/admin/products') || 
                       location.pathname.startsWith('/admin/orders') || 
                       location.pathname.startsWith('/admin/sellers') ||
                       location.pathname.startsWith('/seller/dashboard');
    const [isStoreExpanded, setIsStoreExpanded] = useState(isEcomPath);

    useEffect(() => {
        if (isEcomPath) {
            setIsStoreExpanded(true);
        }
    }, [location.pathname]);

    useEffect(() => {
        checkAdmin();
    }, []);

    useEffect(() => {
        if (isAdmin) {
            fetchPendingCount();
            const interval = setInterval(fetchPendingCount, 8000); // sync badge count every 8s
            return () => clearInterval(interval);
        }
    }, [isAdmin]);

    const fetchPendingCount = async () => {
        try {
            const data = await supportService.getAdminTickets();
            const pending = data.filter((t: any) => t.status === "PENDING").length;
            setPendingComplaints(pending);
        } catch (e) {
            console.error("Failed to load badge count:", e);
        }
    };

    const checkAdmin = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate("/auth");
                return;
            }

            setAdminEmail(session.user.email || "Admin");

            // Check role
            const { data: roleData, error } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id)
                .single();

            if (error || roleData?.role !== 'admin') {
                console.error("Access denied:", error);
                navigate("/"); // Redirect to home if not admin
                return;
            }

            setIsAdmin(true);
        } catch (err) {
            console.error(err);
            navigate("/");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/auth");
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
                <BrandLoader size="lg" message="Initializing Security..." />
            </div>
        );
    }

    if (!isAdmin) return null;

    const navItems = [
        { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
        { icon: HelpCircle, label: "Complaints Desk", path: "/admin/complaints", badge: pendingComplaints },
        { icon: Shield, label: "KYC Requests", path: "/admin/kyc" },
        { icon: Banknote, label: "Fund Requests", path: "/admin/fund-requests" },
        { icon: Users, label: "User Management", path: "/admin/users" },
        { icon: CreditCard, label: "Paid Users", path: "/admin/paid-users" },
        { icon: Settings, label: "Plan Manager", path: "/admin/plan-manager" },
        { icon: Gift, label: "Rewards Manager", path: "/admin/rewards" },
        { icon: Receipt, label: "Transactions", path: "/admin/transactions" },
        { icon: Wallet, label: "Commissions", path: "/admin/commissions" },
        { icon: Terminal, label: "API Panel", path: "/admin/api-panel" },
        { icon: MessageSquare, label: "Automation", path: "/admin/automation" },
    ];

    // E-Commerce sub-section
    const ecomItems = [
        { icon: ShoppingBag, label: "Buyers", path: "/admin/buyers" },
        { icon: Package, label: "Products", path: "/admin/products" },
        { icon: ShoppingCart, label: "Orders", path: "/admin/orders" },
        { icon: Store, label: "Sellers", path: "/admin/sellers" },
        { icon: ExternalLink, label: "Seller Portal", path: "/seller/dashboard" },
    ];

    const allNavItems = [...navItems, ...ecomItems];

    // Find the active page label for breadcrumbs
    const currentActiveItem = allNavItems.find(item => item.path === location.pathname);

    return (
        <div className="flex h-screen bg-slate-50/50 overflow-hidden relative">
            {/* Visual glow shapes in the background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-100/30 blur-[120px] pointer-events-none -z-10" />
            <div className="absolute bottom-0 left-64 w-[600px] h-[600px] rounded-full bg-indigo-100/20 blur-[150px] pointer-events-none -z-10" />

            {/* Mobile Drawer Navigation Sidebar Drawer */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 lg:hidden flex">
                    {/* Backdrop overlay */}
                    <div 
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    
                    {/* Drawer Content */}
                    <aside className="w-72 bg-white flex flex-col h-full z-50 shadow-[4px_0_30px_rgba(0,0,0,0.08)] relative animate-in slide-in-from-left duration-300">
                        {/* Drawer Header Brand Panel */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <span className="text-white font-black text-xl tracking-tight">P</span>
                                </div>
                                <div>
                                    <h1 className="text-xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                                        Pre-pe
                                    </h1>
                                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">ADMIN CONTROL</span>
                                </div>
                            </div>
                            
                            {/* Close drawer button */}
                            <button 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
                            >
                                <X className="h-5 w-5 text-slate-500" />
                            </button>
                        </div>

                        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <button
                                        key={item.path}
                                        onClick={() => {
                                            navigate(item.path);
                                            setIsMobileMenuOpen(false); // Close on selection
                                        }}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group ${
                                            isActive
                                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/10 scale-[1.02] font-semibold"
                                                : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className={`h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`} />
                                            <span className="text-sm font-semibold tracking-tight">{item.label}</span>
                                        </div>
                                        {item.badge !== undefined && item.badge > 0 && (
                                            <Badge className={`text-[10px] font-black border-0 px-2 py-0.5 rounded-full ${
                                                isActive 
                                                    ? "bg-white text-blue-600" 
                                                    : "bg-rose-100 text-rose-700 border border-rose-200/50"
                                            }`}>
                                                {item.badge}
                                            </Badge>
                                        )}
                                    </button>
                                );
                            })}

                            {/* E-Commerce Collapsible Section */}
                            <div className="space-y-1 pt-2">
                                <button
                                    onClick={() => setIsStoreExpanded(!isStoreExpanded)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group ${
                                        isEcomPath 
                                            ? "bg-orange-50 text-orange-950 font-bold border border-orange-100" 
                                            : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Store className={`h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isEcomPath ? "text-orange-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                                        <span className="text-sm font-semibold tracking-tight">Store</span>
                                    </div>
                                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isStoreExpanded ? "rotate-180 text-orange-600" : ""}`} />
                                </button>

                                {isStoreExpanded && (
                                    <div className="pl-4 space-y-1.5 mt-1.5 border-l border-slate-100 ml-6 animate-in slide-in-from-top-1 duration-200">
                                        {ecomItems.map((item) => {
                                            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                                            return (
                                                <button
                                                    key={item.path}
                                                    onClick={() => {
                                                        navigate(item.path);
                                                        setIsMobileMenuOpen(false);
                                                    }}
                                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group ${
                                                        isActive
                                                            ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/20 scale-[1.02] font-semibold"
                                                            : "text-slate-600 hover:bg-orange-50/40 hover:text-slate-900"
                                                    }`}
                                                >
                                                    <item.icon className={`h-4.5 w-4.5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-white" : "text-orange-400 group-hover:text-orange-600"}`} />
                                                    <span className="text-xs font-semibold tracking-tight">{item.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </nav>

                        {/* Sidebar User profile footer */}
                        <div className="p-4 border-t border-slate-100/80 bg-slate-50/50">
                            <div className="flex items-center gap-3 px-2 py-3 rounded-xl mb-3">
                                <div className="h-9 w-9 rounded-full bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-sm uppercase">
                                    {adminEmail[0]}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-800 truncate leading-none mb-1">Administrative Role</p>
                                    <p className="text-[10px] font-medium text-slate-400 truncate leading-none">{adminEmail}</p>
                                </div>
                            </div>
                            
                            <Button
                                variant="ghost"
                                className="w-full justify-start rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold h-11 border border-transparent hover:border-rose-100/50 transition-all duration-300"
                                onClick={handleLogout}
                            >
                                <LogOut className="mr-2 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
                                Sign Out
                            </Button>
                        </div>
                    </aside>
                </div>
            )}

            {/* Permanent Sidebar (visible only on wide screens) */}
            <aside className="w-72 bg-white/70 backdrop-blur-xl border-r border-slate-200/60 lg:flex flex-col z-20 shadow-[4px_0_30px_rgba(0,0,0,0.015)] relative hidden">
                
                {/* Sidebar Header Brand Panel */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <span className="text-white font-black text-xl tracking-tight">P</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                                Pre-pe
                            </h1>
                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">ADMIN CONTROL</span>
                        </div>
                    </div>
                </div>

                {/* Sidebar Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group ${
                                    isActive
                                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/10 scale-[1.02] font-semibold"
                                        : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon className={`h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`} />
                                    <span className="text-sm font-semibold tracking-tight">{item.label}</span>
                                </div>
                                {item.badge !== undefined && item.badge > 0 && (
                                    <Badge className={`text-[10px] font-black border-0 px-2 py-0.5 rounded-full ${
                                        isActive 
                                            ? "bg-white text-blue-600" 
                                            : "bg-rose-100 text-rose-700 border border-rose-200/50 animate-pulse"
                                    }`}>
                                        {item.badge}
                                    </Badge>
                                )}
                            </button>
                        );
                    })}

                    {/* E-Commerce Collapsible Section */}
                    <div className="space-y-1 pt-2">
                        <button
                            onClick={() => setIsStoreExpanded(!isStoreExpanded)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group ${
                                isEcomPath 
                                    ? "bg-orange-50 text-orange-950 font-bold border border-orange-100" 
                                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <Store className={`h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isEcomPath ? "text-orange-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                                <span className="text-sm font-semibold tracking-tight">Store</span>
                            </div>
                            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isStoreExpanded ? "rotate-180 text-orange-600" : ""}`} />
                        </button>

                        {isStoreExpanded && (
                            <div className="pl-4 space-y-1.5 mt-1.5 border-l border-slate-100 ml-6 animate-in slide-in-from-top-1 duration-200">
                                {ecomItems.map((item) => {
                                    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                                    return (
                                        <button
                                            key={item.path}
                                            onClick={() => navigate(item.path)}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group ${
                                                isActive
                                                    ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-sm shadow-orange-500/10 scale-[1.02] font-semibold"
                                                    : "text-slate-600 hover:bg-orange-50/40 hover:text-slate-900"
                                            }`}
                                        >
                                            <item.icon className={`h-4.5 w-4.5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-white" : "text-orange-400 group-hover:text-orange-600"}`} />
                                            <span className="text-xs font-semibold tracking-tight">{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </nav>


                {/* Sidebar User profile footer */}
                <div className="p-4 border-t border-slate-100/80 bg-slate-50/50">
                    <div className="flex items-center gap-3 px-2 py-3 rounded-xl mb-3">
                        <div className="h-9 w-9 rounded-full bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-sm uppercase">
                            {adminEmail[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate leading-none mb-1">Administrative Role</p>
                            <p className="text-[10px] font-medium text-slate-400 truncate leading-none">{adminEmail}</p>
                        </div>
                    </div>
                    
                    <Button
                        variant="ghost"
                        className="w-full justify-start rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold h-11 border border-transparent hover:border-rose-100/50 transition-all duration-300"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-2 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                
                {/* Dashboard Top Header Navigation Bar */}
                <header className="h-20 bg-white/50 backdrop-blur-md border-b border-slate-200/60 px-4 md:px-8 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        {/* Hamburger Menu Icon for Mobile screens */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-all mr-1 shrink-0"
                            title="Open Navigation"
                        >
                            <Menu className="h-5 w-5 text-slate-600" />
                        </button>

                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest hidden sm:inline">Admin Control</span>
                        <ChevronRight className="h-3 w-3 text-slate-300 hidden sm:inline" />
                        <span className="text-sm font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/50">
                            {currentActiveItem?.label || "Overview"}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Live Alert System */}
                        {pendingComplaints > 0 && (
                            <div className="hidden md:flex items-center gap-2 bg-amber-50 border border-amber-200/60 text-amber-800 px-3 py-1.5 rounded-xl animate-pulse text-xs font-bold">
                                <span className="h-2 w-2 rounded-full bg-amber-500" />
                                {pendingComplaints} live support requests pending attention
                            </div>
                        )}
                        <div className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200/50 flex items-center justify-center text-slate-600 hover:bg-slate-200/50 cursor-pointer transition-colors relative">
                            <Bell className="h-4.5 w-4.5" />
                            {pendingComplaints > 0 && (
                                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
                            )}
                        </div>
                    </div>
                </header>

                {/* Dashboard Screen Viewport */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
            <Toaster position="top-right" closeButton richColors />
        </div>
    );
};

export default AdminLayout;
