import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, RefreshCw, Coins, ArrowUp, ArrowDown, X, Wallet
} from 'lucide-react';
import CubeSpinner from '@/components/shared/CubeSpinner';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { getAdminIdForCurrentUser, filterUsersByAdminGroup, syncUserReferralsWithSupabase } from '@/lib/adminPermissions';

import { marketService } from '@/services/market';

interface ProfileRow {
  id: string;
  username: string | null;
  email: string | null;
  ftid: string | null;
  balance: number | null;
  futures_balance: number | null;
  staked_balance: number | null;
  withdrawal_address: string | null;
  total_value?: number;
}

type SortField = 'balance' | 'futures' | 'earn' | 'total' | 'name';
type SortDir = 'asc' | 'desc';

const FinancialStatus = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('total');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Balance Adjustment Modal State
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<ProfileRow | null>(null);
  const [balanceWalletType, setBalanceWalletType] = useState<'spot' | 'futures' | 'staked'>('spot');
  const [balanceActionType, setBalanceActionType] = useState<'add' | 'deduct' | 'set'>('add');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [adjustingBalance, setAdjustingBalance] = useState(false);

  const PER_PAGE = 10;

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { data: profs, error: fetchError } = await supabase.from('profiles').select('*');
      if (fetchError) throw fetchError;
      
      // Sync referrals to ensure the admin has the latest mapping for filtering
      await syncUserReferralsWithSupabase();

      const adminId = getAdminIdForCurrentUser(currentUser?.email);
      const filteredProfs = filterUsersByAdminGroup(profs || [], adminId);
      
      const { data: assets } = await supabase.from('user_assets').select('*');
      const allPrices = await marketService.getPrices();

      if (filteredProfs) {
        const enriched = filteredProfs.map(p => {
          const userAssets = assets?.filter(a => a.user_id === p.id) || [];
          const cryptoVal = userAssets.reduce((sum, a) => {
             if (a.symbol === 'USDT') return sum;
             const price = allPrices[a.symbol] || marketService.getCurrentPrice(a.symbol + 'USDT') || 0;
             return sum + (a.amount * price);
          }, 0);
          return {
            ...p,
            total_value: (p.balance || 0) + (p.futures_balance || 0) + (p.staked_balance || 0) + cryptoVal
          };
        });
        setUsers(enriched as ProfileRow[]);
      }
    } catch (err: any) {
      console.error("Failed to load users:", err);
      setError(err.message || "Could not retrieve user database.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForBalance || !balanceAmount) return;

    const amountNum = parseFloat(balanceAmount);
    if (isNaN(amountNum) || amountNum < 0) {
      alert('Please enter a valid positive numeric amount.');
      return;
    }

    setAdjustingBalance(true);
    try {
      let currentVal = 0;
      let fieldKey: 'balance' | 'futures_balance' | 'staked_balance' = 'balance';
      if (balanceWalletType === 'spot') {
        currentVal = selectedUserForBalance.balance ?? 0;
        fieldKey = 'balance';
      } else if (balanceWalletType === 'futures') {
        currentVal = selectedUserForBalance.futures_balance ?? 0;
        fieldKey = 'futures_balance';
      } else if (balanceWalletType === 'staked') {
        currentVal = selectedUserForBalance.staked_balance ?? 0;
        fieldKey = 'staked_balance';
      }

      let newVal = currentVal;
      if (balanceActionType === 'add') {
        newVal = currentVal + amountNum;
      } else if (balanceActionType === 'deduct') {
        newVal = Math.max(0, currentVal - amountNum);
      } else if (balanceActionType === 'set') {
        newVal = amountNum;
      }

      const { error: patchError } = await supabase
        .from('profiles')
        .update({ [fieldKey]: newVal })
        .eq('id', selectedUserForBalance.id);

      if (patchError) throw patchError;

      // Update state locally so the table immediately updates
      setUsers(prev => prev.map(u => {
        if (u.id === selectedUserForBalance.id) {
          return { ...u, [fieldKey]: newVal, total_value: (u.total_value || 0) - currentVal + newVal };
        }
        return u;
      }));

      // Push custom auditing notification to user panel
      try {
        const walletLabel = balanceWalletType === 'spot' ? 'Spot Wallet' : balanceWalletType === 'futures' ? 'Futures Wallet' : 'Staking/Earn Wallet';
        const actionLabel = balanceActionType === 'add' ? 'credited with' : balanceActionType === 'deduct' ? 'debited by' : 'manually adjusted to';
        const detailMsg = `Admin updated your ${walletLabel}. Account has been ${actionLabel} $${amountNum.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT.`;

        await supabase.from('notifications').insert({
          user_id: selectedUserForBalance.id,
          title: 'Balance Adjusted',
          message: detailMsg
        });
      } catch (logErr) {
        console.warn('Notification log skipped:', logErr);
      }

      toast.success(`Successfully adjusted balance for ${selectedUserForBalance.username || selectedUserForBalance.email}`);
      setSelectedUserForBalance(null);
      setBalanceAmount('');
    } catch (err: any) {
      console.error('Failed to change user balance:', err);
      toast.error('Failed to change balance: ' + (err.message || 'Unknown database error'));
    } finally {
      setAdjustingBalance(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const processed = users
    .filter(u =>
      (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.ftid || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let res = 0;
      switch (sortField) {
        case 'name': res = (a.username || '').localeCompare(b.username || ''); break;
        case 'balance': res = (a.balance ?? 0) - (b.balance ?? 0); break;
        case 'futures': res = (a.futures_balance ?? 0) - (b.futures_balance ?? 0); break;
        case 'earn': res = (a.staked_balance ?? 0) - (b.staked_balance ?? 0); break;
        case 'total': res = (a.total_value ?? 0) - (b.total_value ?? 0); break;
      }
      return sortDir === 'asc' ? res : -res;
    });

  const totalPages = Math.ceil(processed.length / PER_PAGE);
  const paginated = processed.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowDown size={14} className="text-muted-foreground/30" />;
    return sortDir === 'asc' ? <ArrowUp size={14} className="text-primary" /> : <ArrowDown size={14} className="text-primary" />;
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financial Status</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage user balances and view withdrawal addresses.</p>
        </div>
        <button onClick={() => loadData()} className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-accent transition-colors" title="Refresh">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="pl-10 pr-4 py-2.5 w-full border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-ring outline-none transition-all"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center">
            <CubeSpinner label="Loading financial data..." />
          </div>
        ) : error ? (
          <div className="p-20 text-center">
            <h3 className="text-lg font-bold text-foreground">Database Sync Error</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">{error}</p>
            <button onClick={() => loadData()} className="flex items-center gap-2 mx-auto px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-all">
              <RefreshCw size={18} /> Retry Sync
            </button>
          </div>
        ) : processed.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet size={32} className="mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium text-foreground">No users found</h3>
            <p className="text-muted-foreground mt-1 text-sm">Try adjusting your search.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th onClick={() => handleSort('name')} className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted select-none">
                      <div className="flex items-center gap-1">User Details <SortIcon field="name" /></div>
                    </th>
                    <th onClick={() => handleSort('balance')} className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted select-none">
                      <div className="flex items-center gap-1">Spot Balance <SortIcon field="balance" /></div>
                    </th>
                    <th onClick={() => handleSort('futures')} className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted select-none">
                      <div className="flex items-center gap-1">Futures <SortIcon field="futures" /></div>
                    </th>
                    <th onClick={() => handleSort('earn')} className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted select-none">
                      <div className="flex items-center gap-1">Earn <SortIcon field="earn" /></div>
                    </th>
                    <th onClick={() => handleSort('total')} className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted select-none">
                      <div className="flex items-center gap-1">Total Value <SortIcon field="total" /></div>
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Withdrawal Address
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginated.map(user => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-sm">
                            {(user.username || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{user.username || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-emerald-500 font-mono">${(user.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-indigo-500 font-mono">${(user.futures_balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-amber-500 font-mono">${(user.staked_balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-foreground font-mono">${(user.total_value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-muted-foreground break-all max-w-[200px]">
                        {user.withdrawal_address ? (
                          <div className="bg-muted p-2 rounded-lg text-xs break-all">{user.withdrawal_address}</div>
                        ) : (
                          <span className="opacity-50 italic">Not set</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setSelectedUserForBalance(user);
                            setBalanceWalletType('spot');
                            setBalanceActionType('add');
                            setBalanceAmount('');
                          }}
                          className="text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors p-2 rounded-full"
                          title="Adjust Balance"
                        >
                          <Coins size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, processed.length)} of {processed.length}
              </span>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm border border-border rounded-md bg-card text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm border border-border rounded-md bg-card text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Manual Balance Adjuster Modal */}
      {selectedUserForBalance && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleAdjustBalance} className="bg-card w-full max-w-md rounded-[28px] p-6 shadow-2xl relative border border-border animate-scale-in">
            <button 
              type="button" 
              onClick={() => setSelectedUserForBalance(null)} 
              className="absolute right-4 top-4 p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
                <Coins size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Adjust User Balance</h3>
                <p className="text-xs text-muted-foreground">User: <span className="font-semibold text-foreground">{selectedUserForBalance.username || selectedUserForBalance.email}</span></p>
              </div>
            </div>

            {/* Wallet Selector Tabs */}
            <div className="mb-6">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">1. Select Wallet Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'spot' as const, label: 'Spot', val: selectedUserForBalance.balance },
                  { id: 'futures' as const, label: 'Futures', val: selectedUserForBalance.futures_balance },
                  { id: 'staked' as const, label: 'Earn', val: selectedUserForBalance.staked_balance },
                ].map(w => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setBalanceWalletType(w.id)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      balanceWalletType === w.id 
                        ? 'bg-primary/10 border-primary text-foreground' 
                        : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <div className="text-xs font-bold uppercase">{w.label}</div>
                    <div className="text-[10px] font-mono mt-1 font-semibold truncate">
                      ${(w.val ?? 0).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Selector */}
            <div className="mb-6">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">2. Select Operation</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'add' as const, label: 'Add (Credit)', style: 'hover:border-emerald-500/50 hover:text-emerald-500 active:bg-emerald-500/10' },
                  { id: 'deduct' as const, label: 'Deduct (Debit)', style: 'hover:border-rose-500/50 hover:text-rose-500 active:bg-rose-500/10' },
                  { id: 'set' as const, label: 'Set (Override)', style: 'hover:border-primary/50 hover:text-primary active:bg-primary/10' },
                ].map(op => (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => setBalanceActionType(op.id)}
                    className={`py-2 px-1 rounded-lg border text-xs font-bold transition-all ${
                      balanceActionType === op.id
                        ? op.id === 'add' 
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600'
                          : op.id === 'deduct'
                            ? 'bg-rose-500/10 border-rose-500 text-rose-600'
                            : 'bg-primary/10 border-primary text-primary'
                        : `bg-muted/30 border-border text-muted-foreground ${op.style}`
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Field */}
            <div className="mb-6">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">3. Enter Amount (USDT)</label>
              <div className="relative">
                <input 
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={balanceAmount}
                  onChange={e => setBalanceAmount(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl pl-4 pr-16 py-3 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 text-lg text-foreground transition-all"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xs uppercase tracking-wider text-muted-foreground">USDT</span>
              </div>
            </div>

            {/* Action Panel */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUserForBalance(null)}
                className="flex-1 py-3 border border-border hover:bg-muted font-bold text-foreground text-sm rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adjustingBalance || !balanceAmount}
                className={`flex-1 font-bold py-3 text-sm rounded-xl text-white transition-all shadow-brand disabled:opacity-50 ${
                  balanceActionType === 'add'
                    ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10'
                    : balanceActionType === 'deduct'
                      ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/10'
                      : 'bg-primary hover:bg-primary/95 shadow-primary/10'
                }`}
              >
                {adjustingBalance ? 'Applying...' : 'Apply Config'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default FinancialStatus;
