import React, { useState, useEffect } from 'react';
import { marketService } from '@/services/market';

interface Order {
  price: number;
  amount: number;
  total: number;
}

export const OrderBook = ({ symbol }: { symbol: string }) => {
  const [bids, setBids] = useState<Order[]>([]);
  const [asks, setAsks] = useState<Order[]>([]);

  useEffect(() => {
    // Simulated order book data based on live price
    const updateOrders = () => {
      const price = marketService.getCurrentPrice(symbol);
      if (price === 0) return;

      const newBids: Order[] = [];
      const newAsks: Order[] = [];

      for (let i = 1; i <= 8; i++) {
        const bidPrice = price * (1 - (i * 0.0002));
        const bidAmt = Math.random() * 2 + 0.1;
        newBids.push({ price: bidPrice, amount: bidAmt, total: bidPrice * bidAmt });

        const askPrice = price * (1 + (i * 0.0002));
        const askAmt = Math.random() * 2 + 0.1;
        newAsks.push({ price: askPrice, amount: askAmt, total: askPrice * askAmt });
      }

      setBids(newBids);
      setAsks(newAsks.reverse());
    };

    updateOrders();
    const interval = setInterval(updateOrders, 3000);
    return () => clearInterval(interval);
  }, [symbol]);

  return (
    <div className="flex flex-col h-full text-[10px] font-mono">
      <div className="flex justify-between text-muted-foreground mb-1 font-bold">
        <span>Price</span>
        <span>Amount</span>
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* ASKS */}
        <div className="flex flex-col-reverse mb-1">
          {asks.map((order, i) => (
            <div key={i} className="flex justify-between py-0.5 hover:bg-destructive/5 group relative overflow-hidden">
               <div className="absolute right-0 top-0 bottom-0 bg-destructive/10 transition-all" style={{ width: `${Math.min(100, order.amount * 40)}%` }} />
               <span className="text-destructive font-bold z-10">{order.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
               <span className="text-foreground z-10">{order.amount.toFixed(4)}</span>
            </div>
          ))}
        </div>

        {/* MID PRICE */}
        <div className="py-2 border-y border-border flex items-center justify-center">
          <div className="text-lg font-bold text-foreground">
            {marketService.getCurrentPrice(symbol).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* BIDS */}
        <div className="flex flex-col mt-1">
          {bids.map((order, i) => (
            <div key={i} className="flex justify-between py-0.5 hover:bg-green-500/5 group relative overflow-hidden">
               <div className="absolute right-0 top-0 bottom-0 bg-green-500/10 transition-all" style={{ width: `${Math.min(100, order.amount * 40)}%` }} />
               <span className="text-green-500 font-bold z-10">{order.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
               <span className="text-foreground z-10">{order.amount.toFixed(4)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderBook;
