import { motion } from "motion/react";
import { Logo } from "./shared/Logo";

const features = [
  {
    title: "Ultra-Fast Execution",
    description: "Our proprietary matching engine handles over 1 million transactions per second with <5ms latency.",
    iconProps: { x: 25, y: 25, scale: 200 },
  },
  {
    title: "Bank-Grade Security",
    description: "Multi-sig cold storage and institutional-grade encryption protect your digital assets 24/7.",
    iconProps: { x: 75, y: 25, scale: 200 },
  },
  {
    title: "Global Liquidity",
    description: "Deep order books and high liquidity across all top pairs ensure minimal slippage on every trade.",
    iconProps: { x: 25, y: 75, scale: 200 },
  },
  {
    title: "Advanced Trading",
    description: "Comprehensive charting tools, custom indicators, and automated trading bots via our API.",
    iconProps: { x: 75, y: 75, scale: 200 },
  },
  {
    title: "Multi-Asset Support",
    description: "Trade everything from majors like BTC and ETH to new trending ecosystem tokens.",
    iconProps: { x: 50, y: 50, scale: 200 },
  },
  {
    title: "Premium Support",
    description: "Our dedicated support team is available around the clock in 15+ languages via live chat.",
    iconProps: { x: 50, y: 50, scale: 150 },
  },
];

const FeatureCards = () => {
  return (
    <section className="py-32 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-24">
        <h2 className="text-3xl md:text-5xl font-light text-foreground mb-6 tracking-tight">
          Built for the <span className="text-primary italic font-medium">Next Generation</span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg font-light leading-relaxed">
          Experience the most advanced crypto exchange platform with tools designed for high-frequency trading and wealth management.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.8 }}
            className="p-10 bg-card border border-border hover:bg-primary/[0.02] hover:border-primary/20 transition-all group"
          >
            <div className="mb-8 group-hover:scale-110 transition-transform duration-700">
              <Logo size={28} variant="SYMBOL" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-3 tracking-wide">{feature.title}</h3>
            <p className="text-muted-foreground leading-relaxed text-sm font-light">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default FeatureCards;
