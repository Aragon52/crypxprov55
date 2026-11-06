import { motion } from "motion/react";
import { UserCheck, LineChart, ShieldCheck, Wallet, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const HowItWorksSection = () => {
  const navigate = useNavigate();

  const steps = [
    {
      step: "01",
      icon: UserCheck,
      title: "Create Account & Simulator Access",
      description: "Sign up in seconds with email or Web3 authentication. Immediately receive access to live market feeds and risk-free simulation environments."
    },
    {
      step: "02",
      icon: LineChart,
      title: "Analyze Live Technical Charts",
      description: "Utilize institutional TradingView indicators, real-time L2 order books, multi-timeframe candle analysis, and market depth scanners."
    },
    {
      step: "03",
      icon: ShieldCheck,
      title: "Execute Spot & Futures Trades",
      description: "Place limit, market, or conditional orders with up to 125x leverage, automated take-profit / stop-loss guardrails, and isolated margin safety."
    },
    {
      step: "04",
      icon: Wallet,
      title: "Stake in Earn Vaults & Manage PnL",
      description: "Grow your holdings with daily compounding Earn vaults, track real-time portfolio analytics, and withdraw to multi-chain secure wallets."
    }
  ];

  return (
    <section className="py-28 px-4 sm:px-6 max-w-7xl mx-auto relative z-10 border-t border-border bg-secondary/20">
      <div className="text-center max-w-3xl mx-auto mb-20">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-[10px] uppercase font-semibold tracking-widest mb-4">
          <ShieldCheck size={13} />
          Seamless Onboarding
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
          How to Get Started with <span className="text-primary italic font-medium">CrypX-Pro</span>
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base font-light leading-relaxed">
          Follow four simple steps to begin trading, testing strategies, and growing your digital wealth.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        {steps.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.8 }}
              className="p-8 rounded-2xl bg-card border border-border flex flex-col justify-between hover:border-primary/30 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-8">
                  <span className="font-mono text-3xl font-light text-primary/40 group-hover:text-primary transition-colors">
                    {item.step}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Icon size={18} />
                  </div>
                </div>

                <h3 className="text-lg font-medium text-foreground mb-3 tracking-tight">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-light">
                  {item.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="text-center">
        <button
          onClick={() => navigate("/auth")}
          className="px-8 py-3.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-brand inline-flex items-center gap-2"
        >
          Start Trading Now
          <ArrowRight size={14} />
        </button>
      </div>
    </section>
  );
};
