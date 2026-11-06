import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/Toaster.tsx";
import { Toaster as Sonner } from "@/components/ui/Sonner.tsx";
import { TooltipProvider } from "@/components/ui/Tooltip.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RouteSEO } from "@/components/shared/SEO.tsx";
import Landing from "@/pages/Landing.tsx";
import Authentication from "@/pages/Authentication.tsx";
import PageNotFound from "@/pages/PageNotFound.tsx";

// Layouts
import MainLayout from "@/components/layouts/MainLayout.tsx";
import AdminLayout from "@/components/layouts/AdminLayout.tsx";

// User App Pages (Lazy Loaded for Seamless Skeleton Feedback)
const UserHome = lazy(() => import("@/pages/app/UserHome.tsx"));
const Spot = lazy(() => import("@/pages/app/Spot.tsx"));
const Futures = lazy(() => import("@/pages/app/Futures.tsx"));
const Earn = lazy(() => import("@/pages/app/Earn.tsx"));
const Assets = lazy(() => import("@/pages/app/Assets.tsx"));
const Market = lazy(() => import("@/pages/app/Market.tsx"));
const TradeFi = lazy(() => import("@/pages/app/TradeFi.tsx"));
const Settings = lazy(() => import("@/pages/app/Settings.tsx"));

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard.tsx";
import AdminUsers from "@/pages/admin/Users.tsx";
import AdminKYC from "@/pages/admin/KYC.tsx";
import FuturesControl from "@/pages/admin/FuturesControl.tsx";
import AdminWallets from "@/pages/admin/Wallets.tsx";
import AdminSupport from "@/pages/admin/Support.tsx";
import AdminWithdrawals from "@/pages/admin/Withdrawals.tsx";
import FinancialStatus from "@/pages/admin/FinancialStatus.tsx";
import CustomerService from "@/pages/admin/CustomerService.tsx";
import DepositRequests from "@/pages/admin/DepositRequests.tsx";
import AdminOwnership from "@/pages/admin/Ownership.tsx";
import AdminAdministrator from "@/pages/admin/Administrator.tsx";
import AdminSampleTokens from "@/pages/admin/SampleTokens.tsx";
import AdminDatabaseExport from "@/pages/admin/DatabaseExport.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RouteSEO />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Authentication />} />
            <Route path="/terms" element={<Suspense fallback={<div className="min-h-screen bg-background" />}><Settings initialTab="terms" /></Suspense>} />
            <Route path="/policies" element={<Suspense fallback={<div className="min-h-screen bg-background" />}><Settings initialTab="policies" /></Suspense>} />
            <Route path="/faq" element={<Suspense fallback={<div className="min-h-screen bg-background" />}><Settings initialTab="faq" /></Suspense>} />
            <Route path="/settings" element={<Suspense fallback={<div className="min-h-screen bg-background" />}><Settings initialTab="overview" /></Suspense>} />

            {/* User App Routes */}
            <Route path="/app" element={<MainLayout />}>
              <Route index element={<Navigate to="/app/home" replace />} />
              <Route path="home" element={<UserHome />} />
              <Route path="market" element={<Market />} />
              <Route path="trade-fi" element={<TradeFi />} />
              <Route path="spot" element={<Spot />} />
              <Route path="futures" element={<Futures />} />
              <Route path="earn" element={<Earn />} />
              <Route path="assets" element={<Assets />} />
              <Route path="settings" element={<Suspense fallback={<div className="min-h-screen bg-background" />}><Settings initialTab="overview" /></Suspense>} />
              <Route path="terms" element={<Suspense fallback={<div className="min-h-screen bg-background" />}><Settings initialTab="terms" /></Suspense>} />
              <Route path="policies" element={<Suspense fallback={<div className="min-h-screen bg-background" />}><Settings initialTab="policies" /></Suspense>} />
              <Route path="faq" element={<Suspense fallback={<div className="min-h-screen bg-background" />}><Settings initialTab="faq" /></Suspense>} />
              <Route path="admin" element={<Navigate to="/admin" replace />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="financial-status" element={<FinancialStatus />} />
              <Route path="kyc" element={<AdminKYC />} />
              <Route path="futures" element={<FuturesControl />} />
              <Route path="spot-control" element={<AdminSampleTokens />} />
              <Route path="sample-tokens" element={<AdminSampleTokens />} />
              <Route path="wallets" element={<AdminWallets />} />
              <Route path="support" element={<AdminSupport />} />
              <Route path="customer-service" element={<CustomerService />} />
              <Route path="withdrawals" element={<AdminWithdrawals />} />
              <Route path="deposit-requests" element={<DepositRequests />} />
              <Route path="administrator" element={<AdminAdministrator />} />
              <Route path="ownership" element={<AdminOwnership />} />
              <Route path="database-export" element={<AdminDatabaseExport />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
