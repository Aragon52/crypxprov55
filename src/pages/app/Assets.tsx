import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getFallbackUserProfile } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CryptoIcon } from '@/components/shared/CryptoIcon';
import type { UserProfile, UserAsset } from '@/types';
import { toast } from 'sonner';
import { getReferrerForUser, getAdminWalletAddress } from '@/lib/adminPermissions';
import { Eye, EyeOff, ArrowDown, ArrowUp, ArrowRightLeft, X, Copy, CheckCircle, AlertTriangle, ChevronDown, Search, Lock, Wallet, RefreshCw } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { AnimatedBalance } from '@/components/shared/AnimatedBalance';
import { ImageAttachmentField, ImageAttachmentValue } from '@/components/shared/ImageAttachmentField';

import { marketService } from '@/services/market';

const DEPOSIT_OPTIONS = [
  { label: 'Bitcoin (BTC)', symbol: 'BTC', network: 'BTC' },
  { label: 'Ethereum (ETH)', symbol: 'ETH', network: 'ERC20' },
  { label: 'Tether (USDT-ERC20)', symbol: 'USDT', network: 'ERC20' },
  { label: 'Tether (USDT-TRC20)', symbol: 'USDT', network: 'TRC20' },
  { label: 'Tether (USDT-BEP20)', symbol: 'USDT', network: 'BEP20' },
  { label: 'XRP', symbol: 'XRP', network: 'RIPPLE' },
  { label: 'BNB (BEP20)', symbol: 'BNB', network: 'BEP20' },
  { label: 'Solana (SOL)', symbol: 'SOL', network: 'SOLANA' },
];

const Assets = () => {
  const { user, profile: authProfile, refreshProfile, updateProfileLocally } = useAuth();
  const navigate = useNavigate();
  const profile = authProfile || getFallbackUserProfile(user);
  const [assets, setAssets] = useState<UserAsset[]>([]);
  const [activeModal, setActiveModal] = useState<'deposit' | 'withdraw' | 'transfer' | 'history' | null>(null);
  const [historyTab, setHistoryTab] = useState<'deposits' | 'withdrawals'>('deposits');
  const [historyData, setHistoryData] = useState<any[]>([]);

  // We should load history when modal opens.
  const [balanceHidden, setBalanceHidden] = useState(false);

  // Deposit state
  const [selectedToken, setSelectedToken] = useState(DEPOSIT_OPTIONS[0]);
  const [depositAddress, setDepositAddress] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositImage, setDepositImage] = useState<ImageAttachmentValue | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [tokenSearchQuery, setTokenSearchQuery] = useState('');

  // Transfer state
  const [transferFrom, setTransferFrom] = useState<'Spot' | 'Futures'>('Spot');
  const [transferAmount, setTransferAmount] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Withdraw state
  const [withdrawToken, setWithdrawToken] = useState('BTC');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPassword, setWithdrawPassword] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [prices, setPrices] = useState<Record<string, number>>({ 
    BTC: 89500, ETH: 4850, USDT: 1, BNB: 820, SOL: 245, XRP: 1.45,
    AUR: 12.5, VTX: 4.8, NEX: 0.95, GLX: 22.4, PHX: 1.25, ZEL: 0.45, 
    CRY: 8.5, ION: 1.15, NOVA: 0.85, LYN: 0.35
  });

  const loadData = useCallback(async () => {
    if (!user) return;
    refreshProfile();
    let localCache: UserAsset[] = [];
    const stored = localStorage.getItem(`user_assets_${user.id}`);
    if (stored) {
      try {
        localCache = JSON.parse(stored);
        if (Array.isArray(localCache) && localCache.length > 0) {
          setAssets(localCache);
        }
      } catch (e) {
        console.error("Failed to parse cached assets in Assets.tsx", e);
      }
    }

    try {
      const { data, error } = await supabase.from('user_assets').select('*').eq('user_id', user.id);
      if (!error && data) {
        setAssets(data as UserAsset[]);
        localStorage.setItem(`user_assets_${user.id}`, JSON.stringify(data));
      } else if (localCache.length > 0) {
        setAssets(localCache);
      }
    } catch (e) {
      console.warn("Could not fetch user assets", e);
    }
  }, [user, refreshProfile]);

  useEffect(() => {
    loadData();
    
    marketService.getPrices().then(setPrices).catch(() => {});
    const interval = setInterval(() => {
      marketService.getPrices().then(setPrices).catch(() => {});
    }, 3000);

    if (!user) return () => clearInterval(interval);

    // Subscribe to profile changes to catch real-time balance modifications
    const profileChannel = supabase
      .channel(`assets-profile-${user.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles', 
        filter: `id=eq.${user.id}` 
      }, () => {
        refreshProfile().catch(() => {});
      })
      .subscribe();

    // Subscribe to assets updates
    const assetsChannel = supabase
      .channel(`assets-user_assets-${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'user_assets', 
        filter: `user_id=eq.${user.id}` 
      }, () => {
        supabase.from('user_assets').select('*').eq('user_id', user.id).then(({ data }) => {
          if (data) setAssets(data as UserAsset[]);
        }).catch(() => {});
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(assetsChannel);
    };
  }, [user, loadData, refreshProfile]);

  useEffect(() => {
    if (activeModal === 'history') {
      const fetchHistory = async () => {
        if (!user) return;
        const table = historyTab === 'deposits' ? 'deposits' : 'withdrawals';
        const { data } = await supabase.from(table).select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        setHistoryData(data || []);
      };
      fetchHistory();
    }
  }, [activeModal, historyTab, user]);

  useEffect(() => {
    if (activeModal === 'deposit') {
      const referrerId = getReferrerForUser(user?.email, user?.id);
      const customAddress = referrerId 
        ? getAdminWalletAddress(referrerId, selectedToken.symbol, selectedToken.network) 
        : null;
        
      if (customAddress) {
        setDepositAddress(customAddress);
      } else {
        supabase.from('admin_wallets').select('address').eq('symbol', selectedToken.symbol).eq('network', selectedToken.network).single()
          .then(({ data }) => setDepositAddress(data?.address || 'Address not configured'))
          .catch(() => setDepositAddress('Address not configured'));
      }
    }
  }, [selectedToken, activeModal, user]);

  const handleCopy = () => { navigator.clipboard.writeText(depositAddress); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const handleDepositSubmit = async () => {
    if (!user || !depositAmount || !depositImage) {
      toast.error('Please enter the deposit amount and attach a payment screenshot.');
      return;
    }
    setIsSubmitting(true);
    
    try {
      let finalScreenshotUrl = depositImage.dataUrl;

      // Try uploading to Supabase Storage if bucket exists
      try {
        const fileExt = depositImage.name.split('.').pop() || 'jpg';
        const fileName = `${user.id}/deposit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('receipts')
          .upload(fileName, depositImage.file, { upsert: true });

        if (!uploadErr && uploadData) {
          const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(uploadData.path);
          if (publicUrl) {
            finalScreenshotUrl = publicUrl;
          }
        }
      } catch {
        // Fallback to compressed base64 dataUrl (safely compressed < 200KB)
      }

      // Construct payload
      const payload: any = {
        user_id: user.id, 
        asset: selectedToken.symbol, 
        network: selectedToken.network,
        amount: parseFloat(depositAmount), 
        address: depositAddress,
        status: 'PENDING',
        screenshot_url: finalScreenshotUrl
      };

      const { error } = await supabase.from('deposits').insert(payload);
      
      // Handle specific PGRST204 column missing error by retrying without screenshot
      if (error && error.code === 'PGRST204' && error.message.includes('screenshot_url')) {
        console.warn("Retrying deposit without screenshot_url as column is missing in schema");
        delete payload.screenshot_url;
        const { error: retryError } = await supabase.from('deposits').insert(payload);
        if (retryError) {
          console.error("Retry deposit error:", retryError);
          toast.error("Failed to submit deposit: " + retryError.message);
          setIsSubmitting(false);
          return;
        }
      } else if (error) {
        console.error("Deposit error:", error);
        toast.error("Failed to submit deposit: " + error.message);
        setIsSubmitting(false);
        return;
      }
      
      setIsSubmitting(false);
      setDepositSuccess(true);
    } catch (err: any) {
      console.error("Deposit submission error:", err);
      toast.error("Failed to submit deposit: " + (err.message || 'Unexpected error'));
      setIsSubmitting(false);
    }
  };

  const closeDepositModal = () => { setDepositSuccess(false); setActiveModal(null); setDepositAmount(''); setDepositImage(null); setShowTokenSelector(false); };

  const handleTransfer = async () => {
    if (!user || !profile || !transferAmount) return;
    const val = parseFloat(transferAmount);
    if (isNaN(val) || val <= 0) return;
    if (transferFrom === 'Spot' && val > (profile.balance || 0)) { toast.error("Insufficient Balance"); return; }
    if (transferFrom === 'Futures' && val > (profile.futures_balance || 0)) { toast.error("Insufficient Balance"); return; }
    setIsTransferring(true);
    let newSpot = profile.balance || 0, newFutures = profile.futures_balance || 0;
    if (transferFrom === 'Spot') { newSpot -= val; newFutures += val; } else { newFutures -= val; newSpot += val; }
    await supabase.from('profiles').update({ balance: newSpot, futures_balance: newFutures }).eq('id', user.id);
    updateProfileLocally({ balance: newSpot, futures_balance: newFutures });
    refreshProfile();
    setIsTransferring(false);
    setActiveModal(null);
    setTransferAmount('');
    toast.success("Transfer completed successfully");
  };

  const handleWithdrawSubmit = async () => {
    if (!user || !profile || !withdrawAmount || !withdrawAddress) return;
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) return;

    const available = withdrawToken === 'USDT'
      ? (profile.balance || 0)
      : (assets.find(a => a.symbol === withdrawToken)?.amount || 0);
    if (amt > available) { toast.error('Insufficient balance'); return; }

    setIsWithdrawing(true);
    const network = withdrawToken === 'BTC' ? 'BTC' : withdrawToken === 'ETH' ? 'ERC20' : 'ERC20';
    const { error } = await supabase.from('withdrawals').insert({
      user_id: user.id,
      asset: withdrawToken,
      network,
      address: withdrawAddress,
      amount: amt,
      status: 'PENDING'
    });

    if (error) {
      setIsWithdrawing(false);
      toast.error('Failed to submit withdrawal: ' + error.message);
      return;
    }

    // Hold the funds: deduct immediately (refunded on reject by admin)
    if (withdrawToken === 'USDT') {
      const newBal = (profile.balance || 0) - amt;
      await supabase.from('profiles').update({ balance: newBal }).eq('id', user.id);
      updateProfileLocally({ balance: newBal });
      refreshProfile();
    } else {
      const a = assets.find(x => x.symbol === withdrawToken);
      if (a) {
        const currentAmount = Number(a.amount || 0);
        const newAmount = currentAmount - amt;
        if (newAmount <= 1e-8) {
          await supabase.from('user_assets').delete().eq('id', a.id);
          setAssets(prev => prev.filter(x => x.id !== a.id));
        } else {
          await supabase.from('user_assets').update({ amount: newAmount }).eq('id', a.id);
          setAssets(prev => prev.map(x => x.id === a.id ? { ...x, amount: newAmount } : x));
        }
      }
    }

    setIsWithdrawing(false);
    setActiveModal(null);
    toast.success('Withdrawal request submitted. Awaiting admin approval.');
    setWithdrawAmount(''); setWithdrawAddress(''); setWithdrawPassword('');
  };

  // Filter tokens for selector
  const filteredTokens = DEPOSIT_OPTIONS.filter(opt =>
    opt.label.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
    opt.symbol.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
    opt.network.toLowerCase().includes(tokenSearchQuery.toLowerCase())
  );

  const cryptoAssetsValue = assets.reduce((acc, curr) => {
    if (curr.symbol === 'USDT') return acc;
    const value = curr.amount * (prices[curr.symbol] || 0);
    return acc + (value >= 0.01 ? value : 0);
  }, 0);

  const spotBalance = (profile.balance || 0) + cryptoAssetsValue;

  const totalAssetValue = spotBalance + (profile.futures_balance || 0) + (profile.staked_balance || 0);

  return (
    <div className="pb-16 bg-background min-h-screen text-foreground pt-4">
      <div className="p-4">
        {/* Balance Card */}
        <div className="bg-card rounded-2xl p-5 mb-4 overflow-hidden relative shadow-lg border border-border">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-2xl opacity-50" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                <Wallet size={12} className="text-primary" /> Total Balance
              </div>
              <button 
                onClick={() => setBalanceHidden(!balanceHidden)} 
                className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center text-foreground hover:bg-foreground/20 transition-all active:scale-90"
              >
                {balanceHidden ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>
            <div className="flex items-baseline gap-1.5 mb-6">
              <span className="text-primary font-bold text-base opacity-60">$</span>
              <AnimatedBalance 
                value={totalAssetValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                hidden={balanceHidden} 
                className="text-2xl font-black text-foreground tracking-tight"
              />
              <span className="text-[10px] font-black text-primary px-1.5 py-0.5 rounded bg-primary/10">USD</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[{ label: 'Spot', val: spotBalance }, { label: 'Futures', val: profile.futures_balance }, { label: 'Earn', val: profile.staked_balance }].map(item => (
                <div key={item.label} className="bg-foreground/5 p-2.5 rounded-xl border border-foreground/10">
                  <div className="text-[9px] text-muted-foreground mb-0.5 uppercase font-bold">{item.label}</div>
                  <div className="font-bold text-foreground text-xs truncate">
                    <span className="text-[9px] opacity-40 mr-0.5">$</span>
                    <AnimatedBalance value={(item.val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} hidden={balanceHidden} className="text-xs font-bold" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          <button onClick={() => { setDepositSuccess(false); setDepositAmount(''); setActiveModal('deposit'); }} className="flex flex-col items-center gap-1.5 group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-active:scale-95 transition-all shadow-sm"><ArrowDown size={18} /></div>
            <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">Deposit</span>
          </button>
          <button onClick={() => { setWithdrawAmount(''); setWithdrawAddress(''); setWithdrawPassword(''); setActiveModal('withdraw'); }} className="flex flex-col items-center gap-1.5 group">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center border border-destructive/20 group-active:scale-95 transition-all shadow-sm"><ArrowUp size={18} /></div>
            <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">Withdraw</span>
          </button>
          <button onClick={() => { setTransferAmount(''); setActiveModal('transfer'); }} className="flex flex-col items-center gap-1.5 group">
            <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center border border-border group-active:scale-95 transition-all shadow-sm"><ArrowRightLeft size={18} /></div>
            <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">Transfer</span>
          </button>
          <button onClick={() => { setHistoryTab('deposits'); setActiveModal('history'); }} className="flex flex-col items-center gap-1.5 group">
            <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center border border-border group-active:scale-95 transition-all shadow-sm">
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">History</span>
          </button>
          <button onClick={() => loadData()} className="flex flex-col items-center gap-1.5 group">
            <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center border border-border group-active:scale-95 transition-all shadow-sm"><RefreshCw size={18} /></div>
            <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">Refresh</span>
          </button>
        </div>

        {/* Assets List */}
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">Asset Details</h3>
        <div className="space-y-2">
          {/* ALWAYS SHOW MAJOR ASSETS */}
          <div className="flex items-center justify-between p-3 bg-card rounded-xl border border-border shadow-sm">
            <div className="flex items-center gap-2.5"><CryptoIcon symbol="USDT" size={28} /><div><div className="font-bold text-foreground text-sm">USDT</div><div className="text-[10px] text-muted-foreground font-medium font-mono"><AnimatedBalance value={`${(profile.balance || 0).toFixed(2)}`} hidden={balanceHidden} /> Available</div></div></div>
            <div className="text-right"><div className="font-bold text-foreground text-sm font-mono"><AnimatedBalance value={`$${(profile.balance || 0).toFixed(2)}`} hidden={balanceHidden} /></div><div className="text-[10px] text-muted-foreground font-bold uppercase">Price: $1.00</div></div>
          </div>

          {assets.map(asset => {
            const sym = asset.symbol;
            const amt = Number(asset.amount || 0);
            const fiatValue = amt * (prices[sym] || 0);
            
            // Allow 0.00 for USDT if it's the main balance, but for others, hide if visually zero or zero dust
            const formattedAmt = amt.toFixed(4);
            if (sym !== 'USDT' && (fiatValue < 0.01 || formattedAmt === '0.0000')) return null;
            if (sym === 'USDT') return null; // We already showed USDT above manually

            return (
              <div key={asset.id} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border shadow-sm">
                <div className="flex items-center gap-2.5">
                  <CryptoIcon symbol={sym} size={28} />
                  <div>
                    <div className="font-bold text-foreground text-sm">{sym}</div>
                    <div className="text-[10px] text-muted-foreground font-medium font-mono">
                      <AnimatedBalance value={`${amt.toFixed(4)}`} hidden={balanceHidden} /> Available
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-foreground text-sm font-mono">
                    <AnimatedBalance value={`$${fiatValue.toFixed(2)}`} hidden={balanceHidden} />
                  </div>
                  <div className="text-[10px] text-muted-foreground font-bold uppercase">
                    Price: ${(prices[sym] || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* HISTORY MODAL / BOTTOM SHEET */}
      {activeModal === 'history' && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end justify-center backdrop-blur-md sm:p-4 sm:items-center transition-all bg-opacity-100">
          <div className="bg-card w-full sm:max-w-md rounded-t-[24px] sm:rounded-[24px] shadow-2xl flex flex-col h-[85vh] sm:h-[600px] animate-slide-up sm:animate-scale-in relative border border-border">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="text-lg font-bold text-foreground">Transaction History</h3>
              <button onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-muted rounded-full text-muted-foreground transition-colors"><X size={20} /></button>
            </div>
            
            <div className="flex px-4 pt-4 shrink-0 gap-2">
              <button 
                onClick={() => setHistoryTab('deposits')}
                className={`flex-1 py-2 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors ${historyTab === 'deposits' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                Deposits
              </button>
              <button 
                onClick={() => setHistoryTab('withdrawals')}
                className={`flex-1 py-2 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors ${historyTab === 'withdrawals' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                Withdrawals
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              <div className="space-y-3">
                {historyData.length === 0 ? (
                  <div className="py-20 text-center text-muted-foreground">
                    <p className="text-sm font-medium">No {historyTab} found</p>
                  </div>
                ) : (
                  historyData.map(item => (
                    <div key={item.id} className="bg-muted/30 border border-border p-3 rounded-xl flex justify-between items-center">
                      <div className="flex gap-3 items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${historyTab === 'deposits' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                          {historyTab === 'deposits' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{item.asset}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">{new Date(item.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-mono font-bold ${historyTab === 'deposits' ? 'text-emerald-500' : 'text-foreground'}`}>
                          {historyTab === 'deposits' ? '+' : '-'}{item.amount}
                        </p>
                        <p className={`text-[10px] uppercase font-bold tracking-wider ${item.status === 'APPROVED' || item.status === 'SUCCESS' ? 'text-emerald-500' : item.status === 'REJECTED' || item.status === 'FAILED' ? 'text-rose-500' : 'text-amber-500'}`}>
                          {item.status}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEPOSIT MODAL */}
      {activeModal === 'deposit' && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center backdrop-blur-md p-4">
          <div className="bg-card w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in relative border border-border">
            <div className="p-4 border-b border-border flex justify-between items-center"><h3 className="text-lg font-bold text-foreground">Deposit</h3><button onClick={closeDepositModal} className="p-1.5 hover:bg-muted rounded-full text-muted-foreground transition-colors"><X size={20} /></button></div>
            <div className="p-5 flex-1 overflow-y-auto">
              {depositSuccess ? (
                <div className="flex flex-col items-center justify-center h-full py-6 text-center">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-4"><CheckCircle size={32} /></div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Success</h3>
                  <p className="text-[11px] text-muted-foreground px-4 leading-normal mb-6">Deposit is being processed. Please wait for confirmation.</p>
                  <button onClick={closeDepositModal} className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm">Done</button>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Select Token</label>
                    <button onClick={() => setShowTokenSelector(true)} className="w-full bg-muted border border-border rounded-xl py-2.5 px-3 flex items-center justify-between hover:bg-accent transition-colors font-bold text-foreground text-xs">
                      <div className="flex items-center gap-2.5"><CryptoIcon symbol={selectedToken.symbol} size={20} /><div className="text-left"><div className="font-bold text-foreground text-[11px]">{selectedToken.symbol}</div><div className="text-[9px] text-muted-foreground font-bold uppercase">{selectedToken.network}</div></div></div>
                      <ChevronDown className="text-muted-foreground/50" size={14} />
                    </button>
                  </div>

                  <div className="flex justify-center mb-5">
                    <div className="p-3 border border-border rounded-xl shadow-sm bg-white">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(depositAddress)}&color=000000&bgcolor=ffffff`} alt="Deposit QR" className="w-32 h-32 object-contain" />
                    </div>
                  </div>

                  <div className="bg-muted rounded-lg p-2 text-center mb-4"><span className="text-muted-foreground text-[10px] uppercase font-bold">Network: </span><span className="font-black text-foreground text-xs">{selectedToken.network}</span></div>

                  <div className="mb-4">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Address</label>
                    <div className="flex gap-2">
                      <input readOnly value={depositAddress} className="flex-1 bg-muted border border-primary/30 rounded-xl px-3 py-2.5 text-[10px] font-mono text-foreground" />
                      <button onClick={handleCopy} className="px-3 border border-border rounded-xl hover:bg-muted text-muted-foreground">{copied ? <CheckCircle size={18} className="text-emerald-500" /> : <Copy size={18} />}</button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <ImageAttachmentField
                      label="Payment Screenshot / Transfer Proof"
                      required
                      value={depositImage}
                      onChange={setDepositImage}
                      description="Upload photo or screenshot of your payment transfer."
                    />
                  </div>

                  <div className="mb-5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Amount ({selectedToken.symbol})</label>
                    <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="0.00" className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 font-mono text-base text-foreground focus:ring-2 focus:ring-primary/10 focus:border-primary/50 outline-none" />
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-6 flex gap-2.5">
                    <AlertTriangle className="text-amber-500 shrink-0" size={14} />
                    <p className="text-[9px] text-amber-500 font-bold leading-tight">Send only <strong>{selectedToken.symbol} ({selectedToken.network})</strong>. Incorrect assets will be lost permanently.</p>
                  </div>

                  <button onClick={handleDepositSubmit} disabled={isSubmitting || !depositAmount || !depositImage} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl shadow-sm transition-all disabled:opacity-50 text-sm">Submit Deposit Request</button>
                </>
              )}
            </div>

            {/* TOKEN SELECTOR OVERLAY */}
            {showTokenSelector && (
              <div className="absolute inset-0 bg-card z-20 flex flex-col">
                <div className="p-4 border-b border-border flex justify-between items-center sticky top-0 bg-card">
                  <h3 className="text-lg font-bold text-foreground">Select Deposit Asset</h3>
                  <button onClick={() => setShowTokenSelector(false)} className="p-2 hover:bg-muted rounded-full text-muted-foreground"><X size={20} /></button>
                </div>
                <div className="p-4 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
                    <input type="text" placeholder="Search token or network..." value={tokenSearchQuery} onChange={e => setTokenSearchQuery(e.target.value)} className="w-full bg-muted border border-border rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:border-primary/50 transition-colors" autoFocus />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 pb-20">
                  {filteredTokens.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-xs">No tokens found</div>
                  ) : filteredTokens.map((opt, idx) => (
                    <button key={idx} onClick={() => { setSelectedToken(opt); setShowTokenSelector(false); setTokenSearchQuery(''); }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-muted mb-1 ${JSON.stringify(selectedToken) === JSON.stringify(opt) ? 'bg-primary/10 border border-primary/20' : 'border border-transparent'}`}>
                      <div className="flex items-center gap-3">
                        <CryptoIcon symbol={opt.symbol} size={28} />
                        <div className="text-left">
                          <div className="font-bold text-foreground text-sm">{opt.label.split('(')[0]}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-muted-foreground">{opt.symbol}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-muted text-muted-foreground rounded uppercase tracking-tighter">{opt.network}</span>
                          </div>
                        </div>
                      </div>
                      {JSON.stringify(selectedToken) === JSON.stringify(opt) && <CheckCircle size={18} className="text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* WITHDRAW MODAL */}
      {activeModal === 'withdraw' && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center backdrop-blur-md p-4">
          <div className="bg-card w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in border border-border">
            <div className="p-4 border-b border-border flex justify-between items-center"><h3 className="text-lg font-bold text-foreground">Withdrawal</h3><button onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-muted rounded-full text-muted-foreground transition-colors"><X size={20} /></button></div>
            <div className="p-5 flex-1 overflow-y-auto">
              {/* Token Select */}
              <div className="mb-4">
                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Select Token</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><CryptoIcon symbol={withdrawToken} size={18} /></div>
                  <select className="w-full bg-muted border border-border rounded-xl py-2.5 pl-9 pr-9 font-bold text-foreground text-xs appearance-none focus:outline-none focus:border-primary/50" value={withdrawToken} onChange={e => setWithdrawToken(e.target.value)}>
                    <option value="BTC">BTC (Bitcoin)</option>
                    <option value="ETH">ETH (Ethereum)</option>
                    <option value="USDT">USDT (Tether)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/50" size={14} />
                </div>
              </div>

              {/* Address */}
              <div className="mb-4">
                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Address</label>
                <input type="text" value={withdrawAddress} onChange={e => setWithdrawAddress(e.target.value)} placeholder={`Enter ${withdrawToken} address`} className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50" />
              </div>

              {/* Amount */}
              {(() => {
                const availableAmount = withdrawToken === 'USDT'
                  ? (profile.balance || 0)
                  : (assets.find(a => a.symbol === withdrawToken)?.amount || 0);
                const decimals = withdrawToken === 'USDT' ? 2 : 8;
                return (
                  <div className="mb-4">
                    <div className="flex justify-between mb-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Amount</label>
                      <span className="text-[9px] text-muted-foreground font-bold uppercase">
                        Available: <span className="font-mono text-foreground">{availableAmount.toFixed(decimals)}</span>
                      </span>
                    </div>
                    <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="0.00" className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 font-mono text-base text-foreground focus:outline-none focus:border-primary/50 mb-2" />
                    <div className="flex gap-1.5">
                      {[0.25, 0.5, 0.75, 1].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setWithdrawAmount((availableAmount * pct).toFixed(decimals))}
                          disabled={availableAmount <= 0}
                          className="flex-1 py-1 rounded bg-muted border border-border text-[9px] font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
                        >
                          {pct === 1 ? 'MAX' : `${pct * 100}%`}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Password */}
              <div className="mb-5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Security Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={14} />
                  <input type="password" value={withdrawPassword} onChange={e => setWithdrawPassword(e.target.value)} placeholder="Enter password" className="w-full bg-muted border border-border rounded-xl pl-9 pr-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50" />
                </div>
              </div>

              {/* Fee summary */}
              <div className="bg-muted rounded-xl p-3 mb-6 text-[10px] border border-border">
                <div className="flex justify-between mb-1"><span className="text-muted-foreground font-bold uppercase">Network</span><span className="font-bold text-foreground uppercase">{withdrawToken === 'BTC' ? 'Bitcoin' : withdrawToken === 'ETH' ? 'ERC20' : 'TRC20'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground font-bold uppercase">Fee</span><span className="font-bold text-destructive font-mono">{withdrawToken === 'BTC' ? '0.0005 BTC' : withdrawToken === 'ETH' ? '0.005 ETH' : '1.00 USDT'}</span></div>
              </div>

              <button onClick={handleWithdrawSubmit} disabled={isWithdrawing || !withdrawAmount || !withdrawAddress} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl shadow-sm transition-all disabled:opacity-50 text-sm">Confirm Withdrawal</button>
            </div>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {activeModal === 'transfer' && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center backdrop-blur-md p-4">
          <div className="bg-card w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in border border-border">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div><h3 className="text-lg font-bold text-foreground flex items-center gap-2"><ArrowRightLeft className="text-primary" size={18} /> Transfer</h3></div>
              <button onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-muted rounded-full text-muted-foreground transition-colors"><X size={20} /></button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              <div className="space-y-1.5 relative">
                <div><label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">From</label><div className="bg-muted border border-border rounded-lg pl-3 py-2 text-xs font-bold text-foreground">{transferFrom === 'Spot' ? 'Spot Wallet' : 'Futures Wallet'}</div></div>
                <div className="flex justify-center -my-1.5 relative z-10"><button onClick={() => setTransferFrom(transferFrom === 'Spot' ? 'Futures' : 'Spot')} className="bg-muted border border-border rounded-full p-1.5 shadow-sm hover:bg-accent text-muted-foreground"><ArrowDown size={14} /></button></div>
                <div><label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">To</label><div className="bg-muted border border-border rounded-lg pl-3 py-2 text-xs font-bold text-foreground">{transferFrom === 'Spot' ? 'Futures Wallet' : 'Spot Wallet'}</div></div>
              </div>
              <div className="mt-5 mb-6">
                <div className="flex justify-between mb-1.5"><label className="text-[10px] font-bold text-muted-foreground uppercase">Amount</label><span className="text-[10px] text-muted-foreground font-bold uppercase">Available: <span className="text-foreground">{(transferFrom === 'Spot' ? profile.balance : profile.futures_balance || 0).toFixed(2)}</span></span></div>
                <input type="number" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} placeholder="0.00" className="w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 font-mono text-base text-foreground focus:ring-2 focus:ring-primary/10 focus:border-primary/50 outline-none" />
              </div>
              <button onClick={handleTransfer} disabled={isTransferring || !transferAmount} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl shadow-sm transition-all disabled:opacity-50 text-sm">Confirm Transfer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;
