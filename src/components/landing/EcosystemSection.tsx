import { motion } from "motion/react";
import { Zap, Layers, Percent, Bot, ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const EcosystemSection = () => {
  const navigate = useNavigate();

  const products = [
    {
      icon: Zap,
      badge: "Instant Execution",
      title: "Sub-Millisecond Spot Trading",
      description: "Trade over 100+ spot cryptocurrency pairs with aggregated multi-venue liquidity, ultra-tight spreads, and sub-5ms order routing.",
      points: [
        "Live aggregated L2/L3 order book depth",
        "Zero-slippage algorithmic market & limit routing",
        "Integrated institutional TradingView charts with 50+ indicators"
      ],
      action: "Explore Spot",
      highlight: "Over 100+ Spot Pairs"
    },
    {
      icon: Layers,
      badge: "Up to 125x Leverage",
      title: "Perpetual Futures & Derivatives",
      description: "Trade linear USDT-margined perpetual futures with advanced risk controls, dual-direction hedge mode, and intelligent take-profit & stop-loss automation.",
      points: [
        "Flexible Cross and Isolated Margin configurations",
        "Simultaneous Long & Short positions with Hedge Mode",
        "Guaranteed TP/SL execution and fair index mark-price liquidation protection"
      ],
      action: "Explore Futures",
      highlight: "125x Max Leverage"
    },
    {
      icon: Percent,
      badge: "Passive Yield",
      title: "High-Yield Earn Staking Vaults",
      description: "Put your digital assets to work with flexible and fixed-term staking vaults offering daily compounded rewards and proof-of-reserve security.",
      points: [
        "Flexible deposits with instant penalty-free redemptions",
        "High-yield fixed staking terms up to 365 days",
        "Automated daily compound interest payout to your funding account"
      ],
      action: "Explore Earn",
      highlight: "Up to 24.5% APY"
    },
    {
      icon: Bot,
      badge: "Algorithmic Automation",
      title: "Trade-Fi Quant & Grid Bots",
      description: "Deploy automated grid trading strategies, dollar-cost averaging (DCA) bots, and quantitative portfolio rebalancers with zero coding required.",
      points: [
        "Pre-built quantitative templates optimized for trending and ranging markets",
        "Historical backtesting simulator with risk/reward metric analysis",
        "24/7 automated order placement directly on your exchange account"
      ],
      action: "Explore Quant",
      highlight: "Zero-Code Bots"
    }
  ];

  return (
    <section className="py-28 px-4 sm:px-6 max-w-7xl mx-auto relative z-10 border-t border-border">
      <div className="text-center max-w-3xl mx-auto mb-20">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-[10px] uppercase font-semibold tracking-widest mb-4">
          <Layers size={13} />
          Unified Trading Architecture
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
          A Complete Ecosystem Built for <br />
          <span className="text-primary italic font-medium">Professional Traders & Investors</span>
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base font-light leading-relaxed">
          From high-frequency algorithmic spot trades to high-leverage perpetual contracts and passive yield vaults.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {products.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.8 }}
              className="p-8 sm:p-10 rounded-2xl bg-card/60 border border-border hover:border-primary/40 hover:bg-card/90 transition-all duration-300 flex flex-col justify-between group shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <Icon size={22} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-muted border border-border text-foreground/80">
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-medium text-foreground mb-3 tracking-tight">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground font-light leading-relaxed mb-6">
                  {item.description}
                </p>

                <div className="space-y-2.5 mb-8">
                  {item.points.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-foreground/80 font-light">
                      <CheckCircle2 size={15} className="text-primary shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-border flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-primary">
                  {item.highlight}
                </span>
                <button
                  onClick={() => navigate("/auth")}
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground hover:text-primary transition-colors"
                >
                  {item.action}
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
