import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getFallbackUserProfile } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { UserProfile } from '@/types';
import { TrendingUp, Lock, ArrowRightLeft, Plus, X, Wallet } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';

const FIXED_DURATIONS = [{ label: '10d', days: 10 }, { label: '30d', days: 30 }, { label: '90d', days: 90 }, { label: '180d', days: 180 }];

const Earn = () => {
  const { user, profile: authProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const profile = authProfile || getFallbackUserProfile(user);
  const [showStake, setShowStake] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [stakeType, setStakeType] = useState<'fixed' | 'flexible'>('fixed');
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState(30);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transferFromSpot, setTransferFromSpot] = useState(true);

  useEffect(() => {
    if (!user) return;
    refreshProfile();
  }, [user, refreshProfile]);

  const handleConfirmStake = async () => {
    if (!user) {
      toast.info("Please sign in to stake assets");
      navigate("/auth");
      return;
    }
    if (!profile || !amount) return;
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0 || val > (profile.balance || 0)) { toast.error("Insufficient Balance"); return; }
    setIsProcessing(true);
    const newSpot = (profile.balance || 0) - val;
    const newStaked = (profile.staked_balance || 0) + val;
    try {
      await supabase.from('profiles').update({ balance: newSpot, staked_balance: newStaked }).eq('id', user.id);
    } catch (e) {
      console.warn("Failed to update stake in Supabase", e);
    }
    refreshProfile();
    setIsProcessing(false);
    setShowStake(false);
    setAmount('');
    toast.success(`${stakeType === 'fixed' ? 'Fixed' : 'Flexible'} staking initiated`);
  };

  const handleTransfer = async () => {
    if (!user) {
      toast.info("Please sign in to transfer assets");
      navigate("/auth");
      return;
    }
    if (!profile || !amount) return;
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    if (transferFromSpot && val > (profile.balance || 0)) { toast.error("Insufficient Spot Balance"); return; }
    if (!transferFromSpot && val > (profile.staked_balance || 0)) { toast.error("Insufficient Earn Balance"); return; }
    setIsProcessing(true);
    let newSpot = profile.balance || 0, newStaked = profile.staked_balance || 0;
    if (transferFromSpot) { newSpot -= val; newStaked += val; } else { newStaked -= val; newSpot += val; }
    try {
      await supabase.from('profiles').update({ balance: newSpot, staked_balance: newStaked }).eq('id', user.id);
    } catch (e) {
      console.warn("Failed to update balances on Supabase", e);
    }
    refreshProfile();
    setIsProcessing(false);
    setShowTransfer(false);
    setAmount('');
    toast.success("Transfer completed successfully");
  };

  return (
    <div className="pb-24 bg-background min-h-screen text-foreground">
      <div className="bg-card px-4 py-2 flex items-center justify-end border-b border-border sticky top-0 z-30 shadow-sm backdrop-blur-md bg-card/90">
        <div className="flex gap-1.5">
          <button onClick={() => { setAmount(''); setShowTransfer(true); }} className="px-2.5 py-1.5 rounded-lg border border-border text-[10px] font-bold text-foreground hover:bg-muted flex items-center gap-1.5"><ArrowRightLeft size={12} /> Transfer</button>
          <button onClick={() => { setStakeType('fixed'); setAmount(''); setShowStake(true); }} className="px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold hover:bg-primary/90 shadow-sm flex items-center gap-1.5"><Plus size={12} /> Stake</button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-muted-foreground text-xs font-medium mb-0.5">Staking Assets</p>
              <h2 className="text-xl font-bold text-foreground mb-0.5">${(profile.staked_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
              <p className="text-[10px] font-bold text-primary">0.25% APR</p>
            </div>
            <TrendingUp size={18} className="text-primary" />
          </div>
        </div>

        <div onClick={() => { setStakeType('fixed'); setAmount(''); setShowStake(true); }} className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-4 border border-orange-200 dark:border-orange-800/20 cursor-pointer active:scale-[0.98] transition-transform">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-800/20 text-orange-500 flex items-center justify-center"><Lock size={14} /></div><div><h3 className="text-sm font-bold text-foreground">Fixed Staking</h3><p className="text-[10px] text-muted-foreground">Higher returns, locked period</p></div></div>
          </div>
          <div className="flex justify-between items-end"><div><p className="text-[10px] text-muted-foreground">APR</p><p className="text-sm font-bold text-green-500">5%</p></div><div className="text-right"><p className="text-[10px] text-muted-foreground">Durations</p><p className="text-[11px] font-bold text-foreground">10d - 180d</p></div></div>
        </div>

        <div onClick={() => { setStakeType('flexible'); setAmount(''); setShowStake(true); }} className="bg-primary/5 rounded-xl p-4 border border-primary/10 cursor-pointer active:scale-[0.98] transition-transform">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Lock size={14} /></div><div><h3 className="text-sm font-bold text-foreground">Flexible Staking</h3><p className="text-[10px] text-muted-foreground">Withdraw anytime</p></div></div>
          </div>
          <div className="flex justify-between items-end"><div><p className="text-[10px] text-muted-foreground">APR</p><p className="text-sm font-bold text-green-500">0.25%</p></div><div className="text-right"><p className="text-[10px] text-muted-foreground">Lock Period</p><p className="text-[11px] font-bold text-foreground">None</p></div></div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-sm border border-border text-center min-h-[160px] flex flex-col items-center justify-center">
          <TrendingUp className="text-muted mb-3" size={32} /><h3 className="text-base font-bold text-foreground mb-1">No Active Staking</h3><p className="text-[11px] text-muted-foreground max-w-[180px]">Earn rewards on your idle assets</p>
        </div>
      </div>

      {/* Stake Modal */}
      {showStake && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-md p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in border border-border">
            <div className="p-4 border-b border-border flex justify-between items-center text-foreground">
              <div><h3 className="text-lg font-bold text-foreground flex items-center gap-2"><Plus className="text-primary" size={18} /> Stake USDT</h3><p className="text-[10px] text-muted-foreground">{stakeType === 'fixed' ? 'Locked Savings' : 'Flexible Savings'}</p></div>
              <button onClick={() => setShowStake(false)} className="p-1.5 hover:bg-muted rounded-full text-muted-foreground transition-colors"><X size={20} /></button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              <div className={`rounded-lg p-3 mb-4 flex items-center justify-between ${stakeType === 'fixed' ? 'bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/20' : 'bg-primary/5 border border-primary/10'}`}>
                <div><span className="text-[10px] font-bold text-muted-foreground uppercase block mb-0.5">APR Rate</span><span className="text-lg font-bold text-green-500">{stakeType === 'fixed' ? '5.00%' : '0.25%'}</span></div>
                <TrendingUp size={16} className="text-primary" />
              </div>
              {stakeType === 'fixed' && (
                <div className="mb-4"><label className="text-[11px] font-bold text-foreground mb-1.5 block">Duration</label><div className="grid grid-cols-4 gap-1.5">{FIXED_DURATIONS.map(d => (
                  <button key={d.days} onClick={() => setDuration(d.days)} className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${duration === d.days ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-muted-foreground/30'}`}>{d.label}</button>
                ))}</div></div>
              )}
              <div className="mb-6">
                <div className="flex justify-between mb-1.5"><label className="text-[11px] font-bold text-foreground">Amount</label><span className="text-[10px] text-muted-foreground">Available: {(profile.balance || 0).toFixed(2)}</span></div>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Min 10.00" className="w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 font-mono text-base text-foreground focus:ring-2 focus:ring-primary/10 focus:border-primary/50 outline-none" />
              </div>
              <button onClick={handleConfirmStake} disabled={isProcessing || !amount} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-1 rounded-xl shadow-sm transition-all disabled:opacity-50 text-sm">{isProcessing ? 'Processing...' : 'Confirm Stake'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransfer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-md p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in border border-border">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div><h3 className="text-lg font-bold text-foreground flex items-center gap-2"><ArrowRightLeft className="text-primary" size={18} /> Transfer</h3></div>
              <button onClick={() => setShowTransfer(false)} className="p-1.5 hover:bg-muted rounded-full text-muted-foreground transition-colors"><X size={20} /></button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              <div className="mb-4">
                <div className="bg-muted border border-border rounded-lg pl-3 py-2.5 font-bold text-foreground mb-1.5 text-sm">{transferFromSpot ? 'Spot → Earn' : 'Earn → Spot'}</div>
                <button onClick={() => setTransferFromSpot(!transferFromSpot)} className="text-[10px] text-primary font-bold">Swap Direction</button>
              </div>
              <div className="mb-6">
                <div className="flex justify-between mb-1.5"><label className="text-[11px] font-bold text-foreground">Amount</label><span className="text-[10px] text-muted-foreground">Available: {(transferFromSpot ? profile.balance : profile.staked_balance || 0).toFixed(2)}</span></div>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 font-mono text-base text-foreground focus:ring-2 focus:ring-primary/10 focus:border-primary/50 outline-none" />
              </div>
              <button onClick={handleTransfer} disabled={isProcessing || !amount} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-1 rounded-xl shadow-sm transition-all disabled:opacity-50 text-sm">{isProcessing ? 'Processing...' : 'Confirm Transfer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Earn;
