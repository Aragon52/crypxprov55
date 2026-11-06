import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getAdminIdForCurrentUser, filterUsersByAdminGroup, syncUserReferralsWithSupabase } from '@/lib/adminPermissions';
import { recordActivityLog } from '@/services/systemActivityLog';
import { CryptoIcon } from '@/components/shared/CryptoIcon';
import { Activity, RefreshCw, AlertCircle, CheckCircle, XCircle, X, Eye } from 'lucide-react';
import CubeSpinner from '@/components/shared/CubeSpinner';

interface DepositRow {
  id: string;
  user_id: string;
  asset: string;
  network: string;
  amount: number;
  status: string;
  created_at: string;
  screenshot_url?: string;
  user_email?: string; // We might augment this
}

const DepositRequests = () => {
  const { user: currentUser } = useAuth();
  const [deposits, setDeposits] = useState<DepositRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [confirmingAction, setConfirmingAction] = useState<{ deposit: DepositRow; action: 'APPROVED' | 'REJECTED' } | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      let query = supabase.from('deposits').select('*');
      
      if (!showAll) {
        query = query.eq('status', 'PENDING');
      }
      
      const { data, error: err } = await query.order('created_at', { ascending: false });

      if (err) throw err;
      
      await syncUserReferralsWithSupabase();
      
      const adminId = getAdminIdForCurrentUser(currentUser?.email);
      const filteredData = filterUsersByAdminGroup(data || [], adminId);
      
      console.log(`Fetched ${filteredData?.length || 0} deposits (showAll: ${showAll})`);
      
      // Attempt to load emails if able
      const augmented = await Promise.all((filteredData || []).map(async (d: any) => {
        try {
          const { data: p } = await supabase.from('profiles').select('email').eq('id', d.user_id).single();
          return { ...d, user_email: p?.email };
        } catch {
          return d;
        }
      }));

      setDeposits(augmented as DepositRow[]);
    } catch (err: any) {
      console.error("Deposits load failed:", err);
      setError(err.message || "Failed to load deposit requests.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [showAll]);

  useEffect(() => { loadData(); }, [loadData, showAll]);

  const handleAction = async () => {
    if (!confirmingAction) return;
    const { deposit, action } = confirmingAction;
    
    setProcessingId(deposit.id);
    setConfirmingAction(null);
    try {
      console.log(`[DepositAction] Initiating ${action} for deposit ${deposit.id}`);
      const { error: updateError } = await supabase.from('deposits').update({ status: action }).eq('id', deposit.id);
      if (updateError) throw updateError;

      if (action === 'APPROVED') {
        const depositAmt = Number(deposit.amount);
        if (isNaN(depositAmt)) throw new Error("Invalid deposit amount");

        if (deposit.asset === 'USDT') {
          console.log(`[DepositAction] Crediting USDT balance for user ${deposit.user_id}`);
          const { data: profile, error: pErr } = await supabase.from('profiles').select('balance').eq('id', deposit.user_id).single();
          if (pErr) throw pErr;
          if (!profile) throw new Error("Profile not found");
          
          const currentBalance = Number(profile.balance ?? 0);
          const newBalance = currentBalance + depositAmt;
          
          const { error: balanceErr } = await supabase.from('profiles').update({ balance: newBalance }).eq('id', deposit.user_id);
          if (balanceErr) throw balanceErr;
        } else {
          console.log(`[DepositAction] Crediting ${deposit.asset} for user ${deposit.user_id}`);
          const { data: assets, error: aErr } = await supabase.from('user_assets').select('*').eq('user_id', deposit.user_id).eq('symbol', deposit.asset);
          if (aErr) throw aErr;
          
          const assetRow = assets?.[0];
          if (assetRow) {
            const currentAmount = Number(assetRow.amount ?? 0);
            const { error: uErr } = await supabase.from('user_assets').update({ amount: currentAmount + depositAmt }).eq('id', assetRow.id);
            if (uErr) throw uErr;
          } else {
            const { error: iErr } = await supabase.from('user_assets').insert({ user_id: deposit.user_id, symbol: deposit.asset, amount: depositAmt });
            if (iErr) throw iErr;
          }
        }
      }

      setDeposits(prev => prev.filter(d => d.id !== deposit.id));

      const adminEmail = currentUser?.email || 'admin@crypxpro.com';
      const adminId = getAdminIdForCurrentUser(currentUser?.email);
      const isApproved = action === 'APPROVED';

      recordActivityLog({
        category: 'DEPOSIT_REQUEST',
        action: isApproved ? 'DEPOSIT_REQUEST_CONFIRMED' : 'DEPOSIT_REQUEST_REJECTED',
        adminEmail,
        adminId,
        target: `${deposit.asset} (${deposit.network || 'Mainnet'})`,
        title: isApproved ? 'Confirmed & Credited Deposit Request' : 'Rejected Deposit Request',
        details: isApproved
          ? `Approved deposit of ${deposit.amount} ${deposit.asset} on ${deposit.network} network for user ${deposit.user_email || deposit.user_id} and credited user balance.`
          : `Rejected deposit request of ${deposit.amount} ${deposit.asset} for user ${deposit.user_email || deposit.user_id}.`,
        severity: isApproved ? 'success' : 'danger',
        metadata: {
          depositId: deposit.id,
          userId: deposit.user_id,
          userEmail: deposit.user_email,
          asset: deposit.asset,
          network: deposit.network,
          amount: Number(deposit.amount),
          status: action
        }
      });
    } catch (err: any) {
      console.error("[DepositAction] Error:", err);
      setError("Action failed: " + (err.message || "Unknown error"));
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <CubeSpinner fullScreen label="Loading deposit requests..." />;

  if (error) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4"><AlertCircle size={32} /></div>
        <h2 className="text-xl font-black text-foreground mb-2">Error</h2>
        <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
        <button onClick={() => loadData()} className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-2xl">Try Again</button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">Financial Operations</p>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Deposit Requests</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAll(!showAll)} 
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${showAll ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-card border border-border text-muted-foreground hover:bg-muted'}`}
          >
            {showAll ? 'Showing All' : 'Show All Statuses'}
          </button>
          <button onClick={() => loadData()} className="group flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-bold text-muted-foreground hover:text-primary transition-all shadow-sm">
            <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" /> Refresh
          </button>
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
        {deposits.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground">
            <p className="text-sm font-medium opacity-50 italic">No pending deposit requests.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {deposits.map(dep => (
              <div key={dep.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-muted/10 transition-colors">
                <div className="flex items-start gap-4">
                  <CryptoIcon symbol={dep.asset} size={48} />
                  <div>
                    <h3 className="font-black text-foreground text-xl flex items-center gap-2">
                      {dep.amount.toLocaleString()} {dep.asset}
                      <span className="text-[10px] font-black bg-muted px-2 py-0.5 rounded text-muted-foreground uppercase">{dep.network}</span>
                    </h3>
                    <p className="text-xs font-bold text-muted-foreground mt-1">User: {dep.user_email || dep.user_id}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(dep.created_at).toLocaleString()}</p>
                  </div>
                </div>

                {dep.screenshot_url && (
                  <div className="border border-border p-1.5 rounded-2xl bg-muted/30 flex flex-col items-center">
                    <div 
                      onClick={() => setViewingImage(dep.screenshot_url || null)}
                      className="relative h-20 w-24 rounded-xl overflow-hidden cursor-pointer group border border-border bg-background"
                    >
                      <img 
                        src={dep.screenshot_url} 
                        alt="Payment Proof" 
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <Eye size={16} />
                      </div>
                    </div>
                    <button 
                      onClick={() => setViewingImage(dep.screenshot_url || null)}
                      className="text-center text-[9px] font-bold text-primary uppercase mt-1 hover:underline"
                    >
                      View Proof
                    </button>
                  </div>
                )}

                <div className="flex gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => {
                      console.log("Approve clicked in list");
                      setConfirmingAction({ deposit: dep, action: 'APPROVED' });
                    }}
                    disabled={processingId !== null}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <CheckCircle size={18} /> Approve
                  </button>
                  <button 
                    onClick={() => setConfirmingAction({ deposit: dep, action: 'REJECTED' })}
                    disabled={processingId !== null}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <XCircle size={18} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmingAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${confirmingAction.action === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              {confirmingAction.action === 'APPROVED' ? <CheckCircle size={32} /> : <XCircle size={32} />}
            </div>
            <h3 className="text-xl font-bold text-foreground text-center mb-2">Confirm {confirmingAction.action}</h3>
            <p className="text-muted-foreground text-center text-sm mb-6 font-bold uppercase tracking-tighter">
              {confirmingAction.deposit.amount} {confirmingAction.deposit.asset}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmingAction(null)} 
                className="flex-1 py-3 rounded-2xl font-bold text-muted-foreground hover:bg-muted transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleAction}
                className={`flex-1 py-3 rounded-2xl font-bold text-white shadow-xl transition-all ${
                  confirmingAction.action === 'APPROVED' ? 'bg-emerald-500 shadow-emerald-500/20 hover:bg-emerald-600' : 'bg-rose-500 shadow-rose-500/20 hover:bg-rose-600'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Image Viewer Modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" 
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-2xl w-full bg-card rounded-3xl border border-border shadow-2xl p-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 border-b border-border mb-3">
              <h4 className="font-bold text-sm text-foreground">Deposit Payment Proof / Receipt</h4>
              <button 
                onClick={() => setViewingImage(null)} 
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-black/40 rounded-2xl p-2">
              <img 
                src={viewingImage} 
                alt="Payment Proof Full" 
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
            <div className="mt-3 flex justify-end">
              <button 
                onClick={() => setViewingImage(null)} 
                className="px-5 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepositRequests;
