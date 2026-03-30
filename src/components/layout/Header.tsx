import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Smartphone,
  Menu,
  ArrowLeft,
  User
} from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { user, signOut } = useAuth();
  const { availableBalance, loading: walletLoading } = useWallet();
  const location = useLocation();
  const navigate = useNavigate(); // Added hook
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if we are on the home page
  const isHomePage = location.pathname === '/home';

  const navItems: { path: string; label: string; icon: any }[] = [];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100/50 bg-white">
      <div className="container flex h-16 items-center justify-between px-4">

        {/* Left Side: Back Button or Placeholder */}
        <div className="flex w-10 justify-start">
          {!isHomePage ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </Button>
          ) : (
            <div className="w-9" /> // Empty placeholder to balance spacing
          )}
        </div>

        {/* Center: Logo & Name */}
        <Link to="/home" className="flex items-center gap-2">
          <img src="/logo.png" alt="Prepe" className="h-8 w-8 rounded-lg object-contain bg-white" />
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Prepe
          </h1>
        </Link>

        {/* Right Side: Profile Link (No Hamburger) */}
        <div className="flex w-10 justify-end">
          <Link to="/profile">
            <div className="h-9 w-9 flex items-center justify-center bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
              <Avatar className="h-9 w-9 bg-transparent">
                <AvatarImage src={user?.user_metadata?.avatar_url} className="rounded-full object-cover" />
                <AvatarFallback className="bg-transparent text-green-700">
                  {/* User explicitly asked to remove hamburger. Using User icon as profile link. */}
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
