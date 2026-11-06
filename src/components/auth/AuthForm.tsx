import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Mail, Lock, User, Loader2, FileText, X, Shield, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/shared/Logo";
import { isUserAdmin, syncAdminPermissions, getCustomAccounts, isPrimaryOwner, syncCustomAccountsWithSupabase, normalizeAdminId } from "@/lib/adminPermissions";

interface AuthFormProps {
  onSuccess?: () => void;
  isInsideModal?: boolean;
}

export const AuthForm = ({ onSuccess, isInsideModal = false }: AuthFormProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isUpdatePassword, setIsUpdatePassword] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
    if (appMode === "ADMIN") {
      setIsLogin(true);
      setIsForgotPassword(false);
    }
  }, [appMode]);

  useEffect(() => {
    // Check if coming from a recovery link in the URL hash/query
    const hash = window.location.hash || "";
    const search = window.location.search || "";
    if (hash.includes("type=recovery") || hash.includes("access_token=") || search.includes("type=recovery")) {
      setIsUpdatePassword(true);
    }

    const searchParams = new URLSearchParams(search);
    const urlRef = searchParams.get("ref");
    if (urlRef) {
      setIsLogin(false);
      setReferralCode(urlRef);
      localStorage.setItem('crypx_pending_ref_v1', urlRef);
    } else {
      const storedRef = localStorage.getItem('crypx_pending_ref_v1');
      if (storedRef) {
        setReferralCode(storedRef);
      }
    }

    // Subscribe to password recovery session events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsUpdatePassword(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isForgotPassword && !isUpdatePassword && !agreedTerms) {
      toast({
        title: "Terms Agreement Required",
        description: "Please agree to the Terms & Conditions to proceed.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isUpdatePassword) {
        if (newPassword !== confirmNewPassword) {
          throw new Error("New passwords do not match.");
        }
        
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        
        toast({ title: "Success!", description: "Your password has been reset successfully." });
        setIsUpdatePassword(false);
        setIsLogin(true);
        setNewPassword("");
        setConfirmNewPassword("");
      } else if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast({ title: "Email sent!", description: "Check your inbox for a password reset link." });
        setIsForgotPassword(false);
      } else if (isLogin) {
        const normEmail = email.toLowerCase().trim();

        // Proactively sync latest custom accounts from Supabase to support login on any device
        try {
          await syncCustomAccountsWithSupabase();
        } catch (syncErr) {
          console.warn("Could not sync custom accounts before login check:", syncErr);
        }

        // Check custom Admin & Staff accounts or primary owner password fallback
        const customAccounts = getCustomAccounts();
        const matchedCustom = customAccounts.find(
          a => a.email.toLowerCase().trim() === normEmail && a.password === password
        );

        const isPrimary = isPrimaryOwner(normEmail);
        const isPrimaryMatched = isPrimary && password === "AungMoe$357";

        // Try authenticating with real Supabase Auth first
        let realAuthSuccess = false;
        let authErrorMsg = null;
        try {
          const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
            email: normEmail,
            password: password
          });
          
          if (!authErr && authData.session) {
            realAuthSuccess = true;
            // Clear any simulated session since we have a real one
            localStorage.removeItem("crypx_custom_session_v1");
          } else if (authErr) {
            authErrorMsg = authErr.message;
          }
        } catch (err: any) {
          authErrorMsg = err.message;
        }

        if (realAuthSuccess) {
          if (appMode === "ADMIN") {
            const syncedIsAdmin = await syncAdminPermissions(normEmail);
            if (!syncedIsAdmin && !isUserAdmin(normEmail)) {
              await supabase.auth.signOut();
              throw new Error("Unauthorized: Admin access only");
            }
          }
          toast({ title: "Welcome back!", description: "You have been logged in successfully." });
          onSuccess?.();
          return;
        } else if (matchedCustom || isPrimaryMatched) {
          try {
             const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
               email: normEmail,
               password: password,
               options: {
                 data: { 
                   display_name: matchedCustom ? matchedCustom.username : "Platform Owner",
                   username: matchedCustom ? matchedCustom.username : "Owner",
                   custom_id: matchedCustom ? matchedCustom.customId : "OWNER",
                   role: matchedCustom ? matchedCustom.role : "owner"
                 }
               }
             });
             
             if (!signUpErr && signUpData.session) {
               localStorage.removeItem("crypx_custom_session_v1");
               toast({ title: "Welcome!", description: "Account synchronized and logged in." });
               onSuccess?.();
               return;
             } else if (signUpErr && signUpErr.message.toLowerCase().includes("already registered")) {
               throw new Error("This admin email is already registered on the platform. Please use your original password you signed up with, or register a different admin email in the portal.");
             } else if (signUpErr) {
               throw signUpErr;
             }
          } catch (e: any) {
             console.warn("Seamless signup failed", e);
             toast({ title: "Authentication Failed", description: e.message || "Failed to synchronize admin account.", variant: "destructive" });
             return;
          }
          
          // We only reach here if something bizarre happened, but we shouldn't create a fake session anymore
          // because fake sessions cannot read from the database due to RLS.
          toast({ title: "Error", description: "Could not establish a secure database session. Please check your credentials.", variant: "destructive" });
          return;
        } else {
          // If we are here, it means neither realAuthSuccess nor fallback succeeded
          throw new Error(authErrorMsg || "Invalid login credentials");
        }
      } else {
        if (referralCode.trim()) {
          localStorage.setItem('crypx_pending_ref_v1', referralCode.trim());
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              display_name: displayName || "Crypto Trader",
              referral_code: referralCode.trim() || undefined
            },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({ title: "Account created!", description: email === "admin@crypx.pro" ? "Admin account registered!" : "Please check your email to verify your account." });
        if (onSuccess && !error) onSuccess();
      }
    } catch (error: any) {
      toast({ title: "Auth Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const title = isUpdatePassword
    ? "Set New Password"
    : isForgotPassword
    ? "Reset Password"
    : isLogin
    ? "Welcome Back"
    : "Create Account";

  const subtitle = isUpdatePassword
    ? "Enter and confirm your new secure password"
    : isForgotPassword
    ? "Enter your email to receive a reset link"
    : isLogin
    ? "Sign in to access your dashboard"
    : "Join CrypX-Pro and start trading";

  const glassInputClasses = "w-full pl-12 pr-4 py-3.5 rounded-2xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all backdrop-blur-sm";

  return (
    <div className={`w-full ${isInsideModal ? '' : 'max-w-md'}`}>
      <div className="relative z-10 w-full mb-8">
        {!isInsideModal && (
          <div className="flex justify-center mb-12">
            <Logo size={80} variant="SYMBOL" className="drop-shadow-[0_0_20px_rgba(255,191,0,0.2)]" />
          </div>
        )}
        
        <h1 className="text-3xl font-bold text-center mb-3 text-foreground tracking-tight">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-10 font-medium font-sans animate-pulse">
          {subtitle}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isUpdatePassword ? (
            <>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={glassInputClasses}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Confirm New Password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className={glassInputClasses}
                  required
                  minLength={6}
                />
              </div>
            </>
          ) : (
            <>
              {!isLogin && !isForgotPassword && (
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder="Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={glassInputClasses}
                    required
                  />
                </div>
              )}

              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={glassInputClasses}
                  required
                />
              </div>

              {!isForgotPassword && (
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={glassInputClasses}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {isLogin && !isForgotPassword && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-xs text-primary hover:underline transition-colors font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </>
          )}

          {!isForgotPassword && !isUpdatePassword && (
            <div className="flex items-start gap-2.5 my-3 px-1 text-xs">
              <input
                type="checkbox"
                id="auth-terms-checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-primary border-border cursor-pointer shrink-0"
              />
              <label htmlFor="auth-terms-checkbox" className="text-muted-foreground cursor-pointer select-none leading-tight">
                I do AGREE the{" "}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-primary font-bold hover:underline"
                >
                  terms & conditions
                </button>
                {" "}and{" "}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-primary font-bold hover:underline"
                >
                  disclaimer
                </button>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold hover:scale-[1.02] hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_20px_rgba(255,191,0,0.2)] flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading
              ? "Processing..."
              : isUpdatePassword
              ? "Update Password"
              : isForgotPassword
              ? "Send Reset Link"
              : isLogin
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        {/* Modal for Terms & Conditions and Educational Disclaimers */}
        {showTermsModal && (
          <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-card w-full max-w-lg rounded-[32px] max-h-[85vh] flex flex-col shadow-2xl border border-border animate-scale-in text-left">
              <div className="p-6 border-b border-border flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <FileText className="text-primary" size={24} />
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Terms & Conditions</h3>
                    <p className="text-xs text-muted-foreground">Educational & Demo Platform Agreement</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowTermsModal(false)}
                  className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs sm:text-sm text-muted-foreground leading-relaxed custom-scrollbar">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
                  <div className="flex items-center gap-2 font-bold text-amber-300 mb-1">
                    <AlertTriangle size={16} /> Educational Demo Trading Notice
                  </div>
                  <p className="text-xs text-amber-200/90 leading-relaxed">
                    CrypX-Pro is strictly an educational demo trading simulator. It does not provide real financial services, real asset deposits, live money withdrawals, or financial advice. All balances are paper credits.
                  </p>
                </div>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-foreground text-sm">1. Non-Financial Purpose & Educational Scope</h4>
                  <p>
                    This platform is built for software testing, educational evaluation, and demo trading practice in Web3 mechanics. No real fiat or cryptocurrency transactions occur on this platform.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-foreground text-sm">2. Complete Exemption of Developer Liability</h4>
                  <p>
                    By signing up or logging in, the user agrees that the development teams, individual developers, software authors, and platform operators shall bear ZERO legal liability or financial responsibility for any user actions or decisions.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-foreground text-sm">3. Transparent Platform Capabilities</h4>
                  <p>
                    Spot trading, futures leverage, staking yield, identity verification, and asset portfolio tracking are simulated software features designed to teach users trading mechanics safely.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-foreground text-sm">4. Privacy & Compliance</h4>
                  <p>
                    User account data is stored securely using encrypted database connections for session state management. We do not sell user data or engage in predatory practices.
                  </p>
                </section>
              </div>

              <div className="p-4 border-t border-border flex justify-end shrink-0">
                <button
                  onClick={() => {
                    setAgreedTerms(true);
                    setShowTermsModal(false);
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all shadow-brand-sm"
                >
                  I Understand & Agree
                </button>
              </div>
            </div>
          </div>
        )}

        {isUpdatePassword ? (
          <p className="text-center text-sm text-muted-foreground mt-8">
            <button
              onClick={() => setIsUpdatePassword(false)}
              className="text-primary font-bold hover:underline"
            >
              Cancel Reset
            </button>
          </p>
        ) : isForgotPassword ? (
          <div className="space-y-4 mt-8">
            <p className="text-center text-sm text-muted-foreground">
              <button
                onClick={() => setIsForgotPassword(false)}
                className="text-primary font-bold hover:underline"
              >
                Back to Sign In
              </button>
            </p>
          </div>
        ) : !isDomainAdmin ? (
          <p className="text-center text-sm mt-8">
            <span className="text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </span>{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-bold hover:underline"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        ) : null}
      </div>
    </div>
  );
};
