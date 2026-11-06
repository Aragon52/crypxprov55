import React, { useState } from 'react';
import { Wallet, RefreshCw, ArrowRightLeft, Search, Eye, EyeOff, ArrowUpRight, TrendingUp } from 'lucide-react';
import { CryptoIcon } from '@/components/shared/CryptoIcon';
import type { UserAsset } from '@/types';
import type { MarketTicker } from '@/services/market';

interface SpotWalletBoxProps {
  usdtBalance: number;
  userAssets: UserAsset[];
  tickers: Record<string, MarketTicker>;
  assetConfig: Record<string, { name: string; category: string }>;
  onSelectPairToTrade: (pair: string) => void;
  onOpenConvert: () => void;
  onOpenTransfer: () => void;
}

export const SpotWalletBox: React.FC<SpotWalletBoxProps> = ({
  usdtBalance,
  userAssets,
  tickers,
  assetConfig,
  onSelectPairToTrade,
  onOpenConvert,
  onOpenTransfer
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hideSmallBalances, setHideSmallBalances] = useState(true);

  // Calculate values for non-USDT assets
  const cryptoAssetsCalculated = userAssets.map(asset => {
    const pair = `${asset.symbol}USDT`;
    const ticker = tickers[pair] || { lastPrice: 0, priceChangePercent: 0 };
    const price = ticker.lastPrice || 0;
    const value = asset.amount * price;
    const config = assetConfig[asset.symbol] || { name: asset.symbol, category: 'Main' };

    return {
      id: asset.id,
      symbol: asset.symbol,
      name: config.name,
      amount: asset.amount,
      price,
      value,
      priceChangePercent: ticker.priceChangePercent,
      pair
    };
  });

  const totalCryptoValue = cryptoAssetsCalculated.reduce((acc, a) => acc + (a.value >= 0.01 ? a.value : 0), 0);
  const totalSpotBalance = usdtBalance + totalCryptoValue;

  // Filtered assets
  const filteredAssets = cryptoAssetsCalculated.filter(asset => {
    if (hideSmallBalances && asset.value < 0.01) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return asset.symbol.toLowerCase().includes(query) || asset.name.toLowerCase().includes(query);
    }
    return true;
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-4">
      {/* Wallet Overview Banner */}
      <div className="bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60 border border-border/80 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Total Spot Balance */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-muted-foreground">
            <Wallet size={15} className="text-primary" />
            <span>Total Spot Holding Balance</span>
          </div>
          <div className="text-2xl font-black font-mono text-foreground">
            ${totalSpotBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs font-bold text-muted-foreground ml-2 font-sans uppercase">USD</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-bold text-muted-foreground pt-0.5">
            <span>
              Available USDT: <strong className="text-foreground font-mono">${usdtBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </span>
            <span>•</span>
            <span>
              Crypto Equity: <strong className="text-foreground font-mono">${totalCryptoValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenConvert}
            className="flex-1 md:flex-none px-3.5 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <RefreshCw size={13} />
            <span>Convert</span>
          </button>
          <button
            type="button"
            onClick={onOpenTransfer}
            className="flex-1 md:flex-none px-3.5 py-2.5 bg-muted hover:bg-accent text-foreground border border-border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <ArrowRightLeft size={13} />
            <span>Transfer</span>
          </button>
        </div>
      </div>

      {/* Asset Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
        <div className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
          <TrendingUp size={14} className="text-primary" />
          <span>Spot Wallet Assets ({filteredAssets.length + 1})</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Hide small balances toggle */}
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideSmallBalances}
              onChange={(e) => setHideSmallBalances(e.target.checked)}
              className="accent-primary rounded"
            />
            <span>Hide Small Balances (&lt; $0.01)</span>
          </label>

          {/* Search asset */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
            <input
              type="text"
              placeholder="Filter assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-primary/50 font-medium w-36"
            />
          </div>
        </div>
      </div>

      {/* Asset Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-border text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              <th className="py-2.5 px-3">Asset</th>
              <th className="py-2.5 px-3 text-right">Holding Balance</th>
              <th className="py-2.5 px-3 text-right">Current Price</th>
              <th className="py-2.5 px-3 text-right">Total USD Value</th>
              <th className="py-2.5 px-3 text-right">24h Change</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs font-mono font-medium">
            {/* 1. Base USDT row */}
            <tr className="hover:bg-muted/40 transition-colors">
              <td className="py-3 px-3">
                <div className="flex items-center gap-2.5 font-sans">
                  <CryptoIcon symbol="USDT" size={26} />
                  <div>
                    <div className="font-extrabold text-foreground text-xs">USDT</div>
                    <div className="text-[10px] text-muted-foreground font-semibold">Tether USD</div>
                  </div>
                </div>
              </td>
              <td className="py-3 px-3 text-right font-bold text-foreground">
                ${usdtBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-3 px-3 text-right text-muted-foreground">$1.00</td>
              <td className="py-3 px-3 text-right font-bold text-foreground">
                ${usdtBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-3 px-3 text-right font-bold text-emerald-500">+0.00%</td>
              <td className="py-3 px-3 text-center font-sans">
                <button
                  type="button"
                  onClick={onOpenConvert}
                  className="px-2.5 py-1 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground rounded-lg text-[10px] font-bold transition-all border border-primary/20"
                >
                  Convert
                </button>
              </td>
            </tr>

            {/* 2. Crypto Assets rows */}
            {filteredAssets.map((asset) => (
              <tr key={asset.id} className="hover:bg-muted/40 transition-colors">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2.5 font-sans">
                    <CryptoIcon symbol={asset.symbol} size={26} />
                    <div>
                      <div className="font-extrabold text-foreground text-xs">{asset.symbol}</div>
                      <div className="text-[10px] text-muted-foreground font-semibold">{asset.name}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-right font-bold text-foreground">
                  {asset.amount.toFixed(4)} {asset.symbol}
                </td>
                <td className="py-3 px-3 text-right text-foreground">
                  ${asset.price.toLocaleString(undefined, { 
                    minimumFractionDigits: asset.price < 1 ? 4 : 2,
                    maximumFractionDigits: asset.price < 1 ? 6 : 2
                  })}
                </td>
                <td className="py-3 px-3 text-right font-bold text-foreground">
                  ${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className={`py-3 px-3 text-right font-bold ${
                  asset.priceChangePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {asset.priceChangePercent >= 0 ? '+' : ''}{asset.priceChangePercent.toFixed(2)}%
                </td>
                <td className="py-3 px-3 text-center font-sans">
                  <button
                    type="button"
                    onClick={() => onSelectPairToTrade(asset.pair)}
                    className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-lg text-[10px] font-bold transition-all border border-emerald-500/20 flex items-center gap-1 mx-auto"
                  >
                    <span>Trade</span>
                    <ArrowUpRight size={11} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
