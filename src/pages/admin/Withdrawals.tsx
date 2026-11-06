import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getAdminIdForCurrentUser, filterUsersByAdminGroup, syncUserReferralsWithSupabase } from '@/lib/adminPermissions';
import { recordActivityLog } from '@/services/systemActivityLog';
import { CryptoIcon } from '@/components/shared/CryptoIcon';
import { ArrowUp, RefreshCw, Check, X, Filter, AlertCircle } from 'lucide-react';
import CubeSpinner from '@/components/shared/CubeSpinner';

interface WithdrawalRow {
  id: string;
  user_id: string;
  asset: string;
  network: string;
  address: string;
  amount: number;
  status: string;
  note: string | null;
  created_at: string;
}

interface ProfileLite {
  id: string;
  username: string | null;
  email: string | null;
  balance: number | null;
}

const STATUS_FILTERS = ['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const AdminWithdrawals = () => {
  const { user: currentUser } = useAuth();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('PENDING');
  const [rejectModal, setRejectModal] = useState<WithdrawalRow | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { data: w, error: we } = await supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
      if (we) throw we;
      
      await syncUserReferralsWithSupabase();
      
      const adminId = getAdminIdForCurrentUser(currentUser?.email);
      const filteredW = filterUsersByAdminGroup(w || [], adminId);
      
      const list = (filteredW as WithdrawalRow[]) || [];
      setWithdrawals(list);

      const ids = Array.from(new Set(list.map(x => x.user_id)));
      if (ids.length) {
        const { data: p, error: pe } = await supabase.from('profiles').select('id, username, email, balance').in('id', ids);
        if (pe) throw pe;
        
        const map: Record<string, ProfileLite> = {};
        (p || []).forEach((row: any) => { map[row.id] = row; });
        setProfiles(map);
      }
    } catch (err: any) {
      console.error("Withdrawals load failed:", err);
      setError(err.message || "Failed to load withdrawal records.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApprove = async (withdrawal: WithdrawalRow) => {
    setActioningId(withdrawal.id);
    try {
      const { error: updateError } = await supabase.from('withdrawals').update({ 
        status: 'APPROVED'
      }).eq('id', withdrawal.id);
      
      if (updateError) throw updateError;
      
      setWithdrawals(prev => prev.map(w => w.id === withdrawal.id ? { ...w, status: 'APPROVED' } : w));

      const adminEmail = currentUser?.email || 'admin@crypxpro.com';
      const adminId = getAdminIdForCurrentUser(currentUser?.email);
      const userProfile = profiles[withdrawal.user_id];

      recordActivityLog({
        category: 'WITHDRAWAL_REQUEST',
        action: 'WITHDRAWAL_REQUEST_CONFIRMED',
        adminEmail,
        adminId,
        target: `${withdrawal.asset} (${withdrawal.network || 'Mainnet'})`,
        title: 'Confirmed Withdrawal Request',
        details: `Approved withdrawal of ${withdrawal.amount} ${withdrawal.asset} to address ${withdrawal.address} for user ${userProfile?.email || userProfile?.username || withdrawal.user_id}`,
        severity: 'success',
        metadata: {
          withdrawalId: withdrawal.id,
          userId: withdrawal.user_id,
          userEmail: userProfile?.email,
          username: userProfile?.username,
          asset: withdrawal.asset,
          network: withdrawal.network,
          address: withdrawal.address,
          amount: Number(withdrawal.amount),
          status: 'APPROVED'
        }
      });
    } catch (err: any) {
      console.error(err);
      setError("Approval failed: " + err.message);
    } finally {
      setActioningId(null);
      setConfirmApprove(null);
    }
  };

  const [confirmApprove, setConfirmApprove] = useState<WithdrawalRow | null>(null);

  const handleReject = async () => {
    if (!rejectModal) return;
    setActioningId(rejectModal.id);
    try {
      // 1. Update status
      const { error: updateError } = await supabase.from('withdrawals').update({ 
        status: 'REJECTED',
        note: rejectNote // Using 'note' from schema instead of 'admin_notes'
      }).eq('id', rejectModal.id);

      if (updateError) throw updateError;

      // 2. Refund User - Fetch fresh data to avoid balance corruption
      if (rejectModal.asset === 'USDT') {
        const { data: profile, error: pErr } = await supabase.from('profiles').select('balance').eq('id', rejectModal.user_id).single();
        if (pErr) throw pErr;
        
        const currentBalance = profile?.balance || 0;
        const { error: refundErr } = await supabase.from('profiles').update({ 
          balance: currentBalance + rejectModal.amount 
        }).eq('id', rejectModal.user_id);
        
        if (refundErr) throw refundErr;
      } else {
        const { data: ast, error: aErr } = await supabase.from('user_assets')
          .select('*')
          .eq('user_id', rejectModal.user_id)
          .eq('symbol', rejectModal.asset)
          .single();
        
        if (aErr && aErr.code !== 'PGRST116') throw aErr; // PGRST116 is not found
        
        if (ast) {
          const { error: refundErr } = await supabase.from('user_assets').update({ 
            amount: ast.amount + rejectModal.amount 
          }).eq('id', ast.id);
          if (refundErr) throw refundErr;
        } else {
          // If asset row doesn't exist (shouldn't happen for withdrawal but safe to handle)
          const { error: insertErr } = await supabase.from('user_assets').insert({
            user_id: rejectModal.user_id,
            symbol: rejectModal.asset,
            amount: rejectModal.amount
          });
          if (insertErr) throw insertErr;
        }
      }

      setWithdrawals(prev => prev.map(w => w.id === rejectModal.id ? { ...w, status: 'REJECTED', note: rejectNote } : w));

      const adminEmail = currentUser?.email || 'admin@crypxpro.com';
      const adminId = getAdminIdForCurrentUser(currentUser?.email);
      const userProfile = profiles[rejectModal.user_id];

      recordActivityLog({
        category: 'WITHDRAWAL_REQUEST',
        action: 'WITHDRAWAL_REQUEST_REJECTED',
        adminEmail,
        adminId,
        target: `${rejectModal.asset} (${rejectModal.network || 'Mainnet'})`,
        title: 'Rejected Withdrawal Request & Refunded Balance',
        details: `Rejected withdrawal of ${rejectModal.amount} ${rejectModal.asset} for user ${userProfile?.email || userProfile?.username || rejectModal.user_id}. Refunded balance to user. Reason: "${rejectNote || 'No reason provided'}"`,
        severity: 'danger',
        metadata: {
          withdrawalId: rejectModal.id,
          userId: rejectModal.user_id,
          userEmail: userProfile?.email,
          username: userProfile?.username,
          asset: rejectModal.asset,
          network: rejectModal.network,
          address: rejectModal.address,
          amount: Number(rejectModal.amount),
          status: 'REJECTED',
          reason: rejectNote
        }
      });

      setRejectModal(null);
      setRejectNote('');
    } catch (err: any) {
      console.error(err);
      setError("Rejection failed: " + (err.message || "Unknown error"));
    } finally {
      setActioningId(null);
    }
  };

  const filteredList = withdrawals.filter(w => filter === 'ALL' || w.status === filter);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Withdrawal Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">Review and process user withdrawal requests.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} 
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filter === f ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' : 'bg-card text-muted-foreground border-border hover:bg-muted'}`}>
              {f}
            </button>
          ))}
          <button onClick={() => loadData()} className="p-2 border border-border rounded-xl hover:bg-muted transition-colors ml-2">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center">
            <CubeSpinner label="Loading withdrawals..." />
          </div>
        ) : error ? (
          <div className="p-20 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-destructive" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Sync Failure</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">{error}</p>
            <button onClick={() => loadData()} className="flex items-center gap-2 mx-auto px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-all">
              <RefreshCw size={18} /> Retry Load
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-muted/50 text-[10px] uppercase font-bold text-muted-foreground tracking-wider border-b border-border">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Asset / Network</th>
                  <th className="px-6 py-4">Destination Address</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredList.length === 0 ? (
                  <tr><td colSpan={6} className="p-20 text-center text-muted-foreground">No {filter.toLowerCase()} requests found.</td></tr>
                ) : filteredList.map(w => {
                const profile = profiles[w.user_id];
                return (
                  <tr key={w.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                          {(profile?.username || 'U').charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-foreground">{profile?.username || 'Unknown'}</div>
                          <div className="text-[10px] text-muted-foreground">{profile?.email || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CryptoIcon symbol={w.asset} size={20} />
                        <div>
                          <div className="text-sm font-bold text-foreground">{w.asset}</div>
                          <div className="text-[10px] uppercase text-muted-foreground font-bold">{w.network}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-mono text-muted-foreground max-w-[180px] truncate" title={w.address}>{w.address}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-mono font-bold text-foreground">{w.amount}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        w.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                        w.status === 'REJECTED' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                        'bg-orange-500/10 text-orange-600 border-orange-500/20'
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {w.status === 'PENDING' ? (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setRejectModal(w)}
                            disabled={!!actioningId}
                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                            title="Reject & Refund"
                          >
                            <X size={18} />
                          </button>
                          <button 
                            onClick={() => setConfirmApprove(w)}
                            disabled={!!actioningId}
                            className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"
                            title="Approve Withdrawal"
                          >
                            {actioningId === w.id ? <RefreshCw size={18} className="animate-spin" /> : <Check size={18} />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Processed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>

      {rejectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-foreground mb-2">Reject Withdrawal</h3>
            <p className="text-muted-foreground text-sm mb-4">The funds ({rejectModal.amount} {rejectModal.asset}) will be automatically refunded to the user's balance.</p>
            
            <textarea 
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              placeholder="Reason for rejection (optional)..."
              className="w-full bg-muted border border-border rounded-xl p-3 text-sm outline-none focus:ring-1 focus:ring-primary min-h-[80px] mb-6"
            />

            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="flex-1 py-3 rounded-2xl font-bold text-muted-foreground hover:bg-muted transition-all">Cancel</button>
              <button 
                onClick={handleReject}
                disabled={!!actioningId}
                className="flex-1 py-3 rounded-2xl font-bold bg-destructive text-white shadow-xl shadow-destructive/20 hover:bg-destructive/90 transition-all"
              >
                {actioningId ? '...' : 'Reject & Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmApprove && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Check size={32} />
            </div>
            <h3 className="text-xl font-bold text-foreground text-center mb-2">Approve Withdrawal</h3>
            <p className="text-muted-foreground text-center text-sm mb-6">Are you sure you want to approve the withdrawal of <span className="text-foreground font-bold">{confirmApprove.amount} {confirmApprove.asset}</span>?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmApprove(null)} className="flex-1 py-3 rounded-2xl font-bold text-muted-foreground hover:bg-muted transition-all">Cancel</button>
              <button 
                onClick={() => handleApprove(confirmApprove)}
                disabled={!!actioningId}
                className="flex-1 py-3 rounded-2xl font-bold bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
              >
                {actioningId ? '...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWithdrawals;
