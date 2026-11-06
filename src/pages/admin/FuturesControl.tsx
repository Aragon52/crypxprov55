import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getAdminIdForCurrentUser, filterUsersByAdminGroup, syncUserReferralsWithSupabase } from '@/lib/adminPermissions';
import { recordActivityLog } from '@/services/systemActivityLog';
import { Search, TrendingUp, DollarSign, Users, RefreshCw, AlertCircle } from 'lucide-react';
import CubeSpinner from '@/components/shared/CubeSpinner';

interface ProfileRow {
  id: string;
  username: string | null;
  email: string | null;
  ftid: string | null;
  futures_balance: number | null;
  force_win: boolean | null;
  force_loss: boolean | null;
}

const FuturesControl = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForcedOnly, setShowForcedOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 10;

  const loadUsers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase.from('profiles').select('*');
      if (fetchError) throw fetchError;
      
      await syncUserReferralsWithSupabase();
      
      const adminId = getAdminIdForCurrentUser(currentUser?.email);
      const filteredData = filterUsersByAdminGroup(data || [], adminId);
      
      if (filteredData) {
        const mappedUsers = (filteredData as any[]).map(u => ({
          ...u,
          force_win: u.force_win ?? false,
          force_loss: u.force_loss ?? false
        }));
        setUsers(mappedUsers as ProfileRow[]);
      }
    } catch (err: any) {
      console.error("Futures fetch error:", err);
      setError(err.message || "Failed to sync futures data.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleSetOutcome = async (userId: string, outcome: 'win' | 'loss' | 'normal', e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const updates = {
      force_win: outcome !== 'normal',
      force_loss: outcome === 'loss'
    };
    
    const targetUser = users.find(u => u.id === userId);
    if (targetUser && targetUser.force_win === updates.force_win && targetUser.force_loss === updates.force_loss) return;

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    
    try {
      const { error: updateError } = await supabase.from('profiles').update(updates).eq('id', userId);
      if (updateError) throw updateError;

      const adminEmail = currentUser?.email || 'admin@crypxpro.com';
      const outcomeText = outcome === 'win' ? 'FORCE_WIN' : outcome === 'loss' ? 'FORCE_LOSS' : 'NORMAL_CALCULATION';
      
      recordActivityLog({
        category: 'MARKET_PARAMS',
        action: outcome === 'normal' ? 'FUTURES_OUTCOME_RESET' : 'FUTURES_WIN_LOSS_OVERRIDE',
        adminEmail,
        target: targetUser?.email || targetUser?.ftid || userId,
        title: outcome === 'normal' ? 'Reset Futures Market Override' : `Set Futures Outcome to ${outcomeText}`,
        details: `Adjusted futures outcome setting to ${outcomeText} for user ${targetUser?.email || targetUser?.username || userId} (FTID: ${targetUser?.ftid || 'N/A'})`,
        severity: outcome === 'normal' ? 'info' : 'warning',
        metadata: {
          userId,
          userEmail: targetUser?.email,
          username: targetUser?.username,
          ftid: targetUser?.ftid,
          outcome: outcomeText
        }
      });
    } catch (err: any) {
      console.error("Update error:", err);
      loadUsers(true);
    }
  };

  const handleToggleOverride = async (user: ProfileRow, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isTurningOn = !user.force_win;
    const updates = { 
      force_win: isTurningOn,
      force_loss: isTurningOn ? user.force_loss : false 
    };

    if (user.force_win === isTurningOn) return;

    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...updates } : u));
    
    try {
      const { error: updateError } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (updateError) throw updateError;

      const adminEmail = currentUser?.email || 'admin@crypxpro.com';
      recordActivityLog({
        category: 'MARKET_PARAMS',
        action: 'FUTURES_WIN_LOSS_OVERRIDE',
        adminEmail,
        target: user.email || user.ftid || user.id,
        title: isTurningOn ? 'Enabled Futures Force Win' : 'Disabled Futures Override',
        details: `Toggled futures override to ${isTurningOn ? 'FORCE_WIN (Active)' : 'Disabled (Normal)'} for user ${user.email || user.username || user.id}`,
        severity: isTurningOn ? 'warning' : 'info',
        metadata: {
          userId: user.id,
          userEmail: user.email,
          username: user.username,
          ftid: user.ftid,
          force_win: isTurningOn
        }
      });
    } catch (err: any) {
      console.error("Toggle error:", err);
      loadUsers(true);
    }
  };

  const filtered = users.filter(u => {
    const match = (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.ftid || '').toLowerCase().includes(searchTerm.toLowerCase());
    return match && (showForcedOnly ? (u.force_win || u.force_loss) : true);
  });

  const activeOverrides = users.filter(u => u.force_win || u.force_loss).length;
  const totalExposure = users.reduce((acc, u) => acc + (u.futures_balance ?? 0), 0);
  const withBalance = users.filter(u => (u.futures_balance ?? 0) > 0).length;

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Futures Control Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage forced outcomes and risk settings.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-card border border-border rounded-lg p-1 flex items-center">
            <span className="px-3 text-sm text-muted-foreground font-medium">Force Win Only</span>
            <button
              onClick={() => setShowForcedOnly(!showForcedOnly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showForcedOnly ? 'bg-emerald-500' : 'bg-muted'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showForcedOnly ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={TrendingUp} label="Active Overrides" value={activeOverrides.toString()} className="bg-emerald-500/10 text-emerald-500" />
        <StatCard icon={DollarSign} label="Total Exposure" value={`$${totalExposure.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} className="bg-primary/10 text-primary" />
        <StatCard icon={Users} label="Traders w/ Balance" value={withBalance.toString()} className="bg-purple-500/10 text-purple-500" />
      </div>

      {/* Search */}
      <div className="bg-card p-4 rounded-xl border border-border mb-6 flex items-center gap-4">
        <Search className="text-muted-foreground" size={20} />
        <input type="text" placeholder="Search by username, email, or ID..." value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="flex-1 outline-none text-foreground bg-transparent font-medium placeholder:text-muted-foreground" />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center">
            <CubeSpinner label="Synchronizing futures data..." />
          </div>
        ) : error ? (
          <div className="p-20 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-destructive" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Sync Failure</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">{error}</p>
            <button onClick={() => loadUsers()} className="flex items-center gap-2 mx-auto px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-all">
              <RefreshCw size={18} /> Retry Sync
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No users found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="px-6 py-4">User Info</th>
                  <th className="px-6 py-4">Futures Balance</th>
                  <th className="px-6 py-4 text-center">Outcome Override</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
                <tbody className="divide-y divide-border">
                {paginated.map(user => (
                  <tr key={user.id} className={`hover:bg-muted/30 transition-colors ${user.force_win ? 'bg-primary/5' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${user.force_win && !user.force_loss ? 'bg-emerald-500/10 text-emerald-600' : user.force_win && user.force_loss ? 'bg-rose-500/10 text-rose-600' : 'bg-primary/10 text-primary'}`}>
                          {(user.username || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{user.username || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{user.ftid || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-foreground font-mono">${(user.futures_balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        {/* Legacy Toggle Switch - Repurposed as Master Override */}
                        <div className="flex flex-col items-center gap-1 group">
                          <button
                            type="button"
                            onClick={(e) => handleToggleOverride(user, e)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${user.force_win ? 'bg-primary' : 'bg-muted'}`}
                          >
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${user.force_win ? 'translate-x-5' : 'translate-x-1'}`} />
                          </button>
                          <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-0 group-hover:opacity-100 transition-opacity">Override</span>
                        </div>

                        <div className="h-8 w-px bg-border/50 mx-1" />

                        <div className="flex items-center gap-1.5 bg-muted/30 p-1 rounded-xl border border-border/50">
                          <button 
                            type="button"
                            onClick={(e) => handleSetOutcome(user.id, 'normal', e)} 
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-wider transition-all ${!user.force_win ? 'bg-foreground text-background shadow-md' : 'text-muted-foreground hover:bg-muted/50'}`}
                          >
                            NRM
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => handleSetOutcome(user.id, 'win', e)} 
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-wider transition-all ${user.force_win && !user.force_loss ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-emerald-500 hover:bg-emerald-500/10'}`}
                          >
                            WIN
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => handleSetOutcome(user.id, 'loss', e)} 
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-wider transition-all ${user.force_win && user.force_loss ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'text-rose-500 hover:bg-rose-500/10'}`}
                          >
                            LOSS
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tight ${user.force_win && !user.force_loss ? 'bg-emerald-500/10 text-emerald-600' : user.force_win && user.force_loss ? 'bg-rose-500/10 text-rose-600' : 'bg-muted text-muted-foreground'}`}>
                        {user.force_win ? (user.force_loss ? 'LOSS FORCED' : 'WIN FORCED') : 'Standard'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
 </div>
            <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Showing {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, filtered.length)} of {filtered.length}</span>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm border border-border rounded-md bg-card text-foreground hover:bg-muted disabled:opacity-50">Previous</button>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm border border-border rounded-md bg-card text-foreground hover:bg-muted disabled:opacity-50">Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, className }: { icon: any; label: string; value: string; className: string }) => (
  <div className="bg-card p-5 rounded-xl border border-border flex items-center gap-4">
    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${className}`}><Icon size={24} /></div>
    <div>
      <div className="text-sm text-muted-foreground font-medium">{label}</div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
    </div>
  </div>
);

export default FuturesControl;
