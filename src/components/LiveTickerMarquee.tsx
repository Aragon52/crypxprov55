import { useEffect, useState } from "react";
import { marketService } from "@/services/market";
import { motion } from "motion/react";

export const LiveTickerMarquee = () => {
  const [prices, setPrices] = useState<Record<string, { price: number; change: number }>>({});

  useEffect(() => {
    const fetchPrices = async () => {
      const markets = await marketService.getAllMarkets();
      const newPrices: Record<string, { price: number; change: number }> = {};
      markets.forEach(m => {
        newPrices[m.pair.replace("/USDT", "")] = { price: m.price, change: m.change24h };
      });
      setPrices(newPrices);
    };
    
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000); // 10s refresh
    return () => clearInterval(interval);
  }, []);

  const keys = Object.keys(prices);
  if (keys.length === 0) return null;

  return (
    <div className="w-full bg-background border-y border-border py-3 overflow-hidden relative">
      <div className="flex whitespace-nowrap">
        <motion.div 
          className="flex whitespace-nowrap min-w-full"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          {[...keys, ...keys].map((key, i) => {
            const item = prices[key];
            const isPositive = item.change >= 0;
            return (
              <div key={`${key}-${i}`} className="inline-flex items-center gap-3 px-8 border-r border-border/50 first:border-l">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{key}</span>
                <span className="text-sm font-bold text-foreground font-mono">${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm ${isPositive ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"}`}>
                  {isPositive ? "↑" : "↓"} {item.change.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};
