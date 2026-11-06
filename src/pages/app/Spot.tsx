import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getFallbackUserProfile } from '@/contexts/AuthContext';
import { marketService, MarketTicker } from '@/services/market';
import { CryptoIcon } from '@/components/shared/CryptoIcon';
import TradingChart from '@/components/shared/TradingChart';
import type { UserProfile, UserAsset, SpotOrder } from '@/types';
import { 
  RefreshCw, X, ChevronDown, ArrowDown, Wallet, DollarSign, 
  TrendingUp, ArrowRightLeft, SlidersHorizontal
, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// Spot Components
import { TokenPairSelector } from '@/components/spot/TokenPairSelector';
import { SpotOrderForm } from '@/components/spot/SpotOrderForm';
import { EnhancedOrderBook } from '@/components/spot/EnhancedOrderBook';
import { TransactionHistory } from '@/components/spot/TransactionHistory';
import { SpotWalletBox } from '@/components/spot/SpotWalletBox';

const SYMBOLS_LIST = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 
  'LINKUSDT', 'DOTUSDT', 'AVAXUSDT', 'MATICUSDT', 'DOGEUSDT', 'SHIBUSDT',
  'PEPEUSDT', 'WIFUSDT', 'NEARUSDT', 'APTUSDT', 'UNIUSDT', 'AAVEUSDT', 
  'MKRUSDT', 'CRVUSDT', 'LDOUSDT', 'AXSUSDT', 'SANDUSDT', 'MANAUSDT', 
  'IMXUSDT', 'APEUSDT',
  // Layer-2 & Alpha Sample Training Pairs
  'NASUSDT', 'AEPUSDT', 'ECBUSDT', 'BOTUSDT', 'TTZSUSDT', 'OCTUSDT',
  'CFRUSDT', 'STCUSDT', 'CFTUSDT', 'RTVUSDT', 'JOEUSDT', 'REOUSDT',
  'BEXUSDT', 'RYRUSDT', 'OASUSDT', 'JTCUSDT',
  // Popular Layer 1 & 2
  'SUIUSDT', 'SEIUSDT', 'FTMUSDT', 'OPUSDT', 'ARBUSDT', 'POLUSDT', 'TRXUSDT', 'LTCUSDT',
  'ETCUSDT', 'BCHUSDT', 'ATOMUSDT', 'ALGOUSDT', 'HBARUSDT', 'VETUSDT',
  // AI & Trend tokens
  'FETUSDT', 'RENDERUSDT', 'WLDUSDT', 'GRTUSDT',
  // Meme & Popular
  'BONKUSDT', 'FLOKIUSDT', 'BOMEUSDT', 'POPCATUSDT', 'MEMEUSDT', 'BRETTUSDT',
  // Speculative & Alpha DeFi
  'FTTUSDT', 'LUNCUSDT', 'USTCUSDT', 'ALPHAUSDT', 'TRUUSDT', 'UNFIUSDT', 'GASUSDT', 
  'LOOMUSDT', 'PHBUSDT', 'KEYUSDT', 'REEFUSDT', 'LINAUSDT', 'JASMYUSDT', 'GALAUSDT', 
  'CHZUSDT', 'FILUSDT', 'ICPUSDT',
  // Platform Alphas
  'AURUSDT', 'VTXUSDT', 'NEXUSDT', 'GLXUSDT', 'PHXUSDT', 'ZELUSDT', 
  'CRYUSDT', 'IONUSDT', 'NOVAUSDT', 'LYNUSDT',
  // Stocks & Commodities
  'CPXUSDT', 'ARTSUSDT', 'AXGUSDT', 'BGNXUSDT', 'VOLTUSDT', 'QCOREUSDT', 'CYBRUSDT', 'OMNIUSDT', 'CINEUSDT', 'TFRAUSDT',
  'TSLAUSDT', 'AAPLUSDT', 'NVDAUSDT', 'AMZNUSDT', 'MSFTUSDT', 'GOOGLUSDT',
  'METAUSDT', 'NFLXUSDT', 'AMDUSDT', 'COINUSDT', 'MSTRUSDT', 'GOLDUSDT',
  'SILVERUSDT', 'OILUSDT'
];

const ASSET_CONFIG: Record<string, { name: string; category: string }> = {
  BTC: { name: 'Bitcoin', category: 'Main' },
  ETH: { name: 'Ethereum', category: 'Main' },
  BNB: { name: 'BNB Chain', category: 'Main' },
  SOL: { name: 'Solana', category: 'Main' },
  XRP: { name: 'Ripple', category: 'Main' },
  ADA: { name: 'Cardano', category: 'Layer 1' },
  LINK: { name: 'Chainlink', category: 'DeFi' },
  DOT: { name: 'Polkadot', category: 'Layer 1' },
  AVAX: { name: 'Avalanche', category: 'Layer 1' },
  MATIC: { name: 'Polygon', category: 'Layer 1' },
  DOGE: { name: 'Dogecoin', category: 'Meme' },
  SHIB: { name: 'Shiba Inu', category: 'Meme' },
  PEPE: { name: 'Pepe', category: 'Meme' },
  WIF: { name: 'dogwifhat', category: 'Meme' },
  NEAR: { name: 'Near Protocol', category: 'Layer 1' },
  APT: { name: 'Aptos', category: 'Layer 1' },
  UNI: { name: 'Uniswap', category: 'DeFi' },
  AAVE: { name: 'Aave', category: 'DeFi' },
  MKR: { name: 'Maker', category: 'DeFi' },
  CRV: { name: 'Curve', category: 'DeFi' },
  LDO: { name: 'Lido DAO', category: 'DeFi' },
  AXS: { name: 'Axie Infinity', category: 'Alpha' },
  SAND: { name: 'The Sandbox', category: 'Alpha' },
  MANA: { name: 'Decentraland', category: 'Alpha' },
  IMX: { name: 'Immutable', category: 'Alpha' },
  APE: { name: 'ApeCoin', category: 'Alpha' },
  
  // Custom Main Sample Training Tokens
  NAS: { name: 'Nebula Alpha Synth', category: 'Main' },
  AEP: { name: 'Apex Execution Pair', category: 'Main' },
  ECB: { name: 'Ecosystem Core Bridge', category: 'Main' },
  BOT: { name: 'Bot Trading Engine', category: 'Main' },
  TTZS: { name: 'Titan Training Zone', category: 'Main' },
  OCT: { name: 'Octa Core L2', category: 'Main' },
  CFR: { name: 'Crypto Financial Reserve', category: 'Main' },
  STC: { name: 'Smart Training Coin', category: 'Main' },
  CFT: { name: 'Core Financial Futures', category: 'Main' },
  RTV: { name: 'Real Time Velocity', category: 'Main' },
  JOE: { name: 'Joe Trader Coin', category: 'Main' },
  REO: { name: 'Reserve Ecosystem Oracle', category: 'Main' },
  BEX: { name: 'Block Exchange L2', category: 'Main' },
  RYR: { name: 'Rhythm Yield Reserve', category: 'Main' },
  OAS: { name: 'Oasis Alpha L2', category: 'Main' },
  JTC: { name: 'Joint Training Coin', category: 'Main' },
  
  SUI: { name: 'Sui', category: 'Layer 1' },
  SEI: { name: 'Sei', category: 'Layer 1' },
  FTM: { name: 'Fantom', category: 'Layer 1' },
  OP: { name: 'Optimism', category: 'Layer-2' },
  ARB: { name: 'Arbitrum', category: 'Layer-2' },
  POL: { name: 'Polygon ecosystem Token', category: 'Layer 1' },
  TRX: { name: 'TRON', category: 'Layer 1' },
  LTC: { name: 'Litecoin', category: 'Main' },
  ETC: { name: 'Ethereum Classic', category: 'Layer 1' },
  BCH: { name: 'Bitcoin Cash', category: 'Main' },
  ATOM: { name: 'Cosmos', category: 'Layer 1' },
  ALGO: { name: 'Algorand', category: 'Layer 1' },
  HBAR: { name: 'Hedera', category: 'Layer 1' },
  VET: { name: 'VeChain', category: 'Layer 1' },
  
  FET: { name: 'Artificial Superintelligence Alliance', category: 'AI' },
  RENDER: { name: 'Render', category: 'AI' },
  WLD: { name: 'Worldcoin', category: 'AI' },
  GRT: { name: 'The Graph', category: 'AI' },
  
  BONK: { name: 'Bonk', category: 'Meme' },
  FLOKI: { name: 'Floki', category: 'Meme' },
  BOME: { name: 'Book of Meme', category: 'Meme' },
  POPCAT: { name: 'Popcat', category: 'Meme' },
  MEME: { name: 'Memecoin', category: 'Meme' },
  BRETT: { name: 'Brett', category: 'Meme' },
  
  FTT: { name: 'Futures Training Token', category: 'Alpha' },
  LUNC: { name: 'Terra Classic', category: 'Alpha' },
  USTC: { name: 'TerraClassicUSD', category: 'Alpha' },
  ALPHA: { name: 'Stella', category: 'Alpha' },
  TRU: { name: 'TrueFi', category: 'DeFi' },
  UNFI: { name: 'Unifi Protocol DAO', category: 'DeFi' },
  GAS: { name: 'Gas', category: 'Alpha' },
  LOOM: { name: 'Loom Network', category: 'Alpha' },
  PHB: { name: 'Redux Protocol', category: 'Alpha' },
  KEY: { name: 'SelfKey', category: 'Alpha' },
  REEF: { name: 'Reef', category: 'DeFi' },
  LINA: { name: 'Linear', category: 'DeFi' },
  JASMY: { name: 'JasmyCoin', category: 'Alpha' },
  GALA: { name: 'Gala', category: 'Alpha' },
  CHZ: { name: 'Chiliz', category: 'DeFi' },
  FIL: { name: 'Filecoin', category: 'DeFi' },
  ICP: { name: 'Internet Computer', category: 'Layer 1' },
  
  AUR: { name: 'Aura', category: 'Main' },
  VTX: { name: 'Vortex', category: 'Main' },
  NEX: { name: 'Nexus', category: 'Main' },
  GLX: { name: 'Galaxy', category: 'Main' },
  PHX: { name: 'Phoenix', category: 'Main' },
  ZEL: { name: 'Zelos', category: 'Main' },
  CRY: { name: 'Crysta', category: 'Main' },
  ION: { name: 'Ionic', category: 'Main' },
  NOVA: { name: 'Novas', category: 'Main' },
  LYN: { name: 'Lynx', category: 'Main' },

  // Stocks & Commodities
  CPX: { name: 'Crypx-PRO Inc', category: 'Stocks & Commodities' },
  ARTS: { name: 'Artesys Corp', category: 'Stocks & Commodities' },
  AXG: { name: 'AeroX Global', category: 'Stocks & Commodities' },
  BGNX: { name: 'BioGenix Labs', category: 'Stocks & Commodities' },
  VOLT: { name: 'Volt Motors', category: 'Stocks & Commodities' },
  QCORE: { name: 'QuantumCore', category: 'Stocks & Commodities' },
  CYBR: { name: 'CyberShield Inc', category: 'Stocks & Commodities' },
  OMNI: { name: 'OmniMart Group', category: 'Stocks & Commodities' },
  CINE: { name: 'CineVerse Media', category: 'Stocks & Commodities' },
  TFRA: { name: 'Terra Infra Group', category: 'Stocks & Commodities' },
  TSLA: { name: 'Tesla Inc', category: 'Stocks & Commodities' },
  AAPL: { name: 'Apple Inc', category: 'Stocks & Commodities' },
  NVDA: { name: 'NVIDIA Corp', category: 'Stocks & Commodities' },
  AMZN: { name: 'Amazon.com Inc', category: 'Stocks & Commodities' },
  MSFT: { name: 'Microsoft Corp', category: 'Stocks & Commodities' },
  GOOGL: { name: 'Alphabet Inc', category: 'Stocks & Commodities' },
  META: { name: 'Meta Platforms', category: 'Stocks & Commodities' },
  NFLX: { name: 'Netflix Inc', category: 'Stocks & Commodities' },
  AMD: { name: 'AMD Inc', category: 'Stocks & Commodities' },
  COIN: { name: 'Coinbase Global', category: 'Stocks & Commodities' },
  MSTR: { name: 'MicroStrategy', category: 'Stocks & Commodities' },
  GOLD: { name: 'Gold Spot', category: 'Stocks & Commodities' },
  SILVER: { name: 'Silver Spot', category: 'Stocks & Commodities' },
  OIL: { name: 'Crude Oil', category: 'Stocks & Commodities' },
};

const ALL_ASSETS = [
  'USDT', 'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'SHIB', 'PEPE', 'WIF', 'LINK', 'DOT', 'AVAX', 'MATIC', 
  'NEAR', 'APT', 'SUI', 'SEI', 'FTM', 'OP', 'ARB', 'POL', 'TRX', 'LTC', 'ETC', 'BCH', 'ATOM', 'ALGO', 'HBAR', 'VET',
  'FET', 'RENDER', 'WLD', 'GRT', 'BONK', 'FLOKI', 'BOME', 'POPCAT', 'MEME', 'BRETT', 'FTT', 'LUNC', 'USTC', 'ALPHA', 
  'TRU', 'UNFI', 'GAS', 'LOOM', 'PHB', 'KEY', 'REEF', 'LINA', 'JASMY', 'GALA', 'CHZ', 'FIL', 'ICP',
  'NAS', 'AEP', 'ECB', 'BOT', 'TTZS', 'OCT', 'CFR', 'STC', 'CFT', 'RTV', 'JOE', 'REO', 'BEX', 'RYR', 'OAS', 'JTC',
  'AUR', 'VTX', 'NEX', 'GLX', 'PHX', 'ZEL', 'CRY', 'ION', 'NOVA', 'LYN',
  'CPX', 'ARTS', 'AXG', 'BGNX', 'VOLT', 'QCORE', 'CYBR', 'OMNI', 'CINE', 'TFRA',
  'TSLA', 'AAPL', 'NVDA', 'AMZN', 'MSFT', 'GOOGL', 'META', 'NFLX', 'AMD', 'COIN', 'MSTR', 'GOLD', 'SILVER', 'OIL'
];

const Spot = () => {
  const { user, profile: authProfile, refreshProfile, updateProfileLocally } = useAuth();
  const navigate = useNavigate();
  const profile = authProfile || getFallbackUserProfile(user);
  const [userAssets, setUserAssets] = useState<UserAsset[]>([]);
  const [tickers, setTickers] = useState<Record<string, MarketTicker>>({});
  const [selectedPair, setSelectedPair] = useState(() => {
    return sessionStorage.getItem('spot_selected_pair') || 'BTCUSDT';
  });

  useEffect(() => {
    sessionStorage.setItem('spot_selected_pair', selectedPair);
  }, [selectedPair]);
  const [selectedPriceOverride, setSelectedPriceOverride] = useState<number | null>(null);

  // Spot Order History & Open Orders state
  const [spotOrders, setSpotOrders] = useState<SpotOrder[]>([]);

  // Convert modal state
  const [showConvert, setShowConvert] = useState(false);
  const [convertFrom, setConvertFrom] = useState('USDT');
  const [convertTo, setConvertTo] = useState('BTC');
  const [convertAmount, setConvertAmount] = useState('');

  // Transfer modal state
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferFromSpot, setTransferFromSpot] = useState(true);
  const [transferAmount, setTransferAmount] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  const [loadingMarkets, setLoadingMarkets] = useState(true);

  // Load persistent orders from localStorage
  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(`spot_orders_${user.id}`);
    if (stored) {
      try {
        setSpotOrders(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse spot orders", e);
      }
    }
  }, [user]);

  // Save orders helper
  const saveSpotOrders = useCallback((newOrders: SpotOrder[]) => {
    setSpotOrders(newOrders);
    if (user) {
      localStorage.setItem(`spot_orders_${user.id}`, JSON.stringify(newOrders));
    }
  }, [user]);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    refreshProfile();
  }, [user, refreshProfile]);

  const loadAssets = useCallback(async () => {
    if (!user) return;
    let localCache: UserAsset[] = [];
    const stored = localStorage.getItem(`user_assets_${user.id}`);
    if (stored) {
      try {
        localCache = JSON.parse(stored);
        if (Array.isArray(localCache) && localCache.length > 0) {
          setUserAssets(localCache);
        }
      } catch (e) {
        console.error("Failed to parse cached assets", e);
      }
    }

    try {
      const { data, error } = await supabase.from('user_assets').select('*').eq('user_id', user.id);
      if (!error && data) {
        setUserAssets(data as UserAsset[]);
        localStorage.setItem(`user_assets_${user.id}`, JSON.stringify(data));
      } else if (localCache.length > 0) {
        setUserAssets(localCache);
      }
    } catch (e) {
      console.warn("Could not load user assets", e);
    }
  }, [user]);

  const fetchTickers = useCallback(async () => {
    try {
      const data = await marketService.get24hTickerStats(SYMBOLS_LIST);
      setTickers(data);
    } catch (err) {
      console.error("fetchTickers error:", err);
    } finally {
      setLoadingMarkets(false);
    }
  }, []);

  useEffect(() => {
    fetchTickers();

    // Subscribe to live synchronous ticks from open-source Binance & CoinCap stream
    const unsubscribe = marketService.subscribeToAllTickers((liveUpdates) => {
      setTickers(prev => {
        const next = { ...prev };
        let changed = false;
        Object.entries(liveUpdates).forEach(([pair, data]) => {
          const s = pair.replace('/', '');
          if (!next[s] || next[s].lastPrice !== data.price) {
            next[s] = {
              lastPrice: data.price,
              priceChangePercent: data.change24h !== undefined ? data.change24h : (next[s]?.priceChangePercent || 0)
            };
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    });

    const interval = setInterval(fetchTickers, 4000);
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [fetchTickers]);

  useEffect(() => {
    if (!user) return;
    
    loadProfile();
    loadAssets();

    const profileChannel = supabase
      .channel(`spot-profile-${user.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles', 
        filter: `id=eq.${user.id}` 
      }, () => {
        loadProfile();
      })
      .subscribe();

    const assetsChannel = supabase
      .channel(`spot-user_assets-${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'user_assets', 
        filter: `user_id=eq.${user.id}` 
      }, () => {
        loadAssets();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(assetsChannel);
    };
  }, [user, loadProfile, loadAssets]);

  // Automated Live Limit Order Matching Engine
  useEffect(() => {
    if (!user || spotOrders.length === 0) return;
    const openOrders = spotOrders.filter(o => o.status === 'OPEN');
    if (openOrders.length === 0) return;

    let ordersChanged = false;
    const updatedOrders = [...spotOrders];

    for (let i = 0; i < updatedOrders.length; i++) {
      const order = updatedOrders[i];
      if (order.status !== 'OPEN') continue;

      const liveTicker = tickers[order.pair];
      const livePrice = liveTicker?.lastPrice || marketService.getCurrentPrice(order.pair);
      if (!livePrice || livePrice <= 0) continue;

      // Limit Buy condition: Market price is at or below the limit order price
      if (order.side === 'BUY' && livePrice <= order.price) {
        ordersChanged = true;
        updatedOrders[i] = {
          ...order,
          status: 'FILLED',
          filledAt: new Date().toISOString()
        };

        // Credit the base asset to user
        const existingAssetIndex = userAssets.findIndex(a => a.symbol === order.symbol);
        let nextAssets: UserAsset[];
        if (existingAssetIndex >= 0) {
          const existing = userAssets[existingAssetIndex];
          const newAmt = Number((Number(existing.amount) + order.amount).toFixed(8));
          nextAssets = userAssets.map((a, idx) => idx === existingAssetIndex ? { ...a, amount: newAmt } : a);
          supabase.from('user_assets').update({ amount: newAmt }).eq('id', existing.id);
        } else {
          const newAssetItem: UserAsset = {
            id: 'asset_' + Math.random().toString(36).substring(2, 9),
            user_id: user.id,
            symbol: order.symbol,
            amount: Number(order.amount.toFixed(8)),
            created_at: new Date().toISOString()
          };
          nextAssets = [...userAssets, newAssetItem];
          supabase.from('user_assets').insert({ user_id: user.id, symbol: order.symbol, amount: Number(order.amount.toFixed(8)) });
        }
        setUserAssets(nextAssets);
        localStorage.setItem(`user_assets_${user.id}`, JSON.stringify(nextAssets));
        toast.success(`🎉 Limit Buy Order Filled: Bought ${order.amount.toFixed(4)} ${order.symbol} @ $${livePrice.toFixed(2)}`);
      }

      // Limit Sell condition: Market price is at or above the limit order price
      if (order.side === 'SELL' && livePrice >= order.price) {
        ordersChanged = true;
        updatedOrders[i] = {
          ...order,
          status: 'FILLED',
          filledAt: new Date().toISOString()
        };

        // Credit USDT to user profile
        const newUsdt = (profile?.balance || 0) + order.total;
        supabase.from('profiles').update({ balance: newUsdt }).eq('id', user.id);
        updateProfileLocally({ balance: newUsdt });
        toast.success(`🎉 Limit Sell Order Filled: Sold ${order.amount.toFixed(4)} ${order.symbol} for $${order.total.toFixed(2)} USDT`);
      }
    }

    if (ordersChanged) {
      saveSpotOrders(updatedOrders);
    }
  }, [tickers, spotOrders, user, profile, userAssets, updateProfileLocally, saveSpotOrders]);

  // Execute Spot Trade (Buy / Sell)
  const handleExecuteTrade = async ({
    side,
    type,
    price,
    amount,
    total
  }: {
    side: 'BUY' | 'SELL';
    type: 'LIMIT' | 'MARKET';
    price: number;
    amount: number;
    total: number;
  }) => {
    if (!user) {
      toast.info("Please sign in to place spot orders");
      navigate("/auth");
      return;
    }
    if (!profile) return;
    const baseSymbol = selectedPair.replace('USDT', '');

    if (side === 'BUY') {
      const currentUsdt = profile.balance || 0;
      if (total > currentUsdt) {
        toast.error("Insufficient USDT balance for this trade.");
        return;
      }

      // Deduct USDT balance
      const newUsdtBalance = Math.max(0, currentUsdt - total);
      await supabase.from('profiles').update({ balance: newUsdtBalance }).eq('id', user.id);
      updateProfileLocally({ balance: newUsdtBalance });

      if (type === 'MARKET') {
        // Credit Base Asset immediately for Market Order at Mark Price
        const existingAssetIndex = userAssets.findIndex(a => a.symbol === baseSymbol);
        let updatedAssets: UserAsset[];

        if (existingAssetIndex >= 0) {
          const existing = userAssets[existingAssetIndex];
          const newAmt = Number((Number(existing.amount) + amount).toFixed(8));
          updatedAssets = userAssets.map((a, idx) => idx === existingAssetIndex ? { ...a, amount: newAmt } : a);
          await supabase.from('user_assets').update({ amount: newAmt }).eq('id', existing.id);
        } else {
          const newAssetItem: UserAsset = {
            id: 'asset_' + Math.random().toString(36).substring(2, 9),
            user_id: user.id,
            symbol: baseSymbol,
            amount: Number(amount.toFixed(8)),
            created_at: new Date().toISOString()
          };
          updatedAssets = [...userAssets, newAssetItem];
          await supabase.from('user_assets').insert({ user_id: user.id, symbol: baseSymbol, amount: Number(amount.toFixed(8)) });
        }

        setUserAssets(updatedAssets);
        localStorage.setItem(`user_assets_${user.id}`, JSON.stringify(updatedAssets));
      }

      // Record Order
      const newOrder: SpotOrder = {
        id: Math.random().toString(36).substring(7),
        userId: user.id,
        pair: selectedPair,
        symbol: baseSymbol,
        side: 'BUY',
        type,
        price,
        amount,
        total,
        status: type === 'MARKET' ? 'FILLED' : 'OPEN',
        createdAt: new Date().toISOString(),
        filledAt: type === 'MARKET' ? new Date().toISOString() : undefined
      };

      saveSpotOrders([newOrder, ...spotOrders]);
      toast.success(
        type === 'MARKET'
          ? `Bought ${amount.toFixed(4)} ${baseSymbol} @ Mark Price $${price.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT`
          : `Limit Buy Order placed for ${amount.toFixed(4)} ${baseSymbol} @ $${price.toLocaleString(undefined, { minimumFractionDigits: 2 })} (Placed in Open Orders)`
      );

    } else {
      // SELL
      const existingAsset = userAssets.find(a => a.symbol === baseSymbol);
      const currentBaseAmt = existingAsset ? Number(existingAsset.amount) : 0;

      if (amount > currentBaseAmt) {
        toast.error(`Insufficient ${baseSymbol} balance for this trade.`);
        return;
      }

      // Deduct Base Asset
      const newBaseAmt = Math.max(0, currentBaseAmt - amount);
      let updatedAssets: UserAsset[];

      if (newBaseAmt < 0.000001) {
        updatedAssets = userAssets.filter(a => a.symbol !== baseSymbol);
        if (existingAsset) {
          await supabase.from('user_assets').delete().eq('id', existingAsset.id);
        }
      } else if (existingAsset) {
        updatedAssets = userAssets.map(a => a.id === existingAsset.id ? { ...a, amount: newBaseAmt } : a);
        await supabase.from('user_assets').update({ amount: newBaseAmt }).eq('id', existingAsset.id);
      } else {
        updatedAssets = userAssets;
      }

      setUserAssets(updatedAssets);
      localStorage.setItem(`user_assets_${user.id}`, JSON.stringify(updatedAssets));

      if (type === 'MARKET') {
        // Credit USDT immediately for Market Sell at Mark Price
        const newUsdtBalance = (profile.balance || 0) + total;
        await supabase.from('profiles').update({ balance: newUsdtBalance }).eq('id', user.id);
        updateProfileLocally({ balance: newUsdtBalance });
      }

      // Record Order
      const newOrder: SpotOrder = {
        id: Math.random().toString(36).substring(7),
        userId: user.id,
        pair: selectedPair,
        symbol: baseSymbol,
        side: 'SELL',
        type,
        price,
        amount,
        total,
        status: type === 'MARKET' ? 'FILLED' : 'OPEN',
        createdAt: new Date().toISOString(),
        filledAt: type === 'MARKET' ? new Date().toISOString() : undefined
      };

      saveSpotOrders([newOrder, ...spotOrders]);
      toast.success(
        type === 'MARKET'
          ? `Sold ${amount.toFixed(4)} ${baseSymbol} @ Mark Price for $${total.toFixed(2)} USDT`
          : `Limit Sell Order placed for ${amount.toFixed(4)} ${baseSymbol} @ $${price.toLocaleString(undefined, { minimumFractionDigits: 2 })} (Placed in Open Orders)`
      );
    }

    loadProfile();
  };

  // Cancel Limit Order
  const handleCancelOrder = async (orderId: string) => {
    const order = spotOrders.find(o => o.id === orderId);
    if (!order || order.status !== 'OPEN' || !user || !profile) return;

    if (order.side === 'BUY') {
      // Refund USDT
      const newBal = (profile.balance || 0) + order.total;
      await supabase.from('profiles').update({ balance: newBal }).eq('id', user.id);
      updateProfileLocally({ balance: newBal });
    } else {
      // Refund Base Asset
      const existingAssetIndex = userAssets.findIndex(a => a.symbol === order.symbol);
      let updatedAssets: UserAsset[];

      if (existingAssetIndex >= 0) {
        const existing = userAssets[existingAssetIndex];
        const newAmt = Number((Number(existing.amount) + order.amount).toFixed(8));
        updatedAssets = userAssets.map((a, idx) => idx === existingAssetIndex ? { ...a, amount: newAmt } : a);
        await supabase.from('user_assets').update({ amount: newAmt }).eq('id', existing.id);
      } else {
        const newAssetItem: UserAsset = {
          id: 'asset_' + Math.random().toString(36).substring(2, 9),
          user_id: user.id,
          symbol: order.symbol,
          amount: Number(order.amount.toFixed(8)),
          created_at: new Date().toISOString()
        };
        updatedAssets = [...userAssets, newAssetItem];
        await supabase.from('user_assets').insert({ user_id: user.id, symbol: order.symbol, amount: Number(order.amount.toFixed(8)) });
      }

      setUserAssets(updatedAssets);
      localStorage.setItem(`user_assets_${user.id}`, JSON.stringify(updatedAssets));
    }

    const updatedOrders = spotOrders.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' as const } : o);
    saveSpotOrders(updatedOrders);
    toast.info("Limit order cancelled and funds returned.");
    loadProfile();
  };

  const handleClearHistory = () => {
    const remainingOpen = spotOrders.filter(o => o.status === 'OPEN');
    saveSpotOrders(remainingOpen);
    toast.success("Transaction history cleared.");
  };

  const handleTransfer = async () => {
    if (!user || !profile || !transferAmount) return;
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    const available = transferFromSpot ? (profile.balance || 0) : (profile.futures_balance || 0);
    if (amount > available) { toast.error("Insufficient balance"); return; }

    setIsTransferring(true);
    const newSpot = transferFromSpot ? (profile.balance || 0) - amount : (profile.balance || 0) + amount;
    const newFutures = transferFromSpot ? (profile.futures_balance || 0) + amount : (profile.futures_balance || 0) - amount;

    await supabase.from('profiles').update({ balance: newSpot, futures_balance: newFutures }).eq('id', user.id);
    updateProfileLocally({ balance: newSpot, futures_balance: newFutures });
    setIsTransferring(false);
    setShowTransfer(false);
    setTransferAmount('');
    toast.success("Transfer completed successfully");
  };

  const handleConvertSwap = () => {
    const temp = convertFrom;
    setConvertFrom(convertTo);
    setConvertTo(temp);
  };

  const handleConvertSubmit = async () => {
    if (!user || !profile || !convertAmount) return;
    const amount = parseFloat(convertAmount);
    if (isNaN(amount) || amount <= 0) return;

    const prices = await marketService.getPrices();
    const fromPrice = convertFrom === 'USDT' ? 1 : (prices[convertFrom] || 0);
    const toPrice = convertTo === 'USDT' ? 1 : (prices[convertTo] || 0);

    if (toPrice === 0) {
      toast.error(`Unable to fetch price for ${convertTo}. Please try again later.`);
      return;
    }

    if (convertFrom === 'USDT') {
      const { data: dbProfile } = await supabase.from('profiles').select('balance').eq('id', user.id).single();
      const dbBalance = dbProfile?.balance ?? 0;
      if (amount > dbBalance) { toast.error("Insufficient USDT balance"); return; }
    } else {
      const { data: dbAsset } = await supabase.from('user_assets').select('*').eq('user_id', user.id).eq('symbol', convertFrom).maybeSingle();
      if (!dbAsset || amount > Number(dbAsset.amount || 0)) { toast.error(`Insufficient ${convertFrom} balance`); return; }
    }

    const toAmount = (amount * fromPrice) / toPrice;

    if (convertFrom === 'USDT') {
      const { data: dbProfile } = await supabase.from('profiles').select('balance').eq('id', user.id).single();
      const currentBal = dbProfile?.balance ?? 0;
      const newBal = Math.max(0, currentBal - amount);
      await supabase.from('profiles').update({ balance: newBal }).eq('id', user.id);
      updateProfileLocally({ balance: newBal });
    } else {
      const { data: dbAsset } = await supabase.from('user_assets').select('*').eq('user_id', user.id).eq('symbol', convertFrom).maybeSingle();
      if (dbAsset) {
        const currentAmount = Number(dbAsset.amount || 0);
        const newAmt = Math.max(0, currentAmount - amount);
        const dustValueInUSDT = newAmt * fromPrice;
        
        if (dustValueInUSDT < 0.1 || newAmt.toFixed(4) === '0.0000') {
          await supabase.from('user_assets').delete().eq('user_id', user.id).eq('symbol', convertFrom);
          setUserAssets(prev => prev.filter(a => a.symbol !== convertFrom));
        } else {
          await supabase.from('user_assets').update({ amount: newAmt }).eq('user_id', user.id).eq('symbol', convertFrom);
          setUserAssets(prev => prev.map(a => a.symbol === convertFrom ? { ...a, amount: newAmt } : a));
        }
      }
    }

    if (convertTo === 'USDT') {
      const { data: dbProfile } = await supabase.from('profiles').select('balance').eq('id', user.id).single();
      const newBalance = (dbProfile?.balance ?? 0) + toAmount;
      await supabase.from('profiles').update({ balance: newBalance }).eq('id', user.id);
      updateProfileLocally({ balance: newBalance });
    } else {
      const { data: dbAsset } = await supabase.from('user_assets').select('*').eq('user_id', user.id).eq('symbol', convertTo).maybeSingle();
      if (dbAsset) {
        const currentAmount = Number(dbAsset.amount || 0);
        const newAmt = currentAmount + toAmount;
        await supabase.from('user_assets').update({ amount: newAmt }).eq('user_id', user.id).eq('symbol', convertTo);
        setUserAssets(prev => prev.map(a => a.symbol === convertTo ? { ...a, amount: newAmt } : a));
      } else {
        await supabase.from('user_assets').insert({ user_id: user.id, symbol: convertTo, amount: toAmount });
      }
    }

    // Record conversion in spot orders history
    const convertOrderRecord: SpotOrder = {
      id: Math.random().toString(36).substring(7),
      userId: user.id,
      pair: `${convertFrom}/${convertTo}`,
      symbol: convertTo,
      side: 'BUY',
      type: 'CONVERT',
      price: fromPrice / toPrice,
      amount: toAmount,
      total: amount * fromPrice,
      status: 'FILLED',
      createdAt: new Date().toISOString(),
      filledAt: new Date().toISOString()
    };
    saveSpotOrders([convertOrderRecord, ...spotOrders]);

    toast.success(`Converted ${amount} ${convertFrom} → ${toAmount.toFixed(6)} ${convertTo}`);
    loadProfile();
    loadAssets();
    setShowConvert(false);
    setConvertAmount('');
  };

  const activeTicker = tickers[selectedPair] || { lastPrice: 0, priceChangePercent: 0, high24h: 0, low24h: 0, volume24h: 0 };
  const baseSymbol = selectedPair.replace('USDT', '');
  const baseAssetBalance = Number(userAssets.find(a => a.symbol === baseSymbol)?.amount || 0);

  const previewFromPrice = convertFrom === 'USDT' ? 1 : marketService.getCurrentPrice(convertFrom + 'USDT');
  const previewToPrice = convertTo === 'USDT' ? 1 : marketService.getCurrentPrice(convertTo + 'USDT');
  const previewToAmount = (parseFloat(convertAmount || '0') * previewFromPrice) / (previewToPrice || 1);

  return (
    <div className="pb-16 min-h-screen bg-background text-foreground space-y-4">
      {/* Top Header & Navigation Bar */}
      <div className="bg-card/90 border-b border-border px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 shadow-sm backdrop-blur-md">
        {/* Left: Token Pair Selector with 3-line Dashboard Panel and Dropdown Arrow */}
        <div className="flex items-center gap-3">
          <TokenPairSelector
            selectedPair={selectedPair}
            onSelectPair={(pair) => {
              setSelectedPair(pair);
              setSelectedPriceOverride(null);
            }}
            tickers={tickers}
            assetConfig={ASSET_CONFIG}
            symbolsList={SYMBOLS_LIST}
          />

          {/* Quick Ticker Stats */}
          <div className="hidden sm:flex items-center gap-4 text-xs pl-2 border-l border-border/80">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-bold">24h Price</div>
              <div className={`font-mono font-black ${activeTicker.priceChangePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                ${activeTicker.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-bold">24h Change</div>
              <div className={`font-mono font-bold ${activeTicker.priceChangePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {activeTicker.priceChangePercent >= 0 ? '+' : ''}{activeTicker.priceChangePercent.toFixed(2)}%
              </div>
            </div>
            <div className="hidden md:block">
              <div className="text-[10px] text-muted-foreground uppercase font-bold">24h High</div>
              <div className="font-mono font-bold text-foreground">
                ${(activeTicker.high24h || activeTicker.lastPrice * 1.02).toFixed(2)}
              </div>
            </div>
            <div className="hidden md:block">
              <div className="text-[10px] text-muted-foreground uppercase font-bold">24h Low</div>
              <div className="font-mono font-bold text-foreground">
                ${(activeTicker.low24h || activeTicker.lastPrice * 0.98).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowConvert(true)} 
            className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-primary/20"
          >
            <RefreshCw size={12} />
            <span>Convert</span>
          </button>
          <button 
            onClick={() => setShowTransfer(true)} 
            className="bg-muted text-muted-foreground hover:bg-accent hover:text-foreground px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-border"
          >
            <ArrowRightLeft size={12} />
            <span>Transfer</span>
          </button>
        </div>
      </div>

      <div className="p-3 md:p-4 space-y-4 max-w-[1600px] mx-auto">
        {/* Main Trading Area Layout (Order Book, Spot Order Form) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* 1. Order Book */}
          <div className="lg:col-span-6 h-[420px] sm:h-[480px]">
            <EnhancedOrderBook
              symbol={selectedPair}
              onSelectPrice={(price) => setSelectedPriceOverride(price)}
            />
          </div>

          {/* 2. Spot Buy / Sell Order Form */}
          <div className="lg:col-span-6 h-[420px] sm:h-[480px]">
            <SpotOrderForm
              symbol={baseSymbol}
              pair={selectedPair}
              ticker={activeTicker}
              availableUsdt={profile.balance || 0}
              availableBaseAsset={baseAssetBalance}
              onExecuteTrade={handleExecuteTrade}
              selectedPriceOverride={selectedPriceOverride}
            />
          </div>
        </div>

        {/* Spot Holding Balance Display Box (Formatted like regular Spot Wallet page) */}
        <SpotWalletBox
          usdtBalance={profile.balance || 0}
          userAssets={userAssets}
          tickers={tickers}
          assetConfig={ASSET_CONFIG}
          onSelectPairToTrade={(pair) => {
            setSelectedPair(pair);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenConvert={() => setShowConvert(true)}
          onOpenTransfer={() => setShowTransfer(true)}
        />

        {/* Transaction History Section */}
        <TransactionHistory
          orders={spotOrders}
          onCancelOrder={handleCancelOrder}
          onClearHistory={handleClearHistory}
        />
      </div>

      {/* Convert Modal */}
      {showConvert && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-md p-4">
          <div className="bg-card w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in border border-border">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <RefreshCw className="text-primary" size={18} /> Convert
              </h3>
              <button onClick={() => setShowConvert(false)} className="p-1.5 hover:bg-muted rounded-full text-muted-foreground transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              <div className="bg-muted p-3 rounded-xl border border-border">
                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block" htmlFor="convertFrom">From</label>
                <div className="flex items-center gap-2">
                  <div className="relative shrink-0 flex items-center gap-1 bg-card px-2 py-1 rounded-lg border border-border">
                    <CryptoIcon symbol={convertFrom} size={16} />
                    <select id="convertFrom" value={convertFrom} onChange={e => setConvertFrom(e.target.value)} className="bg-transparent font-bold text-xs outline-none w-16 appearance-none z-10 relative pr-4 text-foreground">
                      {ALL_ASSETS.filter(a => a !== convertTo).map(asset => <option key={asset} value={asset}>{asset}</option>)}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" size={12} />
                  </div>
                  <input type="number" value={convertAmount} onChange={e => setConvertAmount(e.target.value)} className="flex-1 min-w-0 bg-transparent text-right font-mono text-base font-bold outline-none text-foreground" placeholder="0.00" />
                </div>
                <div className="flex justify-end items-center gap-2 mt-1.5">
                  <span className="text-[9px] text-muted-foreground font-bold uppercase truncate">
                    Avail: {convertFrom === 'USDT' ? (profile.balance || 0).toFixed(4) : (userAssets.find(a => a.symbol === convertFrom)?.amount || 0).toFixed(4)}
                  </span>
                  <button onClick={() => {
                    const max = convertFrom === 'USDT' ? (profile.balance || 0) : (userAssets.find(a => a.symbol === convertFrom)?.amount || 0);
                    setConvertAmount(max.toString());
                  }} className="text-[9px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-1.5 py-0.5 rounded transition-colors shrink-0">MAX</button>
                </div>
              </div>

              <div className="flex justify-center -my-1.5 relative z-10">
                <button onClick={handleConvertSwap} className="bg-card border border-border p-1.5 rounded-full shadow-sm hover:bg-muted transition-all text-primary">
                  <ArrowDown size={14} />
                </button>
              </div>

              <div className="bg-muted p-3 rounded-xl border border-border">
                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block" htmlFor="convertTo">To</label>
                <div className="flex items-center gap-2">
                  <div className="relative shrink-0 flex items-center gap-1 bg-card px-2 py-1 rounded-lg border border-border">
                    <CryptoIcon symbol={convertTo} size={16} />
                    <select id="convertTo" value={convertTo} onChange={e => setConvertTo(e.target.value)} className="bg-transparent font-bold text-xs outline-none w-16 appearance-none z-10 relative pr-4 text-foreground">
                      {ALL_ASSETS.filter(a => a !== convertFrom).map(asset => <option key={asset} value={asset}>{asset}</option>)}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" size={12} />
                  </div>
                  <input disabled value={previewToAmount > 0 ? previewToAmount.toFixed(6) : ''} className="flex-1 min-w-0 bg-transparent text-right font-mono text-base font-bold outline-none text-muted-foreground" placeholder="0.00" title="Resulting amount" />
                </div>
              </div>

              <div className="bg-muted p-3 rounded-xl border border-border text-[10px]">
                <div className="flex justify-between"><span className="text-muted-foreground font-bold uppercase">Rate</span><span className="font-bold text-foreground">1 {convertFrom} ≈ {(previewFromPrice / (previewToPrice || 1)).toFixed(6)} {convertTo}</span></div>
              </div>

              <button onClick={handleConvertSubmit} disabled={!convertAmount || parseFloat(convertAmount) <= 0} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl shadow-sm mt-2 disabled:opacity-50 transition-all text-sm">
                Confirm Conversion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransfer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-md p-4">
          <div className="bg-card w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in border border-border">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2"><ArrowRightLeft className="text-primary" size={18} /> Transfer</h3>
              <button onClick={() => setShowTransfer(false)} className="p-1.5 hover:bg-muted rounded-full text-muted-foreground transition-colors"><X size={20} /></button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              <div className="space-y-1.5 relative">
                <div><label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">From</label><div className="bg-muted border border-border rounded-lg pl-3 py-2 text-xs font-bold text-foreground">{transferFromSpot ? 'Spot Wallet' : 'Futures Wallet'}</div></div>
                <div className="flex justify-center -my-1.5 relative z-10"><button onClick={() => setTransferFromSpot(!transferFromSpot)} className="bg-card border border-border rounded-full p-1.5 shadow-sm hover:bg-muted text-muted-foreground"><ArrowDown size={14} /></button></div>
                <div><label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">To</label><div className="bg-muted border border-border rounded-lg pl-3 py-2 text-xs font-bold text-foreground">{!transferFromSpot ? 'Spot Wallet' : 'Futures Wallet'}</div></div>
              </div>
              <div className="mt-5 mb-6">
                <div className="flex justify-between mb-1.5"><label className="text-[10px] font-bold text-muted-foreground uppercase">Amount</label><span className="text-[10px] text-muted-foreground font-bold uppercase">Available: <span className="text-foreground">{(transferFromSpot ? profile.balance : profile.futures_balance || 0).toFixed(2)}</span></span></div>
                <input type="number" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} placeholder="0.00" className="w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 font-mono text-base text-foreground focus:ring-2 focus:ring-primary/10 focus:border-primary/50 outline-none" />
              </div>
              <button onClick={handleTransfer} disabled={!transferAmount || parseFloat(transferAmount) <= 0 || isTransferring} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl shadow-sm transition-all disabled:opacity-50 text-sm">
                {isTransferring ? 'Processing...' : 'Confirm Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Spot;
