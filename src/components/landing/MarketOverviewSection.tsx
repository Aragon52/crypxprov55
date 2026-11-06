import { useState } from "react";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown, ArrowUpRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CryptoTicker {
  symbol: string;
  name: string;
  price: string;
  change24h: number;
  high24h: string;
  low24h: string;
  volume24h: string;
  category: "Major" | "Layer 1" | "DeFi" | "Meme";
}

const MARKET_DATA: CryptoTicker[] = [
  { symbol: "BTC/USDT", name: "Bitcoin", price: "$96,420.50", change24h: 3.42, high24h: "$97,800.00", low24h: "$94,150.00", volume24h: "$28.4B", category: "Major" },
  { symbol: "ETH/USDT", name: "Ethereum", price: "$2,745.80", change24h: 4.18, high24h: "$2,810.00", low24h: "$2,680.00", volume24h: "$14.2B", category: "Major" },
  { symbol: "SOL/USDT", name: "Solana", price: "$198.40", change24h: 6.85, high24h: "$204.50", low24h: "$187.20", volume24h: "$6.8B", category: "Layer 1" },
  { symbol: "BNB/USDT", name: "Binance Coin", price: "$658.20", change24h: 1.95, high24h: "$665.00", low24h: "$645.00", volume24h: "$2.1B", category: "Major" },
  { symbol: "XRP/USDT", name: "Ripple", price: "$2.45", change24h: 5.12, high24h: "$2.58", low24h: "$2.31", volume24h: "$4.9B", category: "Major" },
  { symbol: "DOGE/USDT", name: "Dogecoin", price: "$0.264", change24h: -1.24, high24h: "$0.278", low24h: "$0.258", volume24h: "$1.8B", category: "Meme" },
  { symbol: "AVAX/USDT", name: "Avalanche", price: "$34.80", change24h: 3.75, high24h: "$36.10", low24h: "$33.20", volume24h: "$920M", category: "Layer 1" },
  { symbol: "LINK/USDT", name: "Chainlink", price: "$18.90", change24h: 2.80, high24h: "$19.40", low24h: "$18.10", volume24h: "$650M", category: "DeFi" },
  { symbol: "SUI/USDT", name: "Sui Network", price: "$3.42", change24h: 8.92, high24h: "$3.55", low24h: "$3.10", volume24h: "$1.1B", category: "Layer 1" },
  { symbol: "ADA/USDT", name: "Cardano", price: "$0.78", change24h: -0.85, high24h: "$0.82", low24h: "$0.76", volume24h: "$840M", category: "Layer 1" }
];

export const MarketOverviewSection = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"All" | "Major" | "Layer 1" | "DeFi" | "Meme">("All");
  const [search, setSearch] = useState("");

  const filteredData = MARKET_DATA.filter(item => {
    const matchesTab = activeTab === "All" || item.category === activeTab;
    const matchesSearch = item.symbol.toLowerCase().includes(search.toLowerCase()) || 
                          item.name.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto relative z-10">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-[10px] uppercase font-semibold tracking-widest mb-4">
          <TrendingUp size={13} />
          Real-Time Market Depth
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
          Live Digital Asset <span className="text-primary italic font-medium">Liquidity & Pricing</span>
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base font-light leading-relaxed">
          Monitor top global cryptocurrency spot pairs and perpetual derivative quotes with sub-second price discovery.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 bg-card/60 border border-border p-3 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {(["All", "Major", "Layer 1", "DeFi", "Meme"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-medium tracking-wider uppercase transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search coin or pair..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Market Table */}
      <div className="border border-border rounded-2xl bg-card/40 backdrop-blur-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/20 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="py-4 px-6">Market / Asset</th>
                <th className="py-4 px-6">Last Price</th>
                <th className="py-4 px-6">24h Change</th>
                <th className="py-4 px-6 hidden sm:table-cell">24h High / Low</th>
                <th className="py-4 px-6 hidden md:table-cell">24h Volume</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {filteredData.map((coin, index) => {
                const isPositive = coin.change24h >= 0;
                return (
                  <motion.tr
                    key={coin.symbol}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-muted/30 transition-colors group cursor-pointer"
                    onClick={() => navigate("/auth")}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted/60 border border-border flex items-center justify-center font-bold text-xs text-primary group-hover:scale-105 transition-transform">
                          {coin.symbol.split('/')[0].slice(0, 3)}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            {coin.symbol}
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-normal">
                              {coin.category}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">{coin.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono font-medium text-foreground">
                      {coin.price}
                    </td>
                    <td className="py-4 px-6">
                      <div className={`inline-flex items-center gap-1 font-mono font-semibold text-xs px-2.5 py-1 rounded-lg ${
                        isPositive ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
                      }`}>
                        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {isPositive ? `+${coin.change24h}%` : `${coin.change24h}%`}
                      </div>
                    </td>
                    <td className="py-4 px-6 hidden sm:table-cell text-xs text-muted-foreground font-mono">
                      <div><span className="text-foreground/80">H:</span> {coin.high24h}</div>
                      <div><span className="text-foreground/80">L:</span> {coin.low24h}</div>
                    </td>
                    <td className="py-4 px-6 hidden md:table-cell text-xs text-muted-foreground font-mono">
                      {coin.volume24h}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/auth");
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary/40 text-primary text-xs font-semibold uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                      >
                        Trade
                        <ArrowUpRight size={13} />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
