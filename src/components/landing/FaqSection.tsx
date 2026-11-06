import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FAQItem[] = [
  {
    question: "What is CrypX-Pro and what trading products are offered?",
    answer: "CrypX-Pro is an institutional-grade cryptocurrency platform offering ultra-fast Spot trading across 100+ digital assets, USDT-margined Perpetual Futures with up to 125x leverage, high-yield Earn staking vaults, and automated algorithmic Trade-Fi strategies.",
    category: "General"
  },
  {
    question: "How does the demo and simulation trading engine work?",
    answer: "CrypX-Pro provides realistic financial simulation environments equipped with real-time market data feeds, live order book simulation, and portfolio margin metrics. This allows traders to practice technical strategies, test leverage limits, and evaluate risk parameters before committing live capital.",
    category: "Simulation"
  },
  {
    question: "What is the maximum leverage available for Perpetual Futures?",
    answer: "Traders can utilize leverage up to 125x on major pairs such as BTC/USDT and ETH/USDT, and up to 50x-75x on select altcoin contracts. Cross and Isolated margin modes, dual-direction hedge mode, and customizable TP/SL triggers are supported.",
    category: "Trading"
  },
  {
    question: "How are digital assets and customer funds secured?",
    answer: "Assets are secured using multi-party computation (MPC) cold storage architectures distributed across geographically redundant offline vaults. CrypX-Pro adheres to strict zero-knowledge authentication, continuous risk-engine anomaly scans, and 1:1 asset backing.",
    category: "Security"
  },
  {
    question: "How do Earn Staking Vaults generate yield?",
    answer: "Earn staking pools generate yield through on-chain network consensus validation, institutional liquidity provision, and low-risk market-making arbitrage. Yields are compounded daily and deposited directly into your funding account.",
    category: "Earn"
  },
  {
    question: "What are the deposit and withdrawal methods supported?",
    answer: "CrypX-Pro supports multi-chain cryptocurrency deposits and withdrawals across major networks including Bitcoin (BTC), Ethereum (ERC-20), Solana (SOL), Tron (TRC-20), BNB Chain (BEP-20), and Arbitrum with automated validation and fast block confirmations.",
    category: "Transfers"
  }
];

export const FaqSection = () => {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-28 px-4 sm:px-6 max-w-5xl mx-auto relative z-10 border-t border-border">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-[10px] uppercase font-semibold tracking-widest mb-4">
          <HelpCircle size={13} />
          Knowledge Center
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
          Frequently Asked <span className="text-primary italic font-medium">Questions</span>
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base font-light leading-relaxed">
          Learn about our trading engine, leverage parameters, security infrastructure, and simulation tools.
        </p>
      </div>

      <div className="space-y-4 mb-12">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`border rounded-2xl transition-all duration-300 overflow-hidden ${
                isOpen ? "bg-card border-primary/40 shadow-sm" : "bg-card/40 border-border hover:border-border/80"
              }`}
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full py-5 px-6 sm:px-8 text-left flex items-center justify-between gap-4 focus:outline-none"
              >
                <span className="font-medium text-sm sm:text-base text-foreground tracking-tight">
                  {faq.question}
                </span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-border text-muted-foreground transition-transform duration-300 ${
                  isOpen ? "rotate-180 text-primary border-primary/40 bg-primary/10" : ""
                }`}>
                  <ChevronDown size={16} />
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 sm:px-8 pb-6 text-sm text-muted-foreground font-light leading-relaxed border-t border-border/40 pt-4">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="p-6 rounded-2xl bg-card/60 border border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <h4 className="text-sm font-medium text-foreground">Have more questions about CrypX-Pro?</h4>
          <p className="text-xs text-muted-foreground font-light">Explore our comprehensive documentation or contact 24/7 dedicated support.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate("/faq")}
            className="px-5 py-2 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs font-semibold uppercase tracking-wider text-foreground transition-colors"
          >
            Full FAQ
          </button>
          <button
            onClick={() => navigate("/auth")}
            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    </section>
  );
};
