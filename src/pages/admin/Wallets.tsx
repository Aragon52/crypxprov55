import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  getAdminIdForCurrentUser, 
  getAdminWallets, 
  saveAdminWallets,
  syncAdminWalletsWithSupabase,
  saveAdminWalletToSupabase,
  deleteAdminWalletFromSupabase
} from '@/lib/adminPermissions';
import { recordActivityLog } from '@/services/systemActivityLog';
import { CryptoIcon } from '@/components/shared/CryptoIcon';
import { toast } from 'sonner';
import { Search, CheckCircle, AlertTriangle, Settings, Copy, RefreshCw, AlertCircle } from 'lucide-react';
import CubeSpinner from '@/components/shared/CubeSpinner';

interface WalletRow {
  id?: string;
  symbol: string;
  network: string;
  address: string;
}

const SUPPORTED_WALLETS = [
  { symbol: 'BTC', network: 'BTC' },
  { symbol: 'ETH', network: 'ERC20' },
  { symbol: 'USDT', network: 'ERC20' },
  { symbol: 'USDT', network: 'TRC20' },
  { symbol: 'USDT', network: 'BEP20' },
  { symbol: 'XRP', network: 'RIPPLE' },
  { symbol: 'BNB', network: 'BEP20' },
  { symbol: 'SOL', network: 'SOLANA' },
  { symbol: 'DOGE', network: 'DOGE' },
];

const AdminWallets = () => {
  const { user } = useAuth();
  const adminId = getAdminIdForCurrentUser(user?.email);

  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'MISSING'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const loadWallets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (adminId) {
        // Load admin specific wallets from database after syncing
        const customWallets = await syncAdminWalletsWithSupabase();
        const adminCustomWallets = customWallets.filter(w => w.adminId === adminId);
        const mapped = SUPPORTED_WALLETS.map(w => {
          const existing = adminCustomWallets.find(s => s.symbol === w.symbol && s.network === w.network);
          return { ...w, id: existing ? adminId : undefined, address: existing?.address || '' };
        });
        setWallets(mapped);
      } else {
        // Load global system wallets from Supabase
        const { data, error: fetchError } = await supabase.from('admin_wallets').select('*');
        if (fetchError) throw fetchError;
        
        const saved = data || [];
        const mapped = SUPPORTED_WALLETS.map(w => {
          const existing = saved.find(s => s.symbol === w.symbol && s.network === w.network);
          return { ...w, id: existing?.id, address: existing?.address || '' };
        });
        setWallets(mapped);
      }
    } catch (err: any) {
      setError(err.message || "Failed to sync wallet configurations.");
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  useEffect(() => { loadWallets(); }, [loadWallets]);

  const handleAddressChange = (idx: number, val: string) => {
    setWallets(prev => prev.map((w, i) => i === idx ? { ...w, address: val } : w));
  };

  const saveWallet = async (idx: number) => {
    const wallet = wallets[idx];
    setSaving(wallet.symbol + wallet.network);
    
    try {
      if (adminId) {
        // Save admin-specific wallets
        const allWallets = getAdminWallets();
        // Remove existing
        const filtered = allWallets.filter(w => !(w.adminId === adminId && w.symbol === wallet.symbol && w.network === wallet.network));
        // Add new
        const trimAddress = wallet.address.trim();
        if (trimAddress) {
          const newWalletPayload = {
            adminId,
            symbol: wallet.symbol,
            network: wallet.network,
            address: trimAddress
          };
          filtered.push(newWalletPayload);
          saveAdminWallets(filtered);
          await saveAdminWalletToSupabase(newWalletPayload);

          recordActivityLog({
            category: 'DEPOSIT_WALLET',
            action: 'DEPOSIT_WALLET_UPDATED',
            adminEmail: user?.email || 'admin@crypxpro.com',
            adminId,
            target: `${wallet.symbol} (${wallet.network})`,
            title: `Updated Group Deposit Wallet Address (${adminId})`,
            details: `Configured deposit address for ${wallet.symbol} on ${wallet.network} network: ${trimAddress}`,
            severity: 'info',
            metadata: {
              symbol: wallet.symbol,
              network: wallet.network,
              walletAddress: trimAddress,
              adminId,
              scope: 'GROUP'
            }
          });
        } else {
          saveAdminWallets(filtered);
          await deleteAdminWalletFromSupabase(adminId, wallet.symbol, wallet.network);

          recordActivityLog({
            category: 'DEPOSIT_WALLET',
            action: 'DEPOSIT_WALLET_REMOVED',
            adminEmail: user?.email || 'admin@crypxpro.com',
            adminId,
            target: `${wallet.symbol} (${wallet.network})`,
            title: `Cleared Group Deposit Wallet Address (${adminId})`,
            details: `Removed custom deposit address for ${wallet.symbol} on ${wallet.network} network`,
            severity: 'warning',
            metadata: {
              symbol: wallet.symbol,
              network: wallet.network,
              adminId,
              scope: 'GROUP'
            }
          });
        }
        setWallets(prev => prev.map((w, i) => i === idx ? { ...w, id: adminId } : w));
        toast.success(`${wallet.symbol} (${wallet.network}) custom wallet updated successfully.`);
      } else {
        // Save global wallets
        const trimAddress = wallet.address.trim();
        if (wallet.id) {
          // Update
          await supabase.from('admin_wallets')
            .update({ address: trimAddress })
            .eq('id', wallet.id);
        } else {
          // Insert
          const { data } = await supabase.from('admin_wallets')
            .insert({
              symbol: wallet.symbol,
              network: wallet.network,
              address: trimAddress
            })
            .select()
            .single();
          
          if (data) {
            setWallets(prev => prev.map((w, i) => i === idx ? { ...w, id: data.id } : w));
          }
        }

        recordActivityLog({
          category: 'DEPOSIT_WALLET',
          action: trimAddress ? 'DEPOSIT_WALLET_UPDATED' : 'DEPOSIT_WALLET_REMOVED',
          adminEmail: user?.email || 'admin@crypxpro.com',
          adminId: 'GLOBAL',
          target: `${wallet.symbol} (${wallet.network})`,
          title: trimAddress ? `Updated Global Deposit Wallet Address` : `Cleared Global Deposit Wallet Address`,
          details: trimAddress 
            ? `Configured global system deposit address for ${wallet.symbol} on ${wallet.network}: ${trimAddress}`
            : `Cleared global deposit address for ${wallet.symbol} on ${wallet.network}`,
          severity: trimAddress ? 'info' : 'warning',
          metadata: {
            symbol: wallet.symbol,
            network: wallet.network,
            walletAddress: trimAddress,
            scope: 'GLOBAL'
          }
        });

        toast.success(`${wallet.symbol} (${wallet.network}) system wallet updated successfully.`);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to save wallet configuration.");
    } finally {
      setSaving(null);
    }
  };

  const filtered = wallets.filter(w => {
    const matchesSearch = w.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         w.network.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'ALL' || 
                         (filter === 'ACTIVE' && w.address) || 
                         (filter === 'MISSING' && !w.address);
    return matchesSearch && matchesFilter;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(text);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {adminId ? `Group Wallets (${adminId})` : 'System Wallets (Global)'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {adminId 
              ? `Configure custom deposit addresses shown exclusively to your group's users.`
              : 'Configure default system deposit addresses for all supported networks.'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Filter by asset..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <button onClick={() => loadWallets()} className="p-2 border border-border rounded-lg hover:bg-muted transition-colors">
            <Settings size={18} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        {(['ALL', 'ACTIVE', 'MISSING'] as const).map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
              filter === f ? 'bg-primary text-primary-foreground border-primary shadow-brand' : 'bg-card text-muted-foreground border-border hover:border-muted-foreground'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 p-20 flex justify-center">
            <CubeSpinner label="Loading system wallets..." />
          </div>
        ) : error ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 p-20 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-destructive" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Sync Failure</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">{error}</p>
            <button onClick={() => loadWallets()} className="flex items-center gap-2 mx-auto px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-all">
              <RefreshCw size={18} /> Retry Load
            </button>
          </div>
        ) : filtered.map((wallet, idx) => (
          <div key={wallet.symbol + wallet.network} className="bg-card rounded-2xl border border-border p-5 hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CryptoIcon symbol={wallet.symbol} size={32} />
                <div>
                  <h3 className="font-bold text-foreground">{wallet.symbol}</h3>
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{wallet.network}</span>
                </div>
              </div>
              {wallet.address ? (
                <div className="text-emerald-500 bg-emerald-500/10 p-1.5 rounded-lg" title="Wallet Configured">
                  <CheckCircle size={18} />
                </div>
              ) : (
                <div className="text-orange-500 bg-orange-500/10 p-1.5 rounded-lg" title="Address Missing">
                  <AlertTriangle size={18} />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="relative">
                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Deposit Address</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={wallet.address}
                    onChange={(e) => handleAddressChange(wallets.indexOf(wallet), e.target.value)}
                    placeholder={`Enter ${wallet.symbol} address...`}
                    className="w-full bg-muted/50 border border-border rounded-lg pl-3 pr-10 py-2 text-sm font-mono focus:border-primary outline-none transition-colors"
                  />
                  {wallet.address && (
                    <button 
                      onClick={() => handleCopy(wallet.address)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {copyFeedback === wallet.address ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
              </div>
              
              <button 
                onClick={() => saveWallet(wallets.indexOf(wallet))}
                disabled={saving === wallet.symbol + wallet.network}
                className={`w-full py-2 rounded-lg text-sm font-bold transition-all ${
                  saving === wallet.symbol + wallet.network 
                    ? 'bg-muted text-muted-foreground cursor-wait' 
                    : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'
                }`}
              >
                {saving === wallet.symbol + wallet.network ? 'Saving...' : wallet.id ? 'Update Address' : 'Save Config'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="py-20 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={32} className="text-muted-foreground/30" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No Wallets Found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or search term.</p>
        </div>
      )}
    </div>
  );
};

export default AdminWallets;
