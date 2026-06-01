import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

import ContactPage from "./pages/ContactPage";
import ProfilePage from "./pages/ProfilePage";
import ServicePlaceholder from "./pages/ServicePlaceholder";
import MobileRecharge from "./pages/MobileRecharge";
import Postpaid from "./pages/Postpaid";
import Wallet from "./pages/Wallet";
import Transactions from "./pages/Transactions";
import { ReceiptPage } from "./pages/ReceiptPage";
import { SelectProviderPage } from "./pages/SelectProviderPage";
import { RedeemCodePage } from "./pages/RedeemCodePage";
import { DTHSelectProvider } from "./pages/dth/DTHSelectProvider";
import { DTHEnterDetails } from "./pages/dth/DTHEnterDetails";
import { ElectricityEnterDetails } from "./pages/bills/ElectricityEnterDetails";

import NotFound from "./pages/NotFound";
import { AdminLayout } from "@/layouts/AdminLayout";
import { AdminGuard } from "@/components/auth/AdminGuard";
// AdminLogin removed as it's no longer needed
import { KYCRequests } from "./pages/admin/KYCRequests";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLogs from "./pages/admin/AdminLogs";
import UserManagement from "./pages/admin/UserManagement";
import CommissionManager from "./pages/admin/CommissionManager";
import TransactionsAdmin from "./pages/admin/TransactionsAdmin";
import AdminFundRequests from "./pages/admin/AdminFundRequests";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminBannerEditor from "./pages/admin/AdminBannerEditor";
import PaidUsers from "./pages/admin/PaidUsers";
import PlanManager from "./pages/admin/PlanManager";
import RewardsManager from "./pages/admin/RewardsManager";
import AdminTasks from "./pages/admin/AdminTasks";
import AdminComplaints from "./pages/admin/AdminComplaints";
import { FundRequestPage } from "./pages/FundRequestPage";
import DTHRechargePage from "./pages/DTHRecharge";
import DNPLPage from "./pages/DNPLPage";
import NetworkDiagnostics from "./pages/admin/NetworkDiagnostics";
import GiftVoucherManager from "./pages/admin/GiftVoucherManager";
import GiftCardsPage from "./pages/GiftCardsPage";
import AdminFeedbacks from "./pages/admin/AdminFeedbacks";


import TransactionDetailsPage from "./pages/TransactionDetailsPage";
import LedgerPage from "./pages/LedgerPage";
import HistoryPage from "./pages/reports/HistoryPage";
import ProfileSettings from "./pages/settings/ProfileSettings";
import ThemeSettings from "./pages/settings/ThemeSettings";
import SecuritySettings from "./pages/settings/SecuritySettings";
import KYCUpgrade from "./pages/settings/KYCUpgrade";
import KYCPage from "./pages/KYCPage";
import ReferEarn from "./pages/settings/ReferEarn";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import UpdatePasswordPage from "./pages/auth/UpdatePasswordPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import MagicLinkPage from "./pages/auth/MagicLinkPage";
import CompleteProfilePage from "./pages/auth/CompleteProfilePage";
import CashbackOffers from "./pages/settings/CashbackOffers";
import LegalPage from "./pages/settings/LegalPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SellerGuard } from "@/components/auth/SellerGuard";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { AuthProvider } from "./contexts/AuthContext";
import { ProfileProvider } from "./contexts/ProfileContext";

import PlanSelectionPage from "./pages/onboarding/PlanSelectionPage";
import TermsAcceptancePage from "./pages/auth/TermsAcceptancePage";
import RewardsDashboard from "./pages/rewards/RewardsDashboard";
import RewardHistoryPage from "./pages/rewards/RewardHistoryPage";
import AdsPage from "./pages/rewards/AdsPage";
import ServicesPage from "./pages/ServicesPage";
import SavedPage from "@/pages/SavedPage";
import BulkRechargePage from "@/pages/business/BulkRechargePage";
import UpgradePlans from "./pages/UpgradePlans";
import NotificationsPage from "./pages/NotificationsPage";
import AIChat from "./pages/AIChat";
import SafetyPage from "./pages/SafetyPage";

// Accessories E-Commerce Page Imports
import ShopListingPage from "./pages/shop/ShopListingPage";
import ProductDetailsPage from "./pages/shop/ProductDetailsPage";
import CartPage from "./pages/shop/CartPage";
import CheckoutPage from "./pages/shop/CheckoutPage";
import OrderHistoryPage from "./pages/shop/OrderHistoryPage";
import SellerOnboardingPage from "./pages/shop/SellerOnboardingPage";
import SellerDashboardPage from "./pages/shop/SellerDashboardPage";
import SellerInventoryPage from "./pages/shop/SellerInventoryPage";
import AdminSellers from "./pages/admin/AdminSellers";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminBuyers from "./pages/admin/AdminBuyers";

import { useMobileFeatures } from "./hooks/useMobileFeatures";
import { usePushNotifications } from "./hooks/usePushNotifications";
import { useAppUpdate } from "./hooks/useAppUpdate";
import { UpdateDialog } from "./components/mobile/UpdateDialog";

const queryClient = new QueryClient();

const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  useMobileFeatures();
  usePushNotifications();
  const { updateAvailable, remoteVersion } = useAppUpdate();

  return (
    <div className="app-native-container min-h-screen flex flex-col">
      {children}
      <UpdateDialog isOpen={updateAvailable} version={remoteVersion} />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ProfileProvider>
        <AppInitializer>
          <TooltipProvider>
        <Toaster />
        <Sonner />
        <Analytics />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/update-password" element={<UpdatePasswordPage />} />
            <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
            <Route path="/auth/magic-link" element={<MagicLinkPage />} />
            <Route path="/auth/complete-profile" element={<CompleteProfilePage />} />
            <Route path="/terms-acceptance" element={<TermsAcceptancePage />} />
            <Route path="/kyc" element={<KYCPage />} />
            <Route path="/legal/terms" element={<LegalPage title="Terms & Conditions" type="terms" />} />
            <Route path="/legal/privacy" element={<LegalPage title="Privacy Policy" type="privacy" />} />
            <Route path="/legal/refund" element={<LegalPage title="Refund Policy" type="refund" />} />

            {/* Protected Routes - Require Login & KYC */}
            <Route element={<ProtectedRoute />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/onboarding/plans" element={<PlanSelectionPage />} />

              <Route path="/contact" element={<ContactPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/edit" element={<ProfileSettings />} />
              <Route path="/profile/theme" element={<ThemeSettings />} />
              <Route path="/profile/security" element={<SecuritySettings />} />
              <Route path="/profile/kyc" element={<KYCUpgrade />} />
              <Route path="/profile/refer" element={<ReferEarn />} />
              <Route path="/profile/offers" element={<CashbackOffers />} />

              <Route path="/mobile-recharge" element={<MobileRecharge />} />

              <Route path="/rewards" element={<RewardsDashboard />} />
              <Route path="/rewards/ads" element={<AdsPage />} />
              <Route path="/rewards/history" element={<RewardHistoryPage />} />
              <Route path="/offers" element={<CashbackOffers />} />

              <Route path="/dth-recharge" element={<DTHSelectProvider />} />
              <Route path="/dth-recharge/enter-details" element={<DTHEnterDetails />} />
              <Route path="/services/electricity" element={<SelectProviderPage type="electricity" title="Select Provider" />} />
              <Route path="/services/electricity/details" element={<ElectricityEnterDetails />} />
              <Route path="/services/redeem-code" element={<RedeemCodePage />} />
              <Route path="/services/gift-cards" element={<GiftCardsPage />} />


              <Route path="/services" element={<ServicesPage />} />
              <Route path="/services/postpaid" element={<Postpaid />} />
              <Route path="/services/:serviceName" element={<ServicePlaceholder />} />

              <Route path="/wallet" element={<Wallet />} />
              <Route path="/dnpl" element={<DNPLPage />} />
              <Route path="/fund-request" element={<FundRequestPage />} />
              <Route path="/wallet/ledger" element={<LedgerPage />} />
              <Route path="/reports/history" element={<HistoryPage />} />
              <Route path="/saved" element={<SavedPage />} />
              <Route path="/upgrade" element={<UpgradePlans />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/recharge/receipt" element={<ReceiptPage />} />
              <Route path="/transaction/:id" element={<TransactionDetailsPage />} />
              <Route path="/business/bulk-recharge" element={<BulkRechargePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/ai-chat" element={<AIChat />} />
              <Route path="/safety" element={<SafetyPage />} />

              {/* Accessories E-Commerce Routes */}
              <Route path="/shop" element={<ShopListingPage />} />
              <Route path="/product/:id" element={<ProductDetailsPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/orders" element={<OrderHistoryPage />} />
              
              {/* Seller Protected Routes */}
              <Route element={<SellerGuard />}>
                <Route path="/seller/onboarding" element={<SellerOnboardingPage />} />
                <Route path="/seller/dashboard" element={<SellerDashboardPage />} />
                <Route path="/seller/inventory" element={<SellerInventoryPage />} />
              </Route>
            </Route>


            {/* Admin Auth - Redirect to usual Login */}
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />

            {/* Protected Admin Routes */}
            <Route element={<AdminGuard />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="kyc" element={<KYCRequests />} />
                <Route path="complaints" element={<AdminComplaints />} />
                <Route path="logs" element={<AdminLogs />} />

                {/* Accessories E-Commerce Admin Moderation */}
                <Route path="sellers" element={<AdminSellers />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="buyers" element={<AdminBuyers />} />

                {/* Placeholders for future */}
                <Route path="users" element={<UserManagement />} />
                <Route path="transactions" element={<TransactionsAdmin />} />
                <Route path="commissions" element={<CommissionManager />} />
                <Route path="fund-requests" element={<AdminFundRequests />} />
                <Route path="paid-users" element={<PaidUsers />} />
                <Route path="plan-manager" element={<PlanManager />} />
                <Route path="rewards" element={<RewardsManager />} />
                <Route path="tasks" element={<AdminTasks />} />
                <Route path="banners" element={<AdminBanners />} />
                <Route path="banners/new" element={<AdminBannerEditor />} />
                <Route path="banners/:id" element={<AdminBannerEditor />} />
                <Route path="gift-vouchers" element={<GiftVoucherManager />} />
                <Route path="network" element={<NetworkDiagnostics />} />
                <Route path="feedbacks" element={<AdminFeedbacks />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </AppInitializer>
      </ProfileProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
