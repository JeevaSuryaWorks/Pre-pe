import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { LogOut, LayoutDashboard, Shield, Users, History, Percent, Menu, Banknote, Megaphone, Terminal, CreditCard, Settings, Gift, Globe, Home, Heart, Store, ChevronDown, ChevronUp, Package, ShoppingCart, Building, Cpu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut } = useAuth();
    const [open, setOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const shopItems = [
        { path: '/admin/sellers', icon: Building, label: 'Sellers' },
        { path: '/admin/products', icon: Package, label: 'Products' },
        { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
        { path: '/admin/buyers', icon: Users, label: 'Buyers' },
    ];

    const isShopActive = [
        '/admin/sellers',
        '/admin/products',
        '/admin/orders',
        '/admin/buyers'
    ].includes(location.pathname);

    const [isShopExpanded, setIsShopExpanded] = useState(() => {
        return location.pathname.startsWith('/admin/sellers') ||
               location.pathname.startsWith('/admin/products') ||
               location.pathname.startsWith('/admin/orders') ||
               location.pathname.startsWith('/admin/buyers');
    });

    const handleShopClick = () => {
        if (isCollapsed) {
            setIsCollapsed(false);
            setIsShopExpanded(true);
        } else {
            setIsShopExpanded(!isShopExpanded);
        }
    };

    const menuItems: any[] = [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/kyc', icon: Shield, label: 'KYC Requests' },
        { path: '/admin/fund-requests', icon: Banknote, label: 'Fund Requests' },
        { path: '/admin/banners', icon: Megaphone, label: 'Banner Manager' },
        { path: '/admin/gift-vouchers', icon: Gift, label: 'Gift Vouchers' },
        { isShopDropdown: true },
        { path: '/admin/users', icon: Users, label: 'User Management' },
        { path: '/admin/paid-users', icon: CreditCard, label: 'Paid Users' },
        { path: '/admin/plan-manager', icon: Settings, label: 'Plan Manager' },
        { path: '/admin/rewards', icon: Gift, label: 'Rewards Manager' },
        { path: '/admin/tasks', icon: Shield, label: 'Task Manager' },
        { path: '/admin/transactions', icon: History, label: 'Transactions' },
        { path: '/admin/commissions', icon: Percent, label: 'Commissions' },
        { path: '/admin/logs', icon: Terminal, label: 'System Logs' },
        { path: '/admin/network', icon: Globe, label: 'Network Diagnostics' },
        { path: '/admin/api-panel', icon: Cpu, label: 'API Panel' },
        { path: '/admin/feedbacks', icon: Heart, label: 'User Feedbacks' },
    ];

    const ShopHeaderItem = () => {
        const Icon = Store;
        const isActive = isShopActive;
        const ChevronIcon = isShopExpanded ? ChevronUp : ChevronDown;

        return (
            <div className="w-full">
                <button
                    onClick={handleShopClick}
                    title={isCollapsed ? "Shop Manager" : undefined}
                    className={`w-full flex items-center justify-between ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                        ? 'bg-blue-600/10 text-blue-700 shadow-sm border border-blue-100/50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                >
                    <div className="flex items-center gap-3 truncate">
                        <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                        {!isCollapsed && <span className="truncate">Shop Manager</span>}
                    </div>
                    {!isCollapsed && <ChevronIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                </button>

                {/* Nested Sub-routes with smooth height & transitions */}
                {!isCollapsed && isShopExpanded && (
                    <div className="pl-4 mt-1.5 space-y-1.5 border-l border-slate-100 ml-6 animate-in slide-in-from-top-2 duration-200">
                        {shopItems.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const isSubActive = location.pathname === subItem.path;
                            return (
                                <button
                                    key={subItem.path}
                                    onClick={() => {
                                        navigate(subItem.path);
                                        setOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${isSubActive
                                        ? 'bg-blue-600/10 text-blue-700 font-bold border-l-2 border-blue-600 pl-2'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                        }`}
                                >
                                    <SubIcon className={`w-4 h-4 shrink-0 ${isSubActive ? 'text-blue-600' : 'text-slate-400'}`} />
                                    <span className="truncate">{subItem.label}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    const NavLinks = () => (
        <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-4'} py-6 space-y-2 transition-all duration-300`}>
            {menuItems.map((item, index) => {
                if ('isShopDropdown' in item) {
                    return <ShopHeaderItem key="shop-dropdown" />;
                }

                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                    <button
                        key={item.path}
                        onClick={() => {
                            navigate(item.path);
                            setOpen(false);
                        }}
                        title={isCollapsed ? item.label : undefined}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                            ? 'bg-blue-600/10 text-blue-700 shadow-sm border border-blue-100/50'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                    >
                        <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </button>
                );
            })}
        </nav>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                    <img src="/icon_new.png" alt="Admin" className="w-8 h-8 rounded-lg bg-white object-contain shadow-sm p-0.5" />
                    <h1 className="font-bold text-lg text-slate-800 tracking-tight">PrePe Admin</h1>
                </div>
                <div className="flex items-center gap-1">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => navigate('/home')} 
                        className="text-slate-600 hover:text-slate-950 hover:bg-slate-50 w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        title="Return User Home"
                    >
                        <Home className="h-5 w-5 text-slate-600" />
                    </Button>
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-600">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                    <SheetContent side="left" className="w-72 p-0 bg-white/95 backdrop-blur-xl border-r-slate-200">
                        <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
                        <div className="h-full flex flex-col">
                            <div className="p-6 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <img src="/icon_new.png" alt="Admin" className="w-8 h-8 rounded-lg bg-slate-100 object-contain p-0.5 shadow-sm" />
                                    <span className="font-bold text-lg text-slate-900 tracking-tight">PrePe Admin</span>
                                </div>
                            </div>
                            <NavLinks />
                            <div className="p-6 border-t border-slate-100">
                                <button
                                    onClick={() => {
                                        navigate('/home');
                                        setOpen(false);
                                    }}
                                    className="w-full mb-3 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                                >
                                    <Home className="w-5 h-5 text-blue-600" />
                                    User Home Page
                                </button>
                                <button
                                    onClick={() => signOut()}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </header>

            {/* Desktop Sidebar */}
            <aside className={`hidden md:flex flex-col ${isCollapsed ? 'w-20' : 'w-72'} h-screen sticky top-0 bg-white/60 backdrop-blur-xl border-r border-slate-200/60 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-40 transition-all duration-300 ease-in-out`}>
                <div className={`p-6 border-b border-slate-200/50 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    <div className="flex items-center gap-3 truncate">
                        <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 flex-shrink-0">
                            <img src="/icon_new.png" alt="Admin" className="w-8 h-8 object-contain" />
                        </div>
                        {!isCollapsed && <h1 className="font-bold text-xl text-slate-900 tracking-tight truncate">PrePe Admin</h1>}
                    </div>
                    
                    <button 
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`hidden lg:flex p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors ${isCollapsed ? 'mt-4' : ''}`}
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <NavLinks />
                </div>

                <div className={`${isCollapsed ? 'p-4' : 'p-6'} border-t border-slate-200/50 bg-white/40 transition-all duration-300`}>
                    <button
                        onClick={() => navigate('/home')}
                        className={`w-full mb-2.5 flex items-center ${isCollapsed ? 'justify-center' : 'justify-center gap-2'} px-4 py-3 rounded-xl text-sm font-medium text-blue-700 bg-blue-50 border border-blue-100 shadow-xs hover:bg-blue-100/80 transition-all duration-200`}
                        title={isCollapsed ? 'User Home Page' : undefined}
                    >
                        <Home className="w-4 h-4 flex-shrink-0 text-blue-600" />
                        {!isCollapsed && <span>User Home Page</span>}
                    </button>
                    <button
                        onClick={() => signOut()}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-center gap-2'} px-4 py-3 rounded-xl text-sm font-medium text-slate-700 bg-white border border-slate-200 shadow-sm hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all duration-200`}
                        title={isCollapsed ? 'Sign Out' : undefined}
                    >
                        <LogOut className="w-4 h-4 flex-shrink-0" />
                        {!isCollapsed && <span>Sign Out</span>}
                    </button>
                    {!isCollapsed && (
                        <div className="mt-4 text-center text-xs text-slate-400 font-medium tracking-wide animate-in fade-in duration-500">
                            v1.0.0 • PRE-PE INDIA
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
                <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};
