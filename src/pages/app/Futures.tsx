import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getFallbackUserProfile } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { marketService, MarketTicker } from '@/services/market';
import { CryptoIcon } from '@/components/shared/CryptoIcon';
import TradingChart from '@/components/shared/TradingChart';
import type { UserProfile, FuturePosition } from '@/types';
import { 
  TrendingUp, EyeOff, Eye, Activity, Clock, ArrowRightLeft, X, Wallet, 
  ChevronDown, ArrowDown, Search, CheckCircle 
} from 'lucide-react';
import { Logo } from '@/components/shared/Logo';

const PAIRS = [
  { symbol: 'BTCUSDT', name: 'Bitcoin' },
  { symbol: 'ETHUSDT', name: 'Ethereum' },
  { symbol: 'BNBUSDT', name: 'BNB' },
  { symbol: 'SOLUSDT', name: 'Solana' },
  { symbol: 'XRPUSDT', name: 'Ripple' },
  { symbol: 'ADAUSDT', name: 'Cardano' },
  { symbol: 'LINKUSDT', name: 'Chainlink' },
  { symbol: 'DOTUSDT', name: 'Polkadot' },
  { symbol: 'AVAXUSDT', name: 'Avalanche' },
  { symbol: 'MATICUSDT', name: 'Polygon' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin' },
  { symbol: 'SHIBUSDT', name: 'Shiba Inu' },
  { symbol: 'PEPEUSDT', name: 'Pepe' },
  { symbol: 'WIFUSDT', name: 'dogwifhat' },
  { symbol: 'NEARUSDT', name: 'Near Protocol' },
  { symbol: 'APTUSDT', name: 'Aptos' },
  { symbol: 'LTCUSDT', name: 'Litecoin' },
  { symbol: 'TRXUSDT', name: 'TRON' },
  { symbol: 'ARBUSDT', name: 'Arbitrum' },
  { symbol: 'OPUSDT', name: 'Optimism' },
  { symbol: 'SUIUSDT', name: 'Sui' },
  { symbol: 'SEIUSDT', name: 'Sei' },
  { symbol: 'FTMUSDT', name: 'Fantom' },
  { symbol: 'BONKUSDT', name: 'Bonk' },
  { symbol: 'FLOKIUSDT', name: 'Floki' },
  { symbol: 'BOMEUSDT', name: 'Book of Meme' },
  { symbol: 'POPCATUSDT', name: 'Popcat' },
  { symbol: 'BRETTUSDT', name: 'Brett' },
  { symbol: 'FETUSDT', name: 'Artificial Superintelligence Alliance' },
  { symbol: 'RENDERUSDT', name: 'Render' },
  { symbol: 'WLDUSDT', name: 'Worldcoin' }
];

const LEVERAGE_CONFIG: Record<number, { duration: number; profit: number }> = {
  25: { duration: 120, profit: 0.175 }, 50: { duration: 240, profit: 0.35 },
  75: { duration: 450, profit: 0.70 }, 100: { duration: 720, profit: 0.99 }
};

const Futures = () => {
  const { user, profile: authProfile, refreshProfile, updateProfileLocally } = useAuth();
  const navigate = useNavigate();
  const profile = authProfile || getFallbackUserProfile(user);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [positionTab, setPositionTab] = useState<'active' | 'history'>('active');
  const [showChart, setShowChart] = useState(() => {
    const saved = localStorage.getItem('crypx_futures_show_chart');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('crypx_futures_show_chart', String(showChart));
  }, [showChart]);
  const [selectedPair, setSelectedPair] = useState(() => {
    const stored = sessionStorage.getItem('futures_selected_pair');
    if (stored) {
      const pair = PAIRS.find(p => p.symbol === stored);
      if (pair) return pair;
    }
    return PAIRS[0];
  });

  useEffect(() => {
    sessionStorage.setItem('futures_selected_pair', selectedPair.symbol);
  }, [selectedPair]);
  const [tickers, setTickers] = useState<Record<string, MarketTicker>>({});
  const [chartInterval, setChartInterval] = useState('1m');
  const [leverage, setLeverage] = useState(25);
  const [marginInput, setMarginInput] = useState('');
  const [positions, setPositions] = useState<FuturePosition[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [newPositionModal, setNewPositionModal] = useState<FuturePosition | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferFromSpot, setTransferFromSpot] = useState(true);
  const [isTransferring, setIsTransferring] = useState(false);
  const [showPairSelector, setShowPairSelector] = useState(false);
  
  const [jitter, setJitter] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setJitter((Math.random() - 0.5) * 0.04);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const positionsRef = useRef<FuturePosition[]>([]);
  const profileRef = useRef<UserProfile | null>(null);
  const processingRef = useRef<Set<string>>(new Set());

  useEffect(() => { positionsRef.current = positions; }, [positions]);
  useEffect(() => { profileRef.current = profile; }, [profile]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    refreshProfile();
    try {
      supabase.from('positions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
        if (data) setPositions(data as FuturePosition[]);
      }).catch(() => {});
    } catch (e) {
      console.warn("Error fetching positions", e);
    }
  }, [user, refreshProfile]);

  useEffect(() => {
    const symbols = PAIRS.map(p => p.symbol);
    const fetchTickers = async () => {
      const data = await marketService.get24hTickerStats(symbols);
      setTickers(data);
    };
    fetchTickers();
    const interval = setInterval(fetchTickers, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeTicker = tickers[selectedPair.symbol] || { lastPrice: marketService.getCurrentPrice(selectedPair.symbol), priceChangePercent: 0 };
  const currentPrice = activeTicker.lastPrice || marketService.getCurrentPrice(selectedPair.symbol) || 73500;

  // Auto-close positions
  useEffect(() => {
    const interval = setInterval(async () => {
      const now = Date.now();
      const currentPositions = positionsRef.current;
      const currentProfile = profileRef.current;
      if (!currentProfile || !user) return;
      let hasChanges = false;
      const updated = await Promise.all(currentPositions.map(async pos => {
        if (pos.status === 'CLOSED' || processingRef.current.has(pos.id)) return pos;
        const elapsed = (now - pos.start_time) / 1000;
        if (elapsed >= pos.duration_seconds) {
          processingRef.current.add(pos.id);
          hasChanges = true;
          // Check force outcome overrides
          const { data: latestProfile } = await supabase.from('profiles').select('force_win, force_loss').eq('id', user.id).single();
          const isOverrideActive = latestProfile?.force_win ?? false;
          const isLossForced = latestProfile?.force_loss ?? false;
          
          let isWin = Math.random() > 0.5;
          if (isOverrideActive) {
            if (isLossForced) {
              isWin = false;
            } else {
              isWin = true;
            }
          }

          const profitAmt = isWin ? pos.margin * (pos.expected_profit_percentage || 0) : -pos.margin;
          try {
            if (typeof supabase.rpc === 'function') {
              await supabase.rpc('close_trade_position', { p_pos_id: pos.id, p_pnl: profitAmt });
            } else {
              throw new Error("mock");
            }
          } catch (err) {
            await supabase.from('positions').update({ status: 'CLOSED', pnl: profitAmt }).eq('id', pos.id);
            const { data: prof } = await supabase.from('profiles').select('futures_balance').eq('id', user.id).single();
            await supabase.from('profiles').update({ futures_balance: (prof?.futures_balance || 0) + pos.margin + profitAmt }).eq('id', user.id);
          }
          processingRef.current.delete(pos.id);
          return { ...pos, status: 'CLOSED', pnl: profitAmt };
        }
        return pos;
      }));
      if (hasChanges) {
        setPositions(updated);
        setTimeout(async () => {
          const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (data) { updateProfileLocally(data as UserProfile); profileRef.current = data as UserProfile; }
        }, 500);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [user]);

  const handleOpenTrade = async (side: 'LONG' | 'SHORT') => {
    if (!user) {
      toast.info("Please sign in to trade futures");
      navigate("/auth");
      return;
    }
    if (!profile || !marginInput) return;
    const margin = parseFloat(marginInput);
    if (isNaN(margin) || margin <= 0) { toast.error("Invalid amount"); return; }
    if (margin > (profile.futures_balance || 0)) { toast.error("Insufficient Futures Balance"); return; }
    const config = LEVERAGE_CONFIG[leverage];
    const sizeInCoins = (margin * leverage) / currentPrice;
    const newPosition: FuturePosition = {
      id: crypto.randomUUID(), user_id: user.id, pair: selectedPair.symbol,
      amount: sizeInCoins, margin, leverage, entry_price: currentPrice, type: side,
      start_time: Date.now(), duration_seconds: config.duration, expected_profit_percentage: config.profit,
      status: 'OPEN', pnl: 0, created_at: new Date().toISOString()
    };
    const newBalance = (profile.futures_balance || 0) - margin;
    positionsRef.current = [newPosition, ...positions];
    setPositions([newPosition, ...positions]);
    setMarginInput('');
    setNewPositionModal(newPosition);
    try {
      await supabase.from('profiles').update({ futures_balance: newBalance }).eq('id', user.id);
      await supabase.from('positions').insert({
        user_id: newPosition.user_id, pair: newPosition.pair, amount: newPosition.amount,
        margin: newPosition.margin, leverage: newPosition.leverage, entry_price: newPosition.entry_price,
        type: newPosition.type, start_time: newPosition.start_time, duration_seconds: newPosition.duration_seconds,
        expected_profit_percentage: newPosition.expected_profit_percentage,
      });
    } catch (e) {
      console.warn("Error saving position to database", e);
    }
  };

  const handleTransfer = async () => {
    if (!user) {
      toast.info("Please sign in to transfer assets");
      navigate("/auth");
      return;
    }
    if (!profile || !transferAmount) return;
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (transferFromSpot && amount > (profile.balance || 0)) { toast.error("Insufficient Spot Balance"); return; }
    if (!transferFromSpot && amount > (profile.futures_balance || 0)) { toast.error("Insufficient Futures Balance"); return; }
    setIsTransferring(true);
    const newSpot = transferFromSpot ? (profile.balance || 0) - amount : (profile.balance || 0) + amount;
    const newFutures = transferFromSpot ? (profile.futures_balance || 0) + amount : (profile.futures_balance || 0) - amount;
    try {
      await supabase.from('profiles').update({ balance: newSpot, futures_balance: newFutures }).eq('id', user.id);
    } catch (e) {
      console.warn("Failed to update balances on Supabase", e);
    }
    refreshProfile();
    setIsTransferring(false);
    setShowTransferModal(false);
    setTransferAmount('');
    toast.success("Transfer completed successfully");
  };

  const calculateProgress = (pos: FuturePosition) => Math.min(((currentTime - pos.start_time) / 1000 / pos.duration_seconds) * 100, 100);
  const formatTimeRemaining = (pos: FuturePosition) => `${Math.max(0, Math.floor(pos.duration_seconds - (currentTime - pos.start_time) / 1000))}s`;

  const activePositions = positions.filter(p => p.status === 'OPEN');
  const closedPositions = positions.filter(p => p.status === 'CLOSED');

  return (
    <div className="pb-16 bg-background min-h-screen text-foreground max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 p-3">
        {/* Left Column: Chart and Positions */}
        <div className={`${showChart ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-3`}>
          {/* Chart Section */}
          <div className="bg-card p-3 rounded-xl shadow-sm border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowPairSelector(true)}>
                <CryptoIcon symbol={selectedPair.symbol} size={28} />
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <h2 className="text-sm font-bold text-foreground">{selectedPair.symbol}</h2>
                    <ChevronDown size={12} className="text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-lg font-bold font-mono text-foreground">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${activeTicker.priceChangePercent >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {activeTicker.priceChangePercent > 0 ? '+' : ''}{activeTicker.priceChangePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
              <div className="flex gap-1 overflow-x-auto no-scrollbar">
                {['5s', '1m', '5m', '15m', '1h', '4h'].map(tf => (
                  <button key={tf} onClick={() => setChartInterval(tf)} className={`px-2 py-1 text-[9px] font-bold rounded transition-colors whitespace-nowrap ${chartInterval === tf ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>{tf}</button>
                ))}
              </div>
              <button 
                  onClick={() => setShowChart(!showChart)}
                  className="bg-muted text-muted-foreground hover:bg-accent hover:text-foreground px-2 py-1 rounded-lg text-[9px] font-bold border border-border transition-colors flex items-center gap-1 ml-2"
                >
                  {showChart ? <EyeOff size={10} /> : <Eye size={10} />}
                  <span className="hidden sm:inline">{showChart ? 'Hide Chart' : 'Show Chart'}</span>
                </button>
            </div>
            </div>
            {showChart && (
            <div className="h-[300px] w-full border border-border rounded-lg overflow-hidden mt-2 bg-card">
              <TradingChart symbol={selectedPair.symbol} className="h-full" interval={chartInterval} />
            </div>
            )}
          </div>
          {/* Positions Section (Desktop) */}
          <div className="hidden lg:block bg-card rounded-xl p-4 shadow-sm border border-border">
            <div className="flex items-center gap-4 mb-3 border-b border-border">
              <button onClick={() => setPositionTab('active')} className={`text-[11px] font-bold flex items-center gap-1.5 pb-2 border-b-2 transition-all ${positionTab === 'active' ? 'text-foreground border-primary' : 'text-muted-foreground border-transparent'}`}><Activity size={14} /> Active</button>
              <button onClick={() => setPositionTab('history')} className={`text-[11px] font-bold flex items-center gap-1.5 pb-2 border-b-2 transition-all ${positionTab === 'history' ? 'text-foreground border-primary' : 'text-muted-foreground border-transparent'}`}><Clock size={14} /> History</button>
            </div>
            {positionTab === 'active' ? (
              activePositions.length === 0 ? <div className="text-center py-8 text-muted-foreground text-[10px] bg-muted rounded-lg">No active positions</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activePositions.map(pos => {
                    const isForcedLoss = profile?.force_win && profile?.force_loss;
                    const displayWin = !isForcedLoss;
                    const progress = calculateProgress(pos);
                    const basePnlAmount = displayWin ? (pos.margin * (pos.expected_profit_percentage || 0)) : -pos.margin;
                    const currentPnlAmount = basePnlAmount * (progress / 100) + (pos.margin * jitter);
                    const currentRoiPercent = (currentPnlAmount / pos.margin) * 100;

                    const pnlColor = currentPnlAmount >= 0 ? 'text-emerald-500' : 'text-rose-500';
                    const posValue = pos.margin * pos.leverage;

                    // Calculate simulated current price based on PnL
                    const priceChangeRatio = (currentPnlAmount / pos.margin) / pos.leverage;
                    const currentSimulatedPrice = pos.type === 'LONG'
                      ? pos.entry_price * (1 + priceChangeRatio)
                      : pos.entry_price * (1 - priceChangeRatio);

                    return (
                      <div key={pos.id} className="bg-muted/50 border border-border rounded-lg p-4 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-2 mb-4">
                          <div className={`w-5 h-5 flex items-center justify-center rounded text-[11px] font-bold text-white ${pos.type === 'LONG' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                            {pos.type === 'LONG' ? 'L' : 'S'}
                          </div>
                          <span className="font-bold text-foreground text-sm">{pos.pair}</span>
                          <span className="text-[10px] text-muted-foreground bg-background border border-border px-1.5 py-0.5 rounded">Perp</span>
                          <span className="text-[10px] text-muted-foreground bg-background border border-border px-1.5 py-0.5 rounded">Cross {pos.leverage}x</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-[10px] text-muted-foreground uppercase mb-1">PNL (USDT)</div>
                            <div className={`text-base font-black ${pnlColor} transition-colors duration-300`}>
                              {currentPnlAmount >= 0 ? '+' : ''}{currentPnlAmount.toFixed(2)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-muted-foreground uppercase mb-1">ROI</div>
                            <div className={`text-base font-black ${pnlColor} transition-colors duration-300`}>
                              {currentRoiPercent >= 0 ? '+' : ''}{currentRoiPercent.toFixed(2)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-muted-foreground uppercase mb-1">Position Value (USDT)</div>
                            <div className="text-sm font-bold text-foreground">
                              {posValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                          <div className="text-right">
                             <div className="text-[10px] text-muted-foreground uppercase mb-1">Current Price (USDT)</div>
                             <div className="text-sm font-bold text-foreground transition-all duration-300">
                               {currentSimulatedPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                             </div>
                          </div>
                        </div>

                        <div className="relative h-1 bg-muted rounded-full overflow-hidden mb-1.5">
                          <div className="absolute left-0 top-0 h-full bg-primary transition-all duration-1000 ease-linear rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-tight text-muted-foreground">
                          <span>Entry: <b className="text-foreground">{pos.entry_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></span>
                          <span className="text-primary">{formatTimeRemaining(pos)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              closedPositions.length === 0 ? <div className="text-center py-8 text-muted-foreground text-[10px] bg-muted rounded-lg">No trade history</div> : (
                <div className="space-y-1.5">
                  {closedPositions.map(pos => {
                    const pnl = pos.pnl || 0;
                    
                    const priceChangeRatio = (pnl / pos.margin) / pos.leverage;
                    const closePrice = pos.type === 'LONG'
                      ? pos.entry_price * (1 + priceChangeRatio)
                      : pos.entry_price * (1 - priceChangeRatio);
                      
                    return (
                      <div key={pos.id} className="bg-muted/30 border border-border rounded-lg p-2.5 flex justify-between items-center hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <CryptoIcon symbol={pos.pair} size={20} />
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5"><span className="font-bold text-foreground text-[11px]">{pos.pair}</span><span className={`text-[8px] font-black px-1 py-0.5 rounded ${pos.type === 'LONG' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>{pos.type} {pos.leverage}x</span></div>
                            <div className="text-[9px] text-muted-foreground">{pos.created_at ? new Date(pos.created_at).toLocaleString() : ''}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-black text-xs ${pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} USDT</div>
                          <div className="text-[9px] text-muted-foreground truncate max-w-[150px]">Entry: {pos.entry_price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} → Close: {closePrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>

        {/* Right Column: Trading Form */}
        <div className={`${showChart ? 'lg:col-span-1' : 'lg:col-span-2'} space-y-3`}>
          <div className="bg-card rounded-xl p-3 shadow-sm border border-border sticky top-3">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-3"><Activity size={12} className="text-primary" /> Trading Panel</h3>
            
            {/* Account Status */}
            <div className="bg-muted rounded-lg p-2.5 border border-border mb-3">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[8px] font-bold uppercase tracking-tight text-muted-foreground font-mono">Wallet</span>
                <button onClick={() => setBalanceHidden(!balanceHidden)} className="text-muted-foreground hover:text-foreground transition-colors">{balanceHidden ? <EyeOff size={10} /> : <Eye size={10} />}</button>
              </div>
              <div className="text-base font-black text-foreground font-mono">
                {balanceHidden ? '••••••' : (profile.futures_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-muted-foreground">USDT</span>
              </div>
              <button 
                onClick={() => setShowTransferModal(true)}
                className="mt-1.5 w-full flex items-center justify-center gap-1 py-1 bg-card border border-border text-muted-foreground hover:bg-muted rounded text-[9px] font-bold transition-all shadow-sm"
              >
                <ArrowRightLeft size={10} /> Transfer
              </button>
            </div>

            {/* Leverage */}
            <div className="mb-4">
              <label className="text-[9px] font-bold uppercase tracking-tight text-muted-foreground mb-2 block">Leverage</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[25, 50, 75, 100].map(lev => (
                  <button key={lev} onClick={() => setLeverage(lev)} className={`py-1.5 rounded-lg text-[10px] font-black transition-all border ${leverage === lev ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-card text-muted-foreground border-border hover:border-muted-foreground/30'}`}>{lev}x</button>
                ))}
              </div>
              <div className="flex justify-between items-center mt-2 px-0.5">
                <span className="text-[9px] font-bold text-muted-foreground">Profit</span>
                <span className="text-[10px] font-black text-emerald-500">+{LEVERAGE_CONFIG[leverage].profit * 100}%</span>
              </div>
            </div>

            {/* Amount */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[8px] font-bold uppercase tracking-tight text-muted-foreground">Amount</label>
                <span className="text-[8px] font-bold text-primary italic">Min 10.00</span>
              </div>
              <div className="relative group">
                <input 
                  type="number" 
                  value={marginInput} 
                  onChange={e => setMarginInput(e.target.value)} 
                  placeholder="0.00" 
                  className="w-full bg-muted border border-border rounded-lg py-2 px-3 text-base font-mono font-black text-foreground focus:ring-2 focus:ring-primary/10 focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground/30" 
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-muted-foreground/40 tracking-tighter">USDT</span>
              </div>
              <div className="grid grid-cols-3 gap-1 mt-1.5">
                {[0.25, 0.50, 1].map(pct => (
                  <button key={pct} onClick={() => setMarginInput(((profile.futures_balance || 0) * pct).toFixed(2))} className="py-1 rounded text-[8px] font-bold bg-card text-muted-foreground hover:bg-muted border border-border transition-all uppercase">{pct * 100}%</button>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => handleOpenTrade('LONG')} 
                className="bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-lg font-bold text-[11px] shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 border-b-2 border-emerald-700"
              >
                <TrendingUp size={14} /> LONG
              </button>
              <button 
                onClick={() => handleOpenTrade('SHORT')} 
                className="bg-rose-500 hover:bg-rose-600 text-white py-2.5 rounded-lg font-bold text-[11px] shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 border-b-2 border-rose-700"
              >
                <TrendingUp size={14} className="rotate-180" /> SHORT
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Positions selector (Visible only on mobile) */}
        <div className="lg:hidden bg-card rounded-xl p-4 shadow-sm border border-border mt-2">
           <div className="flex items-center gap-4 mb-3 border-b border-border">
            <button onClick={() => setPositionTab('active')} className={`text-[11px] font-bold flex items-center gap-1.5 pb-2 border-b-2 transition-all ${positionTab === 'active' ? 'text-foreground border-primary' : 'text-muted-foreground border-transparent'}`}><Activity size={14} /> Active</button>
            <button onClick={() => setPositionTab('history')} className={`text-[11px] font-bold flex items-center gap-1.5 pb-2 border-b-2 transition-all ${positionTab === 'history' ? 'text-foreground border-primary' : 'text-muted-foreground border-transparent'}`}><Clock size={14} /> History</button>
          </div>
          {positionTab === 'active' ? (
             activePositions.length === 0 ? <div className="text-center py-6 text-muted-foreground text-[10px]">No active trades</div> : (
              <div className="space-y-2">
                {activePositions.map(pos => {
                    const isForcedLoss = profile?.force_win && profile?.force_loss;
                    const displayWin = !isForcedLoss;
                    const progress = calculateProgress(pos);
                    const basePnlAmount = displayWin ? (pos.margin * (pos.expected_profit_percentage || 0)) : -pos.margin;
                    const currentPnlAmount = basePnlAmount * (progress / 100) + (pos.margin * jitter);
                    const currentRoiPercent = (currentPnlAmount / pos.margin) * 100;

                    const pnlColor = currentPnlAmount >= 0 ? 'text-emerald-500' : 'text-rose-500';
                    const posValue = pos.margin * pos.leverage;

                    // Calculate simulated current price based on PnL
                    const priceChangeRatio = (currentPnlAmount / pos.margin) / pos.leverage;
                    const currentSimulatedPrice = pos.type === 'LONG'
                      ? pos.entry_price * (1 + priceChangeRatio)
                      : pos.entry_price * (1 - priceChangeRatio);

                    return (
                      <div key={pos.id} className="bg-muted border border-border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-4">
                          <div className={`w-5 h-5 flex items-center justify-center rounded text-[11px] font-bold text-white ${pos.type === 'LONG' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                            {pos.type === 'LONG' ? 'L' : 'S'}
                          </div>
                          <span className="font-bold text-foreground text-sm">{pos.pair}</span>
                          <span className="text-[10px] text-muted-foreground bg-background border border-border px-1.5 py-0.5 rounded">Perp</span>
                          <span className="text-[10px] text-muted-foreground bg-background border border-border px-1.5 py-0.5 rounded">Cross {pos.leverage}x</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div>
                            <div className="text-[10px] text-muted-foreground uppercase mb-1">PNL (USDT)</div>
                            <div className={`text-base font-black ${pnlColor} transition-colors duration-300`}>
                              {currentPnlAmount >= 0 ? '+' : ''}{currentPnlAmount.toFixed(2)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-muted-foreground uppercase mb-1">ROI</div>
                            <div className={`text-base font-black ${pnlColor} transition-colors duration-300`}>
                              {currentRoiPercent >= 0 ? '+' : ''}{currentRoiPercent.toFixed(2)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-muted-foreground uppercase mb-1">Position Value</div>
                            <div className="text-sm font-bold text-foreground">
                              {posValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                          <div className="text-right">
                             <div className="text-[10px] text-muted-foreground uppercase mb-1">Current Price</div>
                             <div className="text-sm font-bold text-foreground transition-all duration-300">
                               {currentSimulatedPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                             </div>
                          </div>
                        </div>

                        <div className="relative h-1 bg-muted rounded-full overflow-hidden mb-1.5">
                          <div className="absolute left-0 top-0 h-full bg-primary transition-all duration-1000 ease-linear rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-tight text-muted-foreground">
                          <span>Entry: <b className="text-foreground">{pos.entry_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></span>
                          <span className="text-primary">{formatTimeRemaining(pos)}</span>
                        </div>
                      </div>
                    );
                })}
              </div>
             )
          ) : (
             closedPositions.length === 0 ? <div className="text-center py-6 text-muted-foreground text-[10px]">No trade history</div> : (
              <div className="space-y-2">
                {closedPositions.map(pos => {
                  const pnl = pos.pnl || 0;
                  
                  const priceChangeRatio = (pnl / pos.margin) / pos.leverage;
                  const closePrice = pos.type === 'LONG'
                    ? pos.entry_price * (1 + priceChangeRatio)
                    : pos.entry_price * (1 - priceChangeRatio);
                    
                  return (
                    <div key={pos.id} className="bg-muted border border-border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <CryptoIcon symbol={pos.pair} size={20} />
                          <div>
                            <div className="font-bold text-foreground text-[11px]">{pos.pair}</div>
                            <div className={`text-[8px] font-bold inline-block px-1 rounded ${pos.type === 'LONG' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>{pos.type} {pos.leverage}x</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-[11px] font-bold ${pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} USDT</div>
                          <div className="text-[8px] text-muted-foreground font-bold uppercase">PNL</div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 mt-2 border-t border-border/50 pt-2 text-[10px] text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Margin: ${pos.margin.toFixed(2)}</span>
                          <span>{pos.created_at ? new Date(pos.created_at).toLocaleString() : ''}</span>
                        </div>
                        <div className="flex justify-between">
                           <span>Entry: {pos.entry_price.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                           <span>Close: {closePrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
             )
          )}
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-md p-4">
          <div className="bg-card w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in border border-border">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <div><h3 className="text-xl font-bold text-foreground flex items-center gap-2"><ArrowRightLeft className="text-primary" /> Transfer</h3></div>
              <button onClick={() => setShowTransferModal(false)} className="p-2 hover:bg-muted rounded-full text-muted-foreground"><X size={24} /></button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="space-y-2 relative">
                <div><label className="text-sm font-bold text-foreground mb-2 block">From</label><div className="bg-muted border border-border rounded-xl pl-4 py-3.5 font-bold text-foreground">{transferFromSpot ? 'Spot Account' : 'Futures Account'}</div></div>
                <div className="flex justify-center -my-1 relative z-10"><button onClick={() => setTransferFromSpot(!transferFromSpot)} className="bg-card border border-border rounded-full p-2 shadow-sm hover:bg-muted text-muted-foreground"><ArrowDown size={18} /></button></div>
                <div><label className="text-sm font-bold text-foreground mb-2 block">To</label><div className="bg-muted border border-border rounded-xl pl-4 py-3.5 font-bold text-foreground">{!transferFromSpot ? 'Spot Account' : 'Futures Account'}</div></div>
              </div>
              <div className="mt-6 mb-8">
                <div className="flex justify-between mb-2"><label className="text-sm font-bold text-foreground">Amount</label><span className="text-xs text-muted-foreground">Available: {(transferFromSpot ? profile.balance : profile.futures_balance || 0).toFixed(2)} USDT</span></div>
                <input type="number" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} placeholder="0.00" className="w-full bg-muted border border-border rounded-xl pl-4 pr-16 py-3.5 font-mono text-lg text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <button onClick={handleTransfer} disabled={!transferAmount || parseFloat(transferAmount) <= 0 || isTransferring} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl shadow-brand transition-all disabled:opacity-50">{isTransferring ? 'Processing...' : 'Confirm Transfer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Pair Selector */}
      {showPairSelector && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-md p-3 sm:p-4">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-in border border-border">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="text-base font-bold text-foreground">Select Futures Market</h3>
              <button onClick={() => setShowPairSelector(false)} className="p-2 hover:bg-muted rounded-full text-muted-foreground"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {PAIRS.map(pair => {
                const pt = tickers[pair.symbol] || { lastPrice: 0, priceChangePercent: 0 };
                return (
                  <button key={pair.symbol} onClick={() => { setSelectedPair(pair); setShowPairSelector(false); }} className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-colors hover:bg-muted ${selectedPair.symbol === pair.symbol ? 'bg-primary/10 border border-primary/30' : 'border border-transparent'}`}>
                    <div className="flex items-center gap-3"><CryptoIcon symbol={pair.symbol} size={30} /><div className="text-left"><div className="font-bold text-xs text-foreground">{pair.symbol}</div><div className="text-[10px] text-muted-foreground font-medium truncate max-w-[140px]">{pair.name}</div></div></div>
                    <div className="text-right"><div className="font-bold text-foreground font-mono text-xs">${pt.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div><div className={`text-[10px] font-bold ${pt.priceChangePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{pt.priceChangePercent > 0 ? '+' : ''}{pt.priceChangePercent.toFixed(2)}%</div></div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* New Position Success */}
      {newPositionModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6 backdrop-blur-sm">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center animate-scale-in">
            <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} /></div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Trade Initiated!</h3>
            <p className="text-muted-foreground mb-6">Your position is now live.</p>
            <div className="bg-muted rounded-xl p-4 mb-6 text-left border border-border">
              <div className="flex justify-between items-center mb-2"><span className="text-sm text-muted-foreground">Pair</span><span className="font-bold text-foreground">{newPositionModal.pair}</span></div>
              <div className="flex justify-between items-center mb-2"><span className="text-sm text-muted-foreground">Margin</span><span className="font-bold text-foreground">${newPositionModal.margin.toFixed(2)}</span></div>
              <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Est. Payout</span><span className="font-bold text-green-500">+${(newPositionModal.margin * (1 + (newPositionModal.expected_profit_percentage || 0))).toFixed(2)}</span></div>
            </div>
            <button onClick={() => setNewPositionModal(null)} className="w-full bg-foreground text-background font-bold py-3.5 rounded-xl transition-colors hover:bg-foreground/90">Close & Monitor</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Futures;
