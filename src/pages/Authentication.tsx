import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { motion } from "motion/react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Logo } from "@/components/shared/Logo";

const Auth = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  
  const hostname = window.location.hostname;
  const isDomainAdmin = hostname === 'admin.crypxpro.com' || hostname.startsWith('admin.');
  
  let envMode = 'ALL';
  try { 
    envMode = import.meta.env.VITE_APP_MODE; 
  } catch(e) {
    // ignore
  }
  
  const appMode = isDomainAdmin ? "ADMIN" : (envMode || "ALL").toUpperCase();

  useEffect(() => {
    if (session) {
      const pendingRedirect = sessionStorage.getItem('auth_redirect');
      if (pendingRedirect) {
        sessionStorage.removeItem('auth_redirect');
        navigate(pendingRedirect, { replace: true });
        return;
      }
      
      const hash = window.location.hash || "";
      const search = window.location.search || "";
      const isRecovery = hash.includes("type=recovery") || hash.includes("access_token=") || search.includes("type=recovery");
      if (isRecovery) {
        sessionStorage.setItem("open_password_reset", "true");
      }

      if (appMode === "ADMIN" || session.user?.email === "admin@crypx.pro") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        if (isRecovery) {
          navigate("/app/home#action=reset_password", { replace: true });
        } else {
          navigate("/app/home", { replace: true });
        }
      }
    }
  }, [session, navigate, appMode]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-y-auto py-12 sm:py-16 px-4 text-foreground">
      {/* Immersive Crypto Background */}
      <div 
        className="fixed inset-0 z-0 opacity-5 grayscale pointer-events-none"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1644024276273-4b901946849a?auto=format&fit=crop&q=80&w=2000")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div 
          className="absolute inset-0 opacity-20 blur-[100px] dark:opacity-10"
          style={{
            background: `
              radial-gradient(circle at 15% 20%, var(--primary) 0%, transparent 40%),
              radial-gradient(circle at 85% 80%, var(--accent) 0%, transparent 40%),
              radial-gradient(circle at 50% 50%, var(--muted) 0%, transparent 60%)
            `
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-lg px-2 sm:px-6 flex flex-col items-center my-auto">
        {/* Logo and Tagline */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <Logo size={80} variant="SYMBOL" className="mb-4 mx-auto drop-shadow-[0_0_20px_rgba(255,191,0,0.2)] transition-transform hover:scale-105 duration-500" />
          <h2 className="text-foreground text-2xl font-light tracking-[0.4em] uppercase">CrypX Pro</h2>
        </motion.div>

        {/* Ultra-Transparent Glassmorphic Modal Card */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
           className="w-full relative p-6 sm:p-10 md:p-14 rounded-[32px] sm:rounded-[48px] border border-border bg-card/40 backdrop-blur-[40px] shadow-[0_32px_128px_-32px_rgba(0,0,0,0.08)]"
        >
          {/* Subtle Inner Glow */}
          <div className="absolute inset-0 rounded-[32px] sm:rounded-[48px] bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none dark:from-white/5" />
          
          <AuthForm isInsideModal={true} />
        </motion.div>

        {/* Action button helper for desktop landing return */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          whileHover={{ opacity: 0.9, y: -2 }}
          onClick={() => navigate('/')}
          className="mt-8 text-[10px] text-muted-foreground uppercase tracking-[0.3em] transition-all font-medium hover:text-foreground"
        >
          ← Return to Platform Overview
        </motion.button>
      </div>
    </div>
  );
};

export default Auth;

