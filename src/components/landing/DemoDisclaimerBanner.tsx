import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

export const DemoDisclaimerBanner = () => {
  return (
    <section className="py-12 px-4 sm:px-6 max-w-7xl mx-auto relative z-10">
      <div className="p-6 sm:p-8 rounded-2xl bg-amber-500/5 border border-amber-500/20 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldAlert size={20} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-amber-300">
                Educational Simulation & Risk Disclosure Notice
              </h4>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                Demo & Risk Warning
              </span>
            </div>

            <p className="text-xs text-muted-foreground font-light leading-relaxed mb-3">
              <strong>CrypX-Pro</strong> provides institutional-grade cryptocurrency market simulation, analytical charting, and educational financial tooling. Cryptocurrency spot trading, staking, and leveraged perpetual derivatives involve substantial financial market risk and high volatility. 
              Simulated trading metrics, backtesting calculators, and analytical tools are provided for educational and analytical purposes only and do not constitute financial, investment, or legal advice.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>Always conduct independent due diligence before committing digital assets.</span>
              <Link to="/terms" className="text-primary hover:underline font-medium">
                View Risk Disclosures →
              </Link>
              <Link to="/policies" className="text-primary hover:underline font-medium">
                Privacy & Compliance →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
