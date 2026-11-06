import { useState, useEffect, useRef } from 'react';
import { MarketData, marketService } from '@/services/market';

export interface RealtimePrice {
  price: number;
  direction: 'up' | 'down' | null;
  change24h?: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
}

export const useRealtimePrices = (initialMarkets: MarketData[]) => {
  const [prices, setPrices] = useState<Record<string, RealtimePrice>>({});
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const prevPricesRef = useRef<Record<string, number>>({});

  // Seed with initial markets
  useEffect(() => {
    if (!initialMarkets || initialMarkets.length === 0) return;
    
    setPrices(prev => {
      const next = { ...prev };
      let changed = false;
      
      initialMarkets.forEach(m => {
        const oldPrice = prevPricesRef.current[m.pair] ?? prev[m.pair]?.price;
        prevPricesRef.current[m.pair] = m.price;
        
        if (!next[m.pair] || next[m.pair].price !== m.price) {
          const dir = oldPrice !== undefined && oldPrice !== m.price 
            ? (m.price > oldPrice ? 'up' : 'down') 
            : (prev[m.pair]?.direction ?? null);
            
          next[m.pair] = { 
            price: m.price, 
            direction: dir,
            change24h: m.change24h,
            high24h: m.high24h,
            low24h: m.low24h,
            volume24h: m.volume24h
          };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [initialMarkets]);

  // Subscribe to true real-time synchronous WebSocket and API price ticks
  useEffect(() => {
    marketService.init();

    const unsubscribe = marketService.subscribeToAllTickers((liveUpdates) => {
      setPrices(prev => {
        let changed = false;
        const next = { ...prev };

        Object.entries(liveUpdates).forEach(([pair, update]) => {
          const oldPrice = prevPricesRef.current[pair] ?? prev[pair]?.price;
          
          if (oldPrice !== update.price) {
            prevPricesRef.current[pair] = update.price;
            const direction: 'up' | 'down' = oldPrice !== undefined && update.price > oldPrice ? 'up' : 'down';
            
            next[pair] = {
              price: update.price,
              direction,
              change24h: update.change24h !== undefined ? update.change24h : prev[pair]?.change24h,
              high24h: update.high24h !== undefined ? update.high24h : prev[pair]?.high24h,
              low24h: update.low24h !== undefined ? update.low24h : prev[pair]?.low24h,
              volume24h: update.volume24h !== undefined ? update.volume24h : prev[pair]?.volume24h,
            };
            changed = true;

            // Clear direction highlight after 1.2s
            if (timeoutRefs.current[pair]) {
              clearTimeout(timeoutRefs.current[pair]);
            }
            timeoutRefs.current[pair] = setTimeout(() => {
              setPrices(p => {
                if (p[pair] && p[pair].direction !== null) {
                  return { ...p, [pair]: { ...p[pair], direction: null } };
                }
                return p;
              });
            }, 1200);
          }
        });

        return changed ? next : prev;
      });
    });

    const capturedTimeouts = timeoutRefs.current;
    return () => {
      unsubscribe();
      Object.values(capturedTimeouts).forEach(clearTimeout);
    };
  }, []);

  return prices;
};
