import BannerSlideshow from "@/components/BannerSlideshow";
import FeatureCards from "@/components/FeatureCards";
import { LiveTickerMarquee } from "@/components/LiveTickerMarquee";
import { MarketOverviewSection } from "@/components/landing/MarketOverviewSection";
import { EcosystemSection } from "@/components/landing/EcosystemSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { DemoDisclaimerBanner } from "@/components/landing/DemoDisclaimerBanner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Shield, Globe, Diamond, ChevronRight, Lock } from "lucide-react";
import { motion } from "motion/react";
import { Logo } from "@/components/shared/Logo";
import { CryptoAuthView } from "@/components/auth/CryptoAuthView";
import { PWAInstallButton } from "@/components/shared/PWAInstallButton";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isMobileAuth, setIsMobileAuth] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileAuth(window.innerWidth < 1024); // lg breakpoint equivalent
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const hostname = window.location.hostname;
    const isDomainAdmin = hostname === 'admin.crypxpro.com' || hostname.startsWith('admin.');
    const searchParams = window.location.search;
    
    if (isDomainAdmin) {
      navigate(`/auth${searchParams}`, { replace: true });
      return;
    }

    if (!loading && user) {
      navigate("/app/home", { replace: true });
      return;
    }

    const urlParams = new URLSearchParams(searchParams);
    const ref = urlParams.get('ref');
    if (ref && !loading && !user) {
      navigate(`/auth?ref=${ref}`, { replace: true });
    }
  }, [user, loading, navigate]);

  const stats = [
    { label: "Quarterly Volume", value: "$42B+" },
    { label: "Global Clients", value: "1.2M+" },
    { label: "Execution Speed", value: "<5ms" },
    { label: "Cold Storage", value: "100% MPC" },
  ];

  if (isMobileAuth && !user) {
    return <CryptoAuthView />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-hidden font-sans">
      {/* Premium Dark Background Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-primary/10 blur-[150px] opacity-70" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="cursor-pointer" onClick={() => navigate("/")}>
            <Logo size={48} variant="FULL" />
          </div>
          
          <div className="hidden lg:flex items-center gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
            <a href="#markets" className="hover:text-primary transition-colors">Markets</a>
            <a href="#ecosystem" className="hover:text-primary transition-colors">Products</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a>
            <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
            <Link to="/faq" className="hover:text-primary transition-colors">Help Center</Link>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <PWAInstallButton className="hidden sm:flex" />
            {!user ? (
              <button 
                onClick={() => navigate("/auth")}
                className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground hover:text-primary transition-colors"
              >
                Sign In
              </button>
            ) : null}
            <button 
              onClick={() => navigate("/auth")}
              className="px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl border border-primary/50 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-[0.1em] hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-sm"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-16 sm:pt-20 relative z-10">
        {/* Live Ticker Marquee */}
        <div className="border-b border-border bg-muted/40 overflow-hidden">
          <LiveTickerMarquee />
        </div>

        {/* Hero Section */}
        <section className="relative pt-16 sm:pt-32 pb-16 sm:pb-24 px-6">
          <div className="max-w-5xl mx-auto text-center relative z-10 px-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-border bg-card/40 text-muted-foreground text-[9px] sm:text-[10px] uppercase tracking-[0.2em] mb-8 backdrop-blur-md"
            >
              <Diamond size={12} className="text-primary" />
              Institutional Digital Asset & Simulation Hub
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl sm:text-6xl md:text-7xl font-light tracking-tight leading-[1.1] text-foreground mb-8"
            >
              The Premier Standard <br className="hidden sm:block" />
              <span className="text-primary italic font-medium">for Digital Finance</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-muted-foreground text-sm sm:text-lg md:text-xl max-w-2xl mx-auto mb-12 sm:mb-16 font-light leading-relaxed"
            >
              Access institutional-grade liquidity, ultra-fast Spot order execution, 125x Perpetual Futures simulation, and high-yield Earn staking vaults.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4"
            >
              <button 
                onClick={() => navigate("/auth")}
                className="w-full sm:w-auto px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-sm tracking-widest uppercase shadow-brand transition-all hover:scale-105 active:scale-95"
              >
                Create Account
              </button>
              <a 
                href="#markets"
                className="w-full sm:w-auto px-10 py-4 border border-border bg-card/50 text-foreground rounded-2xl font-bold text-sm tracking-widest uppercase transition-all hover:bg-muted text-center"
              >
                View Live Markets
              </a>
            </motion.div>
          </div>
        </section>

        {/* Slideshow */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="max-w-6xl mx-auto px-4"
        >
          <BannerSlideshow />
        </motion.div>

        {/* Quick Stats */}
        <section className="py-24 border-y border-border bg-secondary/30 mt-24">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-12 text-center divide-x divide-border">
              {stats.map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.8 }}
                  className={i === 0 || i === 2 ? "border-none" : ""} 
                >
                  <p className="text-3xl md:text-4xl font-light tracking-tight mb-2 text-foreground">{stat.value}</p>
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 1. Live Market Overview Section */}
        <div id="markets">
          <MarketOverviewSection />
        </div>

        {/* 2. Core Product Ecosystem Section */}
        <div id="ecosystem">
          <EcosystemSection />
        </div>

        {/* 3. Feature Highlights Cards */}
        <FeatureCards />

        {/* 4. Step-by-Step Onboarding Workflow */}
        <div id="how-it-works">
          <HowItWorksSection />
        </div>

        {/* Trust & Security Architecture */}
        <section className="py-32 px-6 relative overflow-hidden bg-secondary/50 border-y border-border">
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-8 leading-[1.2] text-foreground">
                  Uncompromising <br />
                  <span className="text-primary italic font-medium">Security Standards.</span>
                </h2>
                <div className="space-y-8">
                  <div className="flex gap-6 items-start">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0 border border-border text-foreground rounded-xl bg-card">
                      <Shield size={20} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-lg mb-2 text-foreground">Multi-Party Computation (MPC) Cold Storage</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed font-light">
                        Digital assets are kept in geographically distributed offline multi-signature vaults protected by hardware security modules (HSM) and automated proof-of-reserves.
                      </p>
                    </div>
                  </div>

                  <div className="w-full h-px bg-border" />

                  <div className="flex gap-6 items-start">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0 border border-border text-foreground rounded-xl bg-card">
                      <Globe size={20} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-lg mb-2 text-foreground">Continuous Risk Engine & Anomaly Protection</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed font-light">
                        Real-time algorithmic liquidation controls, fair mark-price indexing, and zero-knowledge session encryption ensure transparent, manipulation-free trading.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="p-12 sm:p-16 border border-border bg-card/60 backdrop-blur-xl rounded-2xl shadow-sm">
                  <div className="text-center">
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-12">
                      Trusted by Institutional Partners & Liquidity Venues
                    </p>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-12 text-muted-foreground/40 font-light text-2xl tracking-widest">
                      <div className="flex items-center justify-center hover:text-primary transition-colors cursor-default">BINANCE</div>
                      <div className="flex items-center justify-center hover:text-primary transition-colors cursor-default">COINBASE</div>
                      <div className="flex items-center justify-center hover:text-primary transition-colors cursor-default">KRAKEN</div>
                      <div className="flex items-center justify-center hover:text-primary transition-colors cursor-default">BYBIT</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Interactive FAQ Section */}
        <div id="faq">
          <FaqSection />
        </div>

        {/* 6. Prominent Demo / Simulation Disclaimer & Risk Warning */}
        <DemoDisclaimerBanner />

        {/* Final CTA Banner */}
        <section className="py-36 px-6 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] -z-10" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-light tracking-tight mb-8 leading-[1.1] text-foreground">
              Elevate Your <br />
              <span className="text-primary italic font-medium">Digital Trading Experience</span>
            </h2>
            <p className="text-muted-foreground text-base md:text-lg mb-12 font-light max-w-2xl mx-auto leading-relaxed">
              Open an institutional-grade account today to access premier liquidity, personalized service, and professional simulation architecture.
            </p>
            <button 
              onClick={() => navigate("/auth")}
              className="px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-sm tracking-widest uppercase hover:scale-105 transition-all duration-300 shadow-brand inline-flex items-center gap-2"
            >
              Get Started Free
              <ChevronRight size={16} />
            </button>
          </div>
        </section>
      </main>

      {/* Comprehensive Footer */}
      <footer className="bg-secondary py-20 px-6 border-t border-border relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <div className="mb-6 opacity-90">
                <Logo size={56} variant="FULL" />
              </div>
              <p className="text-muted-foreground max-w-sm text-xs font-light leading-relaxed mb-6">
                CrypX-Pro provides institutional cryptocurrency spot trading, up to 125x perpetual futures simulation, and high-yield staking vaults with real-time market liquidity.
              </p>
              <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Lock size={13} className="text-primary" />
                <span>SSL / TLS 256-Bit Encrypted Platform</span>
              </div>
            </div>
            
            <div>
              <h5 className="font-medium text-[10px] uppercase tracking-[0.2em] text-foreground/70 mb-6">Corporate & Legal</h5>
              <div className="flex flex-col gap-3.5 text-xs font-light text-muted-foreground">
                <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service & Risk Disclosure</Link>
                <Link to="/policies" className="hover:text-primary transition-colors">Privacy Policy & Security Standards</Link>
                <Link to="/faq" className="hover:text-primary transition-colors">Knowledge Base & FAQ</Link>
                <a href="mailto:admin@crypxpro.com" className="hover:text-primary transition-colors">admin@crypxpro.com</a>
              </div>
            </div>
            
            <div>
              <h5 className="font-medium text-[10px] uppercase tracking-[0.2em] text-foreground/70 mb-6">Platform Products</h5>
              <div className="flex flex-col gap-3.5 text-xs font-light text-muted-foreground">
                <a href="#markets" className="hover:text-primary transition-colors">Live Market Prices</a>
                <a href="#ecosystem" className="hover:text-primary transition-colors">Spot Exchange</a>
                <a href="#ecosystem" className="hover:text-primary transition-colors">125x Perpetual Futures</a>
                <a href="#ecosystem" className="hover:text-primary transition-colors">High-Yield Earn Vaults</a>
                <a href="#faq" className="hover:text-primary transition-colors">Demo & Simulation Guide</a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border/80 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em]">
              © {new Date().getFullYear()} CrypX-Pro Platform. All Rights Reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="https://twitter.com/CrypXPro" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-all text-xs font-light tracking-widest uppercase">
                X (Twitter)
              </a>
              <Link to="/terms" className="text-muted-foreground hover:text-primary transition-all text-xs font-light tracking-widest uppercase">
                Disclaimers
              </Link>
              <Link to="/policies" className="text-muted-foreground hover:text-primary transition-all text-xs font-light tracking-widest uppercase">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
