import React, { useState, useEffect } from 'react';
import { ArrowDownUp, DollarSign, Wallet, ShieldCheck, Zap } from 'lucide-react';
import { CryptoIcon } from '@/components/shared/CryptoIcon';
import type { MarketTicker } from '@/services/market';
import { toast } from 'sonner';

interface SpotOrderFormProps {
  symbol: string; // e.g. "BTC"
  pair: string;   // e.g. "BTCUSDT"
  ticker: MarketTicker;
  availableUsdt: number;
  availableBaseAsset: number;
  onExecuteTrade: (trade: {
    side: 'BUY' | 'SELL';
    type: 'LIMIT' | 'MARKET';
    price: number;
    amount: number;
    total: number;
  }) => Promise<void>;
  selectedPriceOverride?: number | null;
}

export const SpotOrderForm: React.FC<SpotOrderFormProps> = ({
  symbol,
  pair,
  ticker,
  availableUsdt,
  availableBaseAsset,
  onExecuteTrade,
  selectedPriceOverride
}) => {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('MARKET');
  const [priceInput, setPriceInput] = useState<string>('');
  const [amountInput, setAmountInput] = useState<string>('');
  const [totalInput, setTotalInput] = useState<string>('');
  const [percentage, setPercentage] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastEditedField, setLastEditedField] = useState<'AMOUNT' | 'TOTAL'>('AMOUNT');

  // Sync initial price or override from order book click
  useEffect(() => {
    if (selectedPriceOverride && selectedPriceOverride > 0) {
      setPriceInput(selectedPriceOverride.toString());
    } else if (ticker.lastPrice > 0) {
      if (orderType === 'MARKET') {
        setPriceInput(ticker.lastPrice.toString());
      } else if (!priceInput) {
        setPriceInput(ticker.lastPrice.toString());
      }
    }
  }, [ticker.lastPrice, selectedPriceOverride, orderType, pair, side, priceInput]);

  const currentPrice = orderType === 'MARKET' ? ticker.lastPrice : (parseFloat(priceInput) || ticker.lastPrice || 1);

  // Recalculate amount based on percentage of available balance
  const handlePercentageChange = (pct: number) => {
    setPercentage(pct);
    setLastEditedField('AMOUNT');
    if (side === 'BUY') {
      const totalUsdtToUse = availableUsdt * (pct / 100);
      setTotalInput(totalUsdtToUse.toFixed(2));
      if (currentPrice > 0) {
        const calculatedAmount = totalUsdtToUse / currentPrice;
        setAmountInput(calculatedAmount.toFixed(6));
      }
    } else {
      let calculatedAmount = availableBaseAsset * (pct / 100);
      if (pct === 100) {
        // Deduct a tiny reserved amount (0.15% cushion) anonymously for price changes in delay time
        calculatedAmount = availableBaseAsset * 0.9985;
      }
      setAmountInput(calculatedAmount.toFixed(6));
      setTotalInput((calculatedAmount * currentPrice).toFixed(2));
    }
  };

  const amount = lastEditedField === 'TOTAL' 
    ? (parseFloat(totalInput) || 0) / currentPrice 
    : (parseFloat(amountInput) || 0);
  const totalUsdt = lastEditedField === 'AMOUNT'
    ? amount * currentPrice
    : (parseFloat(totalInput) || 0);

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || currentPrice <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    let finalAmount = amount;
    let finalTotal = totalUsdt;

    if (side === 'SELL') {
      // If the user wants to sell their entire holdings (percentage === 100 or amount >= 99.9% of full balance)
      // we anonymously deduct a tiny reserve cushion (0.15%) in the background to handle price feed delays and precision variances
      if (percentage === 100 || amount >= availableBaseAsset * 0.999) {
        const reserveRatio = 0.0015; // 0.15% safety reserve
        const safeMax = availableBaseAsset * (1 - reserveRatio);
        if (finalAmount > safeMax) {
          finalAmount = Number(safeMax.toFixed(6));
          finalTotal = Number((finalAmount * currentPrice).toFixed(2));
        }
      }
    }

    setIsSubmitting(true);
    try {
      await onExecuteTrade({
        side,
        type: orderType,
        price: orderType === 'MARKET' ? ticker.lastPrice : currentPrice,
        amount: finalAmount,
        total: finalTotal
      });

      // Reset inputs after trade
      setAmountInput('');
      setTotalInput('');
      setPercentage(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBuy = side === 'BUY';

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col justify-between h-full">
      {/* Side Tabs: BUY / SELL */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/60 border border-border rounded-xl">
          <button
            type="button"
            onClick={() => {
              setSide('BUY');
              setPercentage(0);
              setAmountInput('');
              setTotalInput('');
              if (orderType === 'LIMIT' && ticker.lastPrice > 0) {
                setPriceInput(ticker.lastPrice.toString());
              }
            }}
            className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              isBuy 
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Buy {symbol}
          </button>
          <button
            type="button"
            onClick={() => {
              setSide('SELL');
              setPercentage(0);
              setAmountInput('');
              setTotalInput('');
              if (orderType === 'LIMIT' && ticker.lastPrice > 0) {
                setPriceInput(ticker.lastPrice.toString());
              }
            }}
            className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              !isBuy 
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sell {symbol}
          </button>
        </div>

        {/* Order Type Toggle: LIMIT / MARKET */}
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setOrderType('MARKET');
                if (ticker.lastPrice > 0) {
                  setPriceInput(ticker.lastPrice.toString());
                }
              }}
              className={`text-xs font-bold transition-colors ${
                orderType === 'MARKET' 
                  ? 'text-primary border-b-2 border-primary pb-1' 
                  : 'text-muted-foreground hover:text-foreground pb-1'
              }`}
            >
              Market Order
            </button>
            <button
              type="button"
              onClick={() => {
                setOrderType('LIMIT');
                if (ticker.lastPrice > 0) {
                  setPriceInput(ticker.lastPrice.toString());
                }
              }}
              className={`text-xs font-bold transition-colors ${
                orderType === 'LIMIT' 
                  ? 'text-primary border-b-2 border-primary pb-1' 
                  : 'text-muted-foreground hover:text-foreground pb-1'
              }`}
            >
              Limit Order
            </button>
          </div>

          <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
            <Wallet size={12} className="text-primary" />
            <span>Avail:</span>
            <span className="font-mono text-foreground">
              {isBuy 
                ? `$${availableUsdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `${availableBaseAsset.toFixed(4)} ${symbol}`}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Price Input (Disabled if Market Order) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <span>{orderType === 'MARKET' ? 'Mark Price' : 'Limit Price'}</span>
              </label>
              <span className="text-foreground font-mono text-[10px]">USDT</span>
            </div>

            <div className="relative">
              <input
                type="number"
                step="any"
                disabled={orderType === 'MARKET'}
                value={orderType === 'MARKET' ? ticker.lastPrice || '' : priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder="0.00"
                className={`w-full bg-muted border border-border focus:border-primary/50 rounded-xl px-3 py-2 text-xs font-mono font-bold text-foreground focus:outline-none ${
                  orderType === 'MARKET' ? 'opacity-90 bg-muted/40 cursor-not-allowed' : ''
                }`}
              />
              {orderType === 'MARKET' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-500 uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  Mark Price (${ticker.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                </span>
              )}
            </div>
          </div>

                    {/* Amount Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider flex justify-between">
              <span>Amount</span>
              <span className="text-foreground font-mono">{symbol}</span>
            </label>
            <input
              type="number"
              step="any"
              value={lastEditedField === 'AMOUNT' ? amountInput : (totalInput ? ((parseFloat(totalInput) || 0) / currentPrice).toFixed(6).replace(/\.?0+$/, '') : '')}
              onChange={(e) => {
                setAmountInput(e.target.value);
                setLastEditedField('AMOUNT');
                setPercentage(0);
              }}
              placeholder="0.00"
              className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary/50"
            />
          </div>

          {/* Percentage Quick Selector Buttons */}
          <div className="grid grid-cols-4 gap-1.5">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handlePercentageChange(pct)}
                className={`py-1 rounded-lg text-[10px] font-black transition-all border ${
                  percentage === pct
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* Total USDT Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider flex justify-between">
              <span>Total Value</span>
              <span className="text-foreground font-mono">USDT</span>
            </label>
            <input
              type="number"
              step="any"
              value={lastEditedField === 'TOTAL' ? totalInput : (amountInput ? (parseFloat(amountInput) * currentPrice).toFixed(2).replace(/\.00$/, '') : '')}
              onChange={(e) => {
                setTotalInput(e.target.value);
                setLastEditedField('TOTAL');
                setPercentage(0);
              }}
              placeholder="0.00"
              className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary/50"
            />
          </div>
          {/* Execution Button */}
          <button
            type="submit"
            disabled={isSubmitting || amount <= 0 || (isBuy && totalUsdt > availableUsdt) || (!isBuy && amount > availableBaseAsset)}
            className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-98 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 ${
              isBuy 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20' 
                : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
            }`}
          >
            {isSubmitting ? (
              <span>Processing Order...</span>
            ) : (
              <>
                <Zap size={14} />
                <span>
                  {orderType === 'MARKET' 
                    ? (isBuy ? `Market Buy ${symbol} @ Mark Price` : `Market Sell ${symbol} @ Mark Price`)
                    : (isBuy ? `Place Limit Buy (${symbol})` : `Place Limit Sell (${symbol})`)}
                </span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Security Tag */}
      <div className="pt-3 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <ShieldCheck size={12} className="text-emerald-500" />
          <span>Spot Matching Engine Active</span>
        </div>
        <span className="font-mono font-bold text-foreground uppercase">
          {orderType === 'MARKET' ? 'Instant Settlement' : 'Open Order Escrow'}
        </span>
      </div>
    </div>
  );
};


