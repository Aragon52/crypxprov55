import { supabase } from '@/integrations/supabase/client';
import { tokenPriceControl } from './tokenPriceControl';

export interface MarketTicker {
  lastPrice: number;
  priceChangePercent: number;
}

export interface MarketData {
  pair: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  category: string[];
}

const cachedPrices: Record<string, number> = {};

const FAKE_SYMBOLS = [
  "AUR", "VTX", "NEX", "GLX", "PHX", "ZEL", "CRY", "ION", "NOVA", "LYN",
  "NAS", "AEP", "ECB", "BOT", "TTZS", "OCT", "CFR", "STC", "CFT", "RTV", "JOE", "REO", "BEX", "RYR", "OAS", "JTC"
];
const TRADFI_SYMBOLS = [
  "CPX", "ARTS", "AXG", "BGNX", "VOLT", "QCORE", "CYBR", "OMNI", "CINE", "TFRA",
  "AAPL", "TSLA", "NVDA", "AMZN", "MSFT", "GOOGL", "META", "NFLX", "AMD", "COIN", "MSTR", "SPY", "VIX", "GOLD", "SILVER", "OIL"
];

const generateRandomPrice = (symbol: string) => {
  // Check if we already have a session-stable price or just generate new
  // To avoid extreme flickering on every call, we can use a small random walk if already exists
  const fallback = FALLBACK_PRICES[symbol] || 100;
  const base = cachedPrices[symbol] || fallback;
  const change = (Math.random() * 0.02) - 0.01; // +/- 1%
  const newPrice = Math.max(1, base * (1 + change));
  cachedPrices[symbol] = newPrice;
  return newPrice;
};

const FALLBACK_PRICES: Record<string, number> = {
  // Major
  BTC: 89500, ETH: 4850, BNB: 820, SOL: 245, XRP: 1.45, ADA: 0.85, 
  LINK: 45.2, DOT: 12.4, AVAX: 88.5, MATIC: 1.25, DOGE: 0.28, 
  SHIB: 0.000045, PEPE: 0.000025, WIF: 8.4, NEAR: 12.1, APT: 18.3,
  UNI: 15.2, AAVE: 285.0, MKR: 4200.0, CRV: 1.15, LDO: 4.8,
  AXS: 12.5, SAND: 1.85, MANA: 2.1, IMX: 4.5, APE: 3.2,
  
  // Binance Popular & Alpha Minors
  SUI: 3.12, SEI: 0.65, FTM: 1.18, OP: 3.82, ARB: 1.45, POL: 0.58, 
  TRX: 0.165, LTC: 110.5, ETC: 32.4, BCH: 510.2, ATOM: 9.8, ALGO: 0.28, 
  HBAR: 0.115, VET: 0.042, BONK: 0.00003102, FLOKI: 0.000244, BOME: 0.0125,
  POPCAT: 1.85, MEME: 0.0185, BRETT: 0.145, FTT: 105.93, LUNC: 0.000108,
  USTC: 0.0245, ALPHA: 0.138, TRU: 0.125, UNFI: 4.25, GAS: 5.82, 
  LOOM: 0.082, PHB: 2.15, KEY: 0.0068, REEF: 0.00195, LINA: 0.0084,
  FET: 1.68, RENDER: 7.82, WLD: 3.42, GRT: 0.265, JASMY: 0.0285, 
  GALA: 0.045, CHZ: 0.108, FIL: 5.65, ICP: 14.8,
  
  // Custom Layer-2 & Alpha Sample Training Tokens
  NAS: 92.54,
  AEP: 84.97,
  ECB: 89.32,
  BOT: 123.50,
  TTZS: 131.75,
  OCT: 101.94,
  CFR: 127.78,
  STC: 132.22,
  CFT: 131.81,
  RTV: 140.62,
  JOE: 140.52,
  REO: 111.31,
  BEX: 128.30,
  RYR: 120.27,
  OAS: 110.45,
  JTC: 66.81,

  // Alpha (Platform Custom)
  AUR: 12.5, VTX: 4.8, NEX: 0.95, GLX: 22.4, PHX: 1.25, ZEL: 0.45, 
  CRY: 8.5, ION: 1.15, NOVA: 0.85, LYN: 0.35, USDT: 1,
  
  // Stocks & Commodities
  CPX: 285.5, ARTS: 164.2, AXG: 215.8, BGNX: 92.4, VOLT: 148.6,
  QCORE: 312.0, CYBR: 185.3, OMNI: 230.1, CINE: 78.9, TFRA: 112.5,
  AAPL: 245.5, TSLA: 310.4, NVDA: 138.2, AMZN: 212.8, MSFT: 425.6, GOOGL: 178.5,
  META: 585.3, NFLX: 860.2, AMD: 122.4, COIN: 320.1, MSTR: 340.5,
  SPY: 582.2, VIX: 12.5, GOLD: 2650.5, SILVER: 31.8, OIL: 78.4
};

let ws: WebSocket | null = null;
const wsListeners: Set<(data: any) => void> = new Set();
const allTickerListeners: Set<(tickers: Record<string, { price: number; change24h: number; high24h?: number; low24h?: number; volume24h?: number }>) => void> = new Set();
let syncInterval: any = null;
let customSimInterval: any = null;
let detectedUsDomain = false;
let isFetchingRest = false;

const cached24hStats: Record<string, MarketTicker> = {};

const getApiDomain = () => {
  return detectedUsDomain ? 'api.binance.us' : 'api.binance.com';
};

const getWsDomain = () => {
  return detectedUsDomain ? 'stream.binance.us:9443' : 'stream.binance.com:9443';
};

const fetchBinance = async (endpoint: string, options?: any): Promise<Response | null> => {
  const domains = detectedUsDomain 
    ? ['api.binance.us', 'api.binance.com'] 
    : ['api.binance.com', 'api.binance.us'];
    
  for (const domain of domains) {
    try {
      const url = `https://${domain}${endpoint}`;
      const response = await fetch(url, options);
      if (response && response.ok) {
        if (domain === 'api.binance.us' && !detectedUsDomain) {
          console.warn("Switched to Binance.US API for live open-source market prices.");
          detectedUsDomain = true;
          if (ws) {
            try { ws.close(); } catch (e) { console.debug("Error recycling WS:", e); }
            ws = null;
            setTimeout(initWebSocket, 200);
          }
        }
        return response;
      }
    } catch {
      // Ignore individual domain attempt errors
    }
  }
  return null;
};

// Fetch prices from open source backup (CoinCap API) if Binance is unreachable
const fetchCoinCapBackup = async () => {
  try {
    const res = await fetch('https://api.coincap.io/v2/assets?limit=100');
    if (!res.ok) return false;
    const json = await res.json();
    if (json && Array.isArray(json.data)) {
      const liveUpdates: Record<string, { price: number; change24h: number }> = {};
      json.data.forEach((asset: any) => {
        const sym = asset.symbol?.toUpperCase();
        const price = parseFloat(asset.priceUsd);
        const change = parseFloat(asset.changePercent24Hr);
        if (sym && !isNaN(price)) {
          cachedPrices[sym] = price;
          cachedPrices[sym + 'USDT'] = price;
          cached24hStats[sym] = {
            lastPrice: price,
            priceChangePercent: isNaN(change) ? 0 : change
          };
          liveUpdates[`${sym}/USDT`] = { price, change24h: isNaN(change) ? 0 : change };
          
          wsListeners.forEach(listener => listener({
            s: sym + 'USDT',
            c: price.toString(),
            as: sym
          }));
        }
      });
      allTickerListeners.forEach(l => l(liveUpdates));
      return true;
    }
  } catch (e) {
    // Silent fail over to other feeds
  }
  return false;
};

// Sync live prices synchronously from reliable open-source APIs
const syncOpenSourcePrices = async () => {
  if (isFetchingRest) return;
  isFetchingRest = true;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetchBinance('/api/v3/ticker/24hr', { 
      signal: controller.signal 
    }).finally(() => clearTimeout(timeoutId));

    if (response && response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        const liveUpdates: Record<string, { price: number; change24h: number; high24h?: number; low24h?: number; volume24h?: number }> = {};
        
        data.forEach((item: any) => {
          if (typeof item.symbol === 'string' && item.symbol.endsWith('USDT')) {
            const sym = item.symbol.replace('USDT', '');
            const price = parseFloat(item.lastPrice);
            const change = parseFloat(item.priceChangePercent);
            const high = parseFloat(item.highPrice);
            const low = parseFloat(item.lowPrice);
            const volume = parseFloat(item.quoteVolume);
            
            if (!isNaN(price) && price > 0) {
              const controlled = tokenPriceControl.getControlledPrice(sym, 0);
              const finalPrice = controlled.isControlled ? controlled.price : price;
              
              cachedPrices[sym] = finalPrice;
              cachedPrices[item.symbol] = finalPrice;
              cached24hStats[sym] = {
                lastPrice: finalPrice,
                priceChangePercent: controlled.isControlled ? 0 : (isNaN(change) ? 0 : change)
              };

              liveUpdates[`${sym}/USDT`] = {
                price: finalPrice,
                change24h: isNaN(change) ? 0 : change,
                high24h: high,
                low24h: low,
                volume24h: volume
              };

              // Broadcast tick
              wsListeners.forEach(listener => listener({
                s: item.symbol,
                c: finalPrice.toString(),
                as: sym,
                P: change?.toString() || '0'
              }));
            }
          }
        });

        allTickerListeners.forEach(listener => listener(liveUpdates));
      }
    } else {
      await fetchCoinCapBackup();
    }
  } catch (err) {
    // Attempt fallback to CoinCap API
    await fetchCoinCapBackup();
  } finally {
    isFetchingRest = false;
  }
};

// Simulate ONLY custom mock app tokens (never modify real tokens like BTC, ETH, USDT, DOGE)
const startCustomTokensSimulation = () => {
  if (customSimInterval || typeof window === 'undefined') return;
  
  customSimInterval = setInterval(() => {
    // Only walk custom mock & alpha tokens
    FAKE_SYMBOLS.forEach(sym => {
      const current = cachedPrices[sym] || FALLBACK_PRICES[sym] || 100;
      const controlled = tokenPriceControl.getControlledPrice(sym, current);
      
      let nextPrice = current;
      if (controlled.isControlled) {
        nextPrice = controlled.price;
      } else {
        const pct = (Math.random() * 0.0006) - 0.0003;
        nextPrice = parseFloat((current * (1 + pct)).toFixed(4));
      }

      cachedPrices[sym] = nextPrice;
      cachedPrices[sym + 'USDT'] = nextPrice;
      
      wsListeners.forEach(listener => {
        listener({
          s: sym + 'USDT',
          c: nextPrice.toString(),
          as: sym
        });
      });
    });
  }, 1200);
};

const initWebSocket = () => {
  if (ws || typeof window === 'undefined') return;
  
  try {
    const domain = getWsDomain();
    // Use the comprehensive miniTicker array stream which streams ALL pairs in real-time synchronously
    const wsUrl = `wss://${domain}/ws/!miniTicker@arr`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data)) {
          const liveUpdates: Record<string, { price: number; change24h: number }> = {};
          
          data.forEach(item => {
            if (item.s && item.s.endsWith('USDT') && item.c) {
              const sym = item.s.replace('USDT', '');
              const price = parseFloat(item.c);
              if (!isNaN(price) && price > 0) {
                const controlled = tokenPriceControl.getControlledPrice(sym, 0);
                const finalPrice = controlled.isControlled ? controlled.price : price;
                
                cachedPrices[sym] = finalPrice;
                cachedPrices[item.s] = finalPrice;
                
                liveUpdates[`${sym}/USDT`] = { 
                  price: finalPrice, 
                  change24h: cached24hStats[sym]?.priceChangePercent || 0 
                };

                wsListeners.forEach(listener => listener({
                  s: item.s,
                  c: finalPrice.toString(),
                  as: sym
                }));
              }
            }
          });

          if (Object.keys(liveUpdates).length > 0) {
            allTickerListeners.forEach(listener => listener(liveUpdates));
          }
        } else if (data.s && data.c) {
          const sym = data.s.replace('USDT', '');
          const price = parseFloat(data.c);
          if (!isNaN(price) && price > 0) {
            cachedPrices[sym] = price;
            cachedPrices[data.s] = price;
            wsListeners.forEach(listener => listener(data));
          }
        }
      } catch (err) {
        // Safe json parse handling
      }
    };
    
    ws.onerror = () => {
      if (!detectedUsDomain) {
        detectedUsDomain = true;
        if (ws) {
          try { ws.close(); } catch (e) { console.debug("Error on WS fallback:", e); }
          ws = null;
        }
        setTimeout(initWebSocket, 500);
      }
    };
    
    ws.onclose = () => {
      ws = null;
      setTimeout(initWebSocket, 4000); // Reconnect
    };
    
  } catch (err) {
    console.error("WS Init Error:", err);
  }
};

export const marketService = {
  init: () => {
    initWebSocket();
    startCustomTokensSimulation();
    syncOpenSourcePrices();
    
    // Maintain regular synchronous polling so all pairs stay fresh even without WS
    if (!syncInterval && typeof window !== 'undefined') {
      syncInterval = setInterval(syncOpenSourcePrices, 2500);
    }
  },
  
  getCurrentPrice: (symbol: string): number => {
    if (!ws) initWebSocket();
    const s = symbol.replace('USDT', '').replace('/', '').toUpperCase();
    if (s === 'USDT') return 1;
    
    const fallback = cachedPrices[s] || FALLBACK_PRICES[s] || (FAKE_SYMBOLS.includes(s) ? generateRandomPrice(s) : 0);
    const controlled = tokenPriceControl.getControlledPrice(s, fallback);
    if (controlled.isControlled) {
      cachedPrices[s] = controlled.price;
      return controlled.price;
    }
    if (FAKE_SYMBOLS.includes(s) || TRADFI_SYMBOLS.includes(s)) {
      if (!cachedPrices[s]) cachedPrices[s] = FALLBACK_PRICES[s] || generateRandomPrice(s);
      return cachedPrices[s];
    }
    return cachedPrices[s] || cachedPrices[symbol] || FALLBACK_PRICES[s] || 0;
  },

  get24hTickerStats: async (symbols: string[]): Promise<Record<string, MarketTicker>> => {
    const stats: Record<string, MarketTicker> = {};
    
    // Seed with baseline data
    symbols.forEach(s => {
      const sym = s.replace('USDT', '');
      const defaultPrice = FAKE_SYMBOLS.includes(sym) ? generateRandomPrice(sym) : (FALLBACK_PRICES[sym] || 100);
      const fallbackP = cachedPrices[sym] || defaultPrice;
      const controlled = tokenPriceControl.getControlledPrice(sym, fallbackP);
      
      let pChange = cached24hStats[sym]?.priceChangePercent || 0;
      if (controlled.isControlled) {
        const sch = tokenPriceControl.getSchedule(sym);
        const startP = sch ? sch.startPrice : (FALLBACK_PRICES[sym] || defaultPrice);
        pChange = startP > 0 ? parseFloat((((controlled.price - startP) / startP) * 100).toFixed(2)) : 0;
      }

      stats[s] = {
        lastPrice: controlled.isControlled ? controlled.price : fallbackP,
        priceChangePercent: pChange
      };
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetchBinance('/api/v3/ticker/24hr', { 
        signal: controller.signal 
      }).finally(() => clearTimeout(timeoutId));
      
      if (response && response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          data.forEach(item => {
            if (symbols.includes(item.symbol)) {
              const sym = item.symbol.replace('USDT', '');
              const controlled = tokenPriceControl.getControlledPrice(sym, 0);
              
              if (controlled.isControlled) {
                const sch = tokenPriceControl.getSchedule(sym);
                const startP = sch ? sch.startPrice : (FALLBACK_PRICES[sym] || 100);
                stats[item.symbol] = {
                  lastPrice: controlled.price,
                  priceChangePercent: startP > 0 ? parseFloat((((controlled.price - startP) / startP) * 100).toFixed(2)) : 0
                };
              } else {
                const lastPrice = parseFloat(item.lastPrice);
                const priceChangePercent = parseFloat(item.priceChangePercent);
                if (!isNaN(lastPrice)) {
                  stats[item.symbol] = {
                    lastPrice,
                    priceChangePercent: isNaN(priceChangePercent) ? 0 : priceChangePercent
                  };
                  cachedPrices[sym] = lastPrice;
                  cached24hStats[sym] = stats[item.symbol];
                }
              }
            }
          });
        }
      }
    } catch (err) {
      // Return cached stats
    }
    
    return stats;
  },

  getPrices: async (): Promise<Record<string, number>> => {
    const prices: Record<string, number> = { ...FALLBACK_PRICES, USDT: 1 };
    
    // Apply cache
    Object.keys(cachedPrices).forEach(k => {
      prices[k] = cachedPrices[k];
    });

    // Apply alpha coins
    [...FAKE_SYMBOLS, ...TRADFI_SYMBOLS].forEach(s => {
      if (!cachedPrices[s]) cachedPrices[s] = FALLBACK_PRICES[s] || generateRandomPrice(s);
      prices[s] = cachedPrices[s];
    });

    // Override with active admin controlled prices
    Object.keys(FALLBACK_PRICES).forEach(s => {
      const controlled = tokenPriceControl.getControlledPrice(s, cachedPrices[s] || FALLBACK_PRICES[s]);
      if (controlled.isControlled) {
        prices[s] = controlled.price;
        cachedPrices[s] = controlled.price;
      }
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetchBinance('/api/v3/ticker/price', { 
        signal: controller.signal 
      }).finally(() => clearTimeout(timeoutId));
      
      if (response && response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          data.forEach((item: { symbol: string; price: string }) => {
            if (item.symbol.endsWith('USDT')) {
              const s = item.symbol.replace('USDT', '');
              const p = parseFloat(item.price);
              if (!isNaN(p)) {
                prices[s] = p;
                cachedPrices[s] = p;
              }
            }
          });
        }
      }
    } catch (error) {
      // Return cached prices
    }
    
    return prices;
  },

  getAllMarkets: async (): Promise<MarketData[]> => {
    const symbols = [
      "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", "ADAUSDT", "LINKUSDT", "DOTUSDT",
      "AVAXUSDT", "MATICUSDT", "DOGEUSDT", "SHIBUSDT", "PEPEUSDT", "WIFUSDT", "NEARUSDT", "APTUSDT",
      "UNIUSDT", "AAVEUSDT", "MKRUSDT", "CRVUSDT", "LDOUSDT",
      "AXSUSDT", "SANDUSDT", "MANAUSDT", "IMXUSDT", "APEUSDT",
      // Popular Layer 1 & 2 chains
      "SUIUSDT", "SEIUSDT", "FTMUSDT", "OPUSDT", "ARBUSDT", "POLUSDT", "TRXUSDT", "LTCUSDT",
      "ETCUSDT", "BCHUSDT", "ATOMUSDT", "ALGOUSDT", "HBARUSDT", "VETUSDT",
      // AI & Trend tokens
      "FETUSDT", "RENDERUSDT", "WLDUSDT", "GRTUSDT",
      // Meme / Minor popular coins
      "BONKUSDT", "FLOKIUSDT", "BOMEUSDT", "POPCATUSDT", "MEMEUSDT", "BRETTUSDT",
      // Speculative & Alpha DeFi
      "FTTUSDT", "LUNCUSDT", "USTCUSDT", "ALPHAUSDT", "TRUUSDT", "UNFIUSDT", "GASUSDT", 
      "LOOMUSDT", "PHBUSDT", "KEYUSDT", "REEFUSDT", "LINAUSDT", "JASMYUSDT", "GALAUSDT", 
      "CHZUSDT", "FILUSDT", "ICPUSDT",
      ...FAKE_SYMBOLS.map(s => s + "USDT"),
      ...TRADFI_SYMBOLS.map(s => s + "USDT")
    ];
    
    const getCategory = (symbol: string): string[] => {
      const s = symbol.replace("USDT", "");
      const cats = ["All"];
      cats.push(s);
      
      if (["SOL", "AVAX", "NEAR", "APT", "ADA", "DOT", "SUI", "SEI", "FTM", "OP", "ARB", "POL", "TRX", "LTC", "ETC", "BCH", "ATOM", "ALGO", "HBAR", "VET"].includes(s)) cats.push("Layer 1");
      if (["OP", "ARB", "NAS", "AEP", "ECB", "BOT", "TTZS", "OCT", "CFR", "STC", "CFT", "RTV", "JOE", "REO", "BEX", "RYR", "OAS", "JTC"].includes(s)) cats.push("Layer-2");
      if (["DOGE", "SHIB", "PEPE", "WIF", "BONK", "FLOKI", "BOME", "POPCAT", "MEME", "BRETT"].includes(s)) cats.push("Meme");
      if (["UNI", "AAVE", "MKR", "CRV", "LDO", "FET", "RENDER", "WLD", "GRT", "JASMY", "GALA", "CHZ", "FIL", "ICP", "FTT", "LUNC", "USTC", "ALPHA", "TRU", "UNFI", "GAS", "LOOM", "PHB", "KEY", "REEF", "LINA"].includes(s)) cats.push("DeFi");
      if (["FET", "RENDER", "WLD", "GRT"].includes(s)) cats.push("AI");
      if (["AXS", "SAND", "MANA", "IMX", "APE"].includes(s)) cats.push("NFT");
      if (FAKE_SYMBOLS.includes(s)) {
        cats.push("Main");
        cats.push("Alpha");
      }
      if (TRADFI_SYMBOLS.includes(s)) {
        cats.push("TradFi");
        cats.push("Stocks & Commodities");
      }
      
      return cats;
    };

    const markets: MarketData[] = [];

    // Pre-populate with baseline/cached data
    symbols.forEach(s => {
      const sym = s.replace("USDT", "");
      const baseP = cachedPrices[sym] || FALLBACK_PRICES[sym] || generateRandomPrice(sym);
      const controlled = tokenPriceControl.getControlledPrice(sym, baseP);
      const p = controlled.isControlled ? controlled.price : baseP;
      let pChange = cached24hStats[sym]?.priceChangePercent || 0;
      if (controlled.isControlled) {
        const sch = tokenPriceControl.getSchedule(sym);
        const startP = sch ? sch.startPrice : (FALLBACK_PRICES[sym] || baseP);
        pChange = startP > 0 ? parseFloat((((p - startP) / startP) * 100).toFixed(2)) : 0;
      }
      markets.push({
        pair: `${sym}/USDT`,
        price: p,
        change24h: pChange,
        high24h: p * 1.02,
        low24h: p * 0.98,
        volume24h: 100000 + (Math.random() * 500000),
        category: getCategory(s)
      });
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetchBinance('/api/v3/ticker/24hr', { 
        signal: controller.signal 
      }).finally(() => clearTimeout(timeoutId));
      
      if (response && response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            if (symbols.includes(item.symbol)) {
              const sym = item.symbol.replace("USDT", "");
              const controlled = tokenPriceControl.getControlledPrice(sym, 0);
              
              if (controlled.isControlled) {
                const sch = tokenPriceControl.getSchedule(sym);
                const startP = sch ? sch.startPrice : (FALLBACK_PRICES[sym] || 100);
                const idx = markets.findIndex(m => m.pair === `${sym}/USDT`);
                if (idx !== -1) {
                  markets[idx].price = controlled.price;
                  markets[idx].change24h = startP > 0 ? parseFloat((((controlled.price - startP) / startP) * 100).toFixed(2)) : 0;
                }
                return;
              }

              const pair = item.symbol.replace("USDT", "/USDT");
              const idx = markets.findIndex(m => m.pair === pair);
              const lastPrice = parseFloat(item.lastPrice);
              
              if (!isNaN(lastPrice)) {
                const mData = {
                  pair: pair,
                  price: lastPrice,
                  change24h: parseFloat(item.priceChangePercent) || 0,
                  high24h: parseFloat(item.highPrice) || lastPrice,
                  low24h: parseFloat(item.lowPrice) || lastPrice,
                  volume24h: parseFloat(item.quoteVolume) || 0,
                  category: getCategory(item.symbol)
                };
                
                if (idx !== -1) {
                  markets[idx] = mData;
                } else {
                  markets.push(mData);
                }
                
                cachedPrices[item.symbol.replace("USDT", "")] = lastPrice;
                cached24hStats[item.symbol.replace("USDT", "")] = {
                  lastPrice,
                  priceChangePercent: parseFloat(item.priceChangePercent) || 0
                };
              }
            }
          });
        }
      }
    } catch (error) {
      // Fallback data already populated
    }
    
    return markets.sort((a, b) => b.volume24h - a.volume24h);
  },

  getHistoricalData: async (pair: string, interval: string = '1h', limit: number = 100) => {
    const now = Math.floor(Date.now() / 1000);
    const data = [];
    let price = 50000;
    
    if (pair) {
      const s = pair.replace('/USDT', '').replace('USDT', '');
      price = marketService.getCurrentPrice(s) || 50000;
    }

    const stepMap: Record<string, number> = {
      '5s': 5,
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '1h': 3600,
      '4h': 14400,
      '1d': 86400
    };
    const step = stepMap[interval] || 3600;
    const alignedNow = Math.floor(now / step) * step;
    
    for (let i = limit; i >= 0; i--) {
      const open = price + (Math.random() * (price * 0.006) - (price * 0.003));
      const close = price + (Math.random() * (price * 0.006) - (price * 0.003));
      data.push({
        time: alignedNow - i * step,
        open: open,
        high: Math.max(open, close) + Math.random() * (price * 0.001),
        low: Math.min(open, close) - Math.random() * (price * 0.001),
        close: close,
      });
      price = close;
    }
    return data;
  },

  subscribeToTicker: (symbol: string, callback: (price: number) => void) => {
    const sym = symbol.replace('USDT', '').replace('/', '').toUpperCase();
    
    const listener = (data: any) => {
      if (data.s === sym + 'USDT' || data.as === sym) {
        const price = parseFloat(data.c);
        if (!isNaN(price)) callback(price);
      }
    };
    
    wsListeners.add(listener);
    
    return () => {
      wsListeners.delete(listener);
    };
  },

  subscribeToAllTickers: (callback: (tickers: Record<string, { price: number; change24h: number; high24h?: number; low24h?: number; volume24h?: number }>) => void) => {
    allTickerListeners.add(callback);
    return () => {
      allTickerListeners.delete(callback);
    };
  }
};
