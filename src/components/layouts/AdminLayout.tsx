import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Users, ShieldCheck, Activity, Wallet, 
  LifeBuoy, ArrowUpCircle, LogOut, TrendingUp, Database
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/shared/Logo";
import { useEffect, useState } from "react";
import CubeSpinner from "@/components/shared/CubeSpinner";
import { hasPermissionToView, isUserAdmin, syncAdminPermissions } from "@/lib/adminPermissions";
import { toast } from "sonner";

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/financial-status', label: 'Financial Status', icon: Wallet },
  { path: '/admin/deposit-requests', label: 'Deposits', icon: Activity },
  { path: '/admin/withdrawals', label: 'Withdrawals', icon: ArrowUpCircle },
  { path: '/admin/futures', label: 'Futures Control', icon: Activity },
  { path: '/admin/spot-control', label: 'Spot Control', icon: TrendingUp },
  { path: '/admin/kyc', label: 'KYC', icon: ShieldCheck },
  { path: '/admin/wallets', label: 'Wallets', icon: Wallet },
  { path: '/admin/customer-service', label: 'Support Chat', icon: LifeBuoy },
  { path: '/admin/support', label: 'Contact Details', icon: LifeBuoy },
  { path: '/admin/administrator', label: 'Administrator', icon: ShieldCheck },
  { path: '/admin/ownership', label: 'Ownership', icon: ShieldCheck },
  { path: '/admin/database-export', label: 'Database Export', icon: Database },
];

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user, loading } = useAuth();
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    let mounted = true;
    const safetyTimer = setTimeout(() => {
      if (mounted) setIsSyncing(false);
    }, 2500);

    const sync = async () => {
      if (!loading && user) {
        try {
          await syncAdminPermissions(user.email);
        } catch (e) {
          console.error("Failed to sync permissions:", e);
        } finally {
          if (mounted) setIsSyncing(false);
        }
      } else if (!loading && !user) {
        if (mounted) setIsSyncing(false);
      }
    };
    sync();

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
    };
  }, [user, loading]);

  useEffect(() => {
    if (!loading && !isSyncing) {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
      const isAdminDomain = 
        hostname === 'admin.crypxpro.com' || 
        hostname.startsWith('admin.') || 
        hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.endsWith('.run.app');

      if (!isAdminDomain) {
        toast.error("Access Restricted: Admin Portal is accessible only from admin.crypxpro.com");
        navigate('/app/home', { replace: true });
      } else if (!user) {
        sessionStorage.setItem('auth_redirect', location.pathname);
        navigate('/auth', { replace: true });
      } else if (!isUserAdmin(user.email)) {
        toast.error("Unauthorized: You do not have administrator permissions.");
        navigate('/app/home', { replace: true });
      } else if (!hasPermissionToView(user.email, location.pathname)) {
        toast.error("Access Denied: You do not have permission to view this page.");
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [user, loading, isSyncing, navigate, location.pathname]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error("Logout failed", error);
      // Fallback redirect
      window.location.href = '/auth';
    }
  };

  if (loading || isSyncing) return <CubeSpinner fullScreen label="Verifying admin credentials..." />;
  if (!user || !isUserAdmin(user.email)) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-card border-r border-border flex flex-col sticky top-0 h-screen shadow-xl z-40">
        <div className="p-8 border-b border-border">
          <Logo size={48} variant="FULL" className="scale-110" />
          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 rounded-full border border-primary/20">
            <ShieldCheck size={10} className="text-primary" />
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Admin Control</span>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 px-4 opacity-50">Main Menu</p>
          {navItems
            .filter((item) => hasPermissionToView(user?.email, item.path))
            .map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'text-primary-foreground' : 'text-primary opacity-50 group-hover:opacity-100'} />
                  {item.label}
                </Link>
              );
            })}
        </nav>

        <div className="p-6 border-t border-border mt-auto bg-muted/30">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl text-sm font-black text-destructive bg-destructive/5 hover:bg-destructive/10 transition-all border border-destructive/10 uppercase tracking-wider"
          >
            <LogOut size={18} />
            Secure Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-muted/10">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
