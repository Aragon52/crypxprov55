import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, SlidersHorizontal, Menu, TrendingUp, Sparkles } from 'lucide-react';
import { CryptoIcon } from '@/components/shared/CryptoIcon';
import type { MarketTicker } from '@/services/market';

interface AssetConfig {
  name: string;
  category: string;
}

interface TokenPairSelectorProps {
  selectedPair: string;
  onSelectPair: (pair: string) => void;
  tickers: Record<string, MarketTicker>;
  assetConfig: Record<string, AssetConfig>;
  symbolsList: string[];
}

const CATEGORIES = ['All', 'Main', 'Stocks & Commodities', 'Layer 1', 'Layer-2', 'DeFi', 'Meme', 'Alpha', 'AI'];

export const TokenPairSelector: React.FC<TokenPairSelectorProps> = ({
  selectedPair,
  onSelectPair,
  tickers,
  assetConfig,
  symbolsList
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const baseSymbol = selectedPair.replace('USDT', '');
  const activeTicker = tickers[selectedPair] || { lastPrice: 0, priceChangePercent: 0, high24h: 0, low24h: 0, volume24h: 0 };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 250);
  };

  // Filter pairs
  const filteredSymbols = symbolsList.filter(pair => {
    const symbol = pair.replace('USDT', '');
    const config = assetConfig[symbol] || { name: symbol, category: 'Main' };
    
    // Category check
    let categoryMatch = activeCategory === 'All';
    if (!categoryMatch) {
      if (activeCategory === 'AI') {
        categoryMatch = ['FET', 'RENDER', 'WLD', 'GRT'].includes(symbol) || config.category === 'AI';
      } else if (activeCategory === 'Layer-2') {
        categoryMatch = config.category === 'Layer-2' || ['OP', 'ARB'].includes(symbol);
      } else {
        categoryMatch = config.category === activeCategory;
      }
    }

    // Search query
    const searchMatch = pair.toLowerCase().includes(searchQuery.toLowerCase()) ||
      config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      symbol.toLowerCase().includes(searchQuery.toLowerCase());

    return categoryMatch && searchMatch;
  });

  return (
    <div 
      className="relative inline-block" 
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Selector Button with 3-line dashboard icon and dropdown arrow */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer border ${
          isOpen 
            ? 'bg-primary/10 border-primary/40 shadow-md ring-2 ring-primary/20' 
            : 'bg-card border-border hover:bg-muted/80 hover:border-primary/30'
        }`}
        title="Select Token Pair"
      >
        {/* Three-line dashboard panel icon next to pair */}
        <div className="p-1.5 bg-primary/10 text-primary rounded-lg border border-primary/20 flex items-center justify-center">
          <Menu size={16} className="stroke-[2.5]" />
        </div>

        {/* Selected Pair Info */}
        <div className="flex items-center gap-2">
          <CryptoIcon symbol={baseSymbol} size={24} />
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm text-foreground tracking-tight">{baseSymbol}/USDT</span>
              <ChevronDown 
                size={14} 
                className={`text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} 
              />
            </div>
            <div className="text-[10px] font-semibold text-muted-foreground leading-none">
              {assetConfig[baseSymbol]?.name || baseSymbol}
            </div>
          </div>
        </div>
      </button>

      {/* Hover / Click Dropdown Panel */}
      {isOpen && (
        <div 
          className="fixed inset-x-2 top-16 sm:absolute sm:inset-x-auto sm:left-0 sm:top-full mt-2 w-auto sm:w-[420px] max-w-[96vw] sm:max-w-none bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Header & Search */}
          <div className="p-3 bg-muted/30 border-b border-border space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-muted-foreground">
                <SlidersHorizontal size={13} className="text-primary" />
                <span>Select Token Pair</span>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-mono">
                {filteredSymbols.length} Pairs
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input
                type="text"
                placeholder="Search symbol or name (e.g. BTC, Solana)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 font-medium"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground hover:text-foreground bg-muted hover:bg-accent px-1.5 py-0.5 rounded"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1 overflow-x-auto no-scrollbar pt-1 pb-0.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border ${
                    activeCategory === cat
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-background/80 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Token Pairs List */}
          <div className="max-h-[340px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filteredSymbols.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Search size={24} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs font-bold">No trading pairs found</p>
                <p className="text-[10px] opacity-70 mt-0.5">Try searching for a different keyword</p>
              </div>
            ) : (
              filteredSymbols.map((pair) => {
                const symbol = pair.replace('USDT', '');
                const ticker = tickers[pair] || { lastPrice: 0, priceChangePercent: 0 };
                const isSelected = selectedPair === pair;
                const config = assetConfig[symbol] || { name: symbol, category: 'Main' };

                return (
                  <button
                    key={pair}
                    type="button"
                    onClick={() => {
                      onSelectPair(pair);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all border text-left ${
                      isSelected
                        ? 'bg-primary/10 border-primary/30 shadow-sm'
                        : 'bg-card border-transparent hover:bg-muted/70 hover:border-border'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CryptoIcon symbol={symbol} size={28} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-foreground font-mono">{symbol}/USDT</span>
                          <span className="text-[8px] font-extrabold px-1.5 py-0.2 rounded bg-muted text-muted-foreground uppercase">
                            {config.category}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-medium truncate max-w-[120px]">
                          {config.name}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-xs font-mono text-foreground">
                        ${ticker.lastPrice.toLocaleString(undefined, { 
                          minimumFractionDigits: ticker.lastPrice < 1 ? 4 : 2,
                          maximumFractionDigits: ticker.lastPrice < 1 ? 6 : 2
                        })}
                      </div>
                      <div className={`text-[10px] font-extrabold font-mono flex items-center justify-end gap-0.5 ${
                        ticker.priceChangePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {ticker.priceChangePercent >= 0 ? '+' : ''}
                        {ticker.priceChangePercent.toFixed(2)}%
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
