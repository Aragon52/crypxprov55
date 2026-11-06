import React, { useState, useEffect } from 'react';
import { marketService } from '@/services/market';
import { ArrowUpRight, ArrowDownRight, Layers, History } from 'lucide-react';

interface Order {
  price: number;
  amount: number;
  total: number;
}

interface RecentTrade {
  id: string;
  price: number;
  amount: number;
  time: string;
  side: 'BUY' | 'SELL';
}

interface EnhancedOrderBookProps {
  symbol: string;
  onSelectPrice?: (price: number) => void;
}

export const EnhancedOrderBook: React.FC<EnhancedOrderBookProps> = ({ symbol, onSelectPrice }) => {
  const [activeTab, setActiveTab] = useState<'book' | 'trades'>('book');
  const [bids, setBids] = useState<Order[]>([]);
  const [asks, setAsks] = useState<Order[]>([]);
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);

  useEffect(() => {
    const updateOrdersAndTrades = () => {
      const price = marketService.getCurrentPrice(symbol);
      if (price === 0) return;

      const newBids: Order[] = [];
      const newAsks: Order[] = [];

      // Generate 7 bids & asks around live price
      for (let i = 1; i <= 7; i++) {
        const bidPrice = price * (1 - (i * 0.00025));
        const bidAmt = Math.random() * 2.5 + 0.05;
        newBids.push({ price: bidPrice, amount: bidAmt, total: bidPrice * bidAmt });

        const askPrice = price * (1 + (i * 0.00025));
        const askAmt = Math.random() * 2.5 + 0.05;
        newAsks.push({ price: askPrice, amount: askAmt, total: askPrice * askAmt });
      }

      setBids(newBids);
      setAsks(newAsks.reverse());

      // Update recent trades
      const side: 'BUY' | 'SELL' = Math.random() > 0.48 ? 'BUY' : 'SELL';
      const tradePrice = price * (1 + (Math.random() * 0.0008 - 0.0004));
      const tradeAmt = Math.random() * 1.8 + 0.01;
      const tradeTime = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

      setRecentTrades(prev => [
        {
          id: Math.random().toString(36).substring(7),
          price: tradePrice,
          amount: tradeAmt,
          time: tradeTime,
          side
        },
        ...prev.slice(0, 14)
      ]);
    };

    updateOrdersAndTrades();
    const interval = setInterval(updateOrdersAndTrades, 2500);
    return () => clearInterval(interval);
  }, [symbol]);

  const currentPrice = marketService.getCurrentPrice(symbol);

  return (
    <div className="bg-card border border-border rounded-2xl p-3 shadow-sm flex flex-col h-full text-[10px] font-mono">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('book')}
            className={`flex items-center gap-1 font-bold transition-colors text-xs ${
              activeTab === 'book'
                ? 'text-primary border-b-2 border-primary pb-0.5'
                : 'text-muted-foreground hover:text-foreground pb-0.5'
            }`}
          >
            <Layers size={13} />
            <span>Order Book</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('trades')}
            className={`flex items-center gap-1 font-bold transition-colors text-xs ${
              activeTab === 'trades'
                ? 'text-primary border-b-2 border-primary pb-0.5'
                : 'text-muted-foreground hover:text-foreground pb-0.5'
            }`}
          >
            <History size={13} />
            <span>Market Trades</span>
          </button>
        </div>

        <span className="text-[9px] font-bold text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">
          Precision: 0.01
        </span>
      </div>

      {activeTab === 'book' ? (
        <div className="flex-1 overflow-hidden flex flex-col justify-between">
          <div className="grid grid-cols-3 text-muted-foreground font-bold pb-1 text-[9px] uppercase border-b border-border/50">
            <span>Price (USDT)</span>
            <span className="text-right">Size</span>
            <span className="text-right">Total</span>
          </div>

          {/* ASKS (Sells - Red) */}
          <div className="flex flex-col-reverse justify-end overflow-hidden space-y-0.5 py-1">
            {asks.map((order, i) => (
              <div
                key={i}
                onClick={() => onSelectPrice?.(order.price)}
                className="grid grid-cols-3 py-0.5 px-1 hover:bg-destructive/10 cursor-pointer group relative overflow-hidden rounded transition-colors"
                title="Click price to populate order form"
              >
                <div
                  className="absolute right-0 top-0 bottom-0 bg-destructive/10 transition-all pointer-events-none"
                  style={{ width: `${Math.min(100, order.amount * 35)}%` }}
                />
                <span className="text-rose-500 font-bold z-10">
                  {order.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-foreground text-right z-10">{order.amount.toFixed(4)}</span>
                <span className="text-muted-foreground text-right z-10">${order.total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* MID PRICE DISPLAY */}
          <div className="py-2 border-y border-border bg-muted/30 my-1 flex items-center justify-between px-2 rounded-lg">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-foreground">
                ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] font-bold text-emerald-500 flex items-center">
                <ArrowUpRight size={12} /> Live
              </span>
            </div>
            <span className="text-[9px] font-semibold text-muted-foreground uppercase">
              Spread 0.01%
            </span>
          </div>

          {/* BIDS (Buys - Green) */}
          <div className="flex flex-col justify-start overflow-hidden space-y-0.5 py-1">
            {bids.map((order, i) => (
              <div
                key={i}
                onClick={() => onSelectPrice?.(order.price)}
                className="grid grid-cols-3 py-0.5 px-1 hover:bg-emerald-500/10 cursor-pointer group relative overflow-hidden rounded transition-colors"
                title="Click price to populate order form"
              >
                <div
                  className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 transition-all pointer-events-none"
                  style={{ width: `${Math.min(100, order.amount * 35)}%` }}
                />
                <span className="text-emerald-500 font-bold z-10">
                  {order.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-foreground text-right z-10">{order.amount.toFixed(4)}</span>
                <span className="text-muted-foreground text-right z-10">${order.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* RECENT MARKET TRADES LIST */
        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-1">
          <div className="grid grid-cols-3 text-muted-foreground font-bold pb-1 text-[9px] uppercase border-b border-border/50">
            <span>Price (USDT)</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Time</span>
          </div>

          {recentTrades.map((trade) => (
            <div key={trade.id} className="grid grid-cols-3 py-1 px-1 hover:bg-muted/50 rounded">
              <span className={`font-bold flex items-center gap-0.5 ${
                trade.side === 'BUY' ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {trade.side === 'BUY' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                {trade.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-foreground text-right">{trade.amount.toFixed(4)}</span>
              <span className="text-muted-foreground text-right">{trade.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
