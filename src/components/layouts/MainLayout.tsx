import { useState, Suspense } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Home, BarChart2, Zap, Gem, Wallet } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { SupportChatModal } from "@/components/shared/SupportChatModal";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { PageLoadingOverlay } from "@/components/shared/PageLoadingOverlay";
import { PWAInstallButton } from "@/components/shared/PWAInstallButton";
import { useAuth } from "@/hooks/useAuth";

const MainLayout = () => {
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const { user } = useAuth();

  const navItems = [
    { icon: Home, label: "Home", path: "/app/home" },
    { icon: BarChart2, label: "Market", path: "/app/market" },
    { icon: Zap, label: "Trade", path: "/app/trade-fi" },
    { icon: Gem, label: "Earn", path: "/app/earn" },
    { icon: Wallet, label: "Assets", path: "/app/assets" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row relative">
      {/* Global Route Loading Progress Bar & Overlay */}
      <PageLoadingOverlay />

      {/* Desktop Sidebar (visible on md+) */}
      <nav className="hidden md:flex flex-col w-64 lg:w-72 border-r border-border bg-card/50 backdrop-blur-xl shrink-0 h-screen sticky top-0 py-8 px-4 z-40">
        <div className="px-4 mb-10">
          <Logo size={52} variant="FULL" />
        </div>
        
        <div className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-brand-sm"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`
              }
            >
              <item.icon size={20} />
              <span className="text-sm font-bold tracking-wide">
                {item.label}
              </span>
            </NavLink>
          ))}
        </div>

        <div className="pt-6 border-t border-border mt-auto space-y-3">
           <PWAInstallButton className="w-full justify-center" />
           <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
              <p className="text-[10px] uppercase font-black text-primary tracking-widest mb-1">Status</p>
              <p className="text-xs font-bold text-foreground">Operational</p>
           </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 pb-16 md:pb-0 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full">
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-border/60 px-4 py-2 z-50 shadow-lg pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-around max-w-lg mx-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center min-w-[56px] py-1 transition-all duration-200 active:scale-90 ${
                    isActive
                      ? "text-primary font-bold"
                      : "text-muted-foreground hover:text-foreground font-medium"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-primary/15 text-primary scale-105' : 'bg-transparent'}`}>
                      <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className={`text-[10px] tracking-tight transition-all duration-200 ${isActive ? 'opacity-100 font-bold' : 'opacity-80'}`}>
                      {item.label}
                    </span>
                    {isActive && (
                      <div className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-primary shadow-sm shadow-primary/50" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>

      <SupportChatModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </div>
  );
};

export default MainLayout;
