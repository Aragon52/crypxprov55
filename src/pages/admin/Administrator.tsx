import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, ShieldAlert, ArrowLeft, RefreshCw, Key, Trash2, 
  UserPlus, Check, X, Eye, EyeOff, User, Mail, Shield,
  Copy, ExternalLink, Link, Users
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { 
  PagePermissions, 
  CustomAccount, 
  getCustomAccounts, 
  saveCustomAccounts, 
  getNextStaffId,
  isPrimaryOwner,
  getUserPermission,
  getAdminIdForCurrentUser,
  getReferralCodeForCurrentUser,
  getAdminReferralCode,
  syncCustomAccountsWithSupabase,
  saveCustomAccountToSupabase,
  deleteCustomAccountFromSupabase,
  getUserReferrals,
  syncUserReferralsWithSupabase,
  setReferrerForUser,
  UserReferral
} from '@/lib/adminPermissions';

const ADMIN_PAGES: { key: keyof PagePermissions; label: string; desc: string }[] = [
  { key: 'dashboard', label: 'Dashboard', desc: 'Main admin dashboard' },
  { key: 'users', label: 'Users', desc: 'User accounts & general details' },
  { key: 'financial-status', label: 'Financial Status', desc: 'User balances & manual adjustment' },
  { key: 'deposit-requests', label: 'Deposits', desc: 'Process deposit requests' },
  { key: 'withdrawals', label: 'Withdrawals', desc: 'Approve & manage withdrawals' },
  { key: 'futures', label: 'Futures Control', desc: 'Control active futures and win rates' },
  { key: 'sample-tokens', label: 'Sample Token Control', desc: 'Manage price trends, factors & percentages for sample tokens' },
  { key: 'kyc', label: 'KYC', desc: 'Verify user submissions' },
  { key: 'wallets', label: 'Wallets', desc: 'Set company crypto addresses' },
  { key: 'customer-service', label: 'Support Chat', desc: 'Chat directly with users' },
  { key: 'support', label: 'Contact Details', desc: 'Edit contact support config' },
  { key: 'database-export', label: 'Database Export', desc: 'Export and backup complete database' },
];

const AdminAdministrator = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentUserEmail = user?.email || '';

  // Authority verification
  // ONLY Primary Owners and created accounts with the 'admin' role are allowed to see this page. 'staff' is strictly forbidden.
  const isOwner = isPrimaryOwner(currentUserEmail);
  const userPermission = getUserPermission(currentUserEmail);
  
  // Find current account role if any
  const customAccountsList = getCustomAccounts();
  const currentAccount = customAccountsList.find(a => a.email.toLowerCase() === currentUserEmail.toLowerCase());
  const isAuthorizedAdmin = isOwner || (currentAccount && currentAccount.role === 'admin');

  // Core state
  const [loading, setLoading] = useState(true);

  // Referrals state
  const [referrals, setReferrals] = useState<UserReferral[]>([]);
  const [copied, setCopied] = useState(false);
  const [selectedAdminFilter, setSelectedAdminFilter] = useState<string>('all');

  // Manual User Assignment State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignUserEmail, setAssignUserEmail] = useState('');
  const [assignAdminId, setAssignAdminId] = useState('CXPAD-002');
  const [savingAssign, setSavingAssign] = useState(false);

  const handleManualAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUserEmail.trim()) {
      toast.error("Please enter a valid user email.");
      return;
    }
    setSavingAssign(true);
    try {
      setReferrerForUser(assignUserEmail.trim(), undefined, assignAdminId);
      toast.success(`Successfully mapped ${assignUserEmail.trim()} to ${assignAdminId}`);
      setAssignUserEmail('');
      setShowAssignModal(false);
      await loadReferrals();
    } catch (err: any) {
      toast.error('Failed to map user: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingAssign(false);
    }
  };

  const loadReferrals = useCallback(async () => {
    try {
      const dbReferrals = await syncUserReferralsWithSupabase();
      setReferrals(dbReferrals);
    } catch (e) {
      console.error("Failed to load referrals:", e);
      setReferrals(getUserReferrals());
    }
  }, []);

  // Load custom accounts of role 'staff'
  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      await syncCustomAccountsWithSupabase();
      await loadReferrals();
    } catch (e) {
      console.error("Failed to load data from database:", e);
      try {
        setReferrals(getUserReferrals());
      } catch (err) {
        console.warn("Local referrals fallback failed:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [loadReferrals]);

  useEffect(() => {
    if (isAuthorizedAdmin) {
      loadAccounts();
    }
  }, [isAuthorizedAdmin, loadAccounts]);

  // Access check guard
  if (!isAuthorizedAdmin) {
    return (
      <div className="p-8 min-h-[80vh] flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
          <ShieldAlert size={48} className="animate-bounce" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground uppercase mb-2">Access Denied</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          This portal is restricted to platform Owners and Administrators. Staff members are not authorized to create or manage other staff accounts.
        </p>
        <button 
          onClick={() => navigate('/admin/dashboard')}
          className="px-6 py-3.5 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <ArrowLeft size={18} />
          Back to Admin Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-[32px] shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-primary w-6 h-6" />
            <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Administration</h1>
          </div>
          <p className="text-xs font-semibold text-muted-foreground">
            Manage your group referrals and administrative links.
          </p>
        </div>
        
        <button 
          onClick={loadAccounts}
          className="px-4 py-2.5 bg-muted hover:bg-accent text-muted-foreground hover:text-foreground rounded-xl flex items-center gap-2 text-xs font-bold transition-all border border-border"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Registry
        </button>
      </div>

      {/* Group Referral System Tracker */}
      <div id="group-referral-tracker" className="bg-card border border-border p-6 rounded-[32px] shadow-lg space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link className="text-primary w-5 h-5" />
              <h2 className="text-lg font-black uppercase tracking-tight">Group Referral Tracker</h2>
            </div>
            <p className="text-xs font-semibold text-muted-foreground">
              Monitor group registration mapping. Securely assign new registrations under designated administrative groups.
            </p>
          </div>
          
          {isOwner && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAssignModal(true)}
                className="px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm shadow-primary/20"
              >
                <UserPlus size={14} />
                Assign User to Admin
              </button>
              <div className="flex items-center gap-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground whitespace-nowrap">Filter Group:</label>
                <select
                  id="admin-filter-select"
                  value={selectedAdminFilter}
                  onChange={(e) => setSelectedAdminFilter(e.target.value)}
                  className="bg-muted border border-border rounded-xl px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                >
                  <option value="all">All Groups</option>
                  <option value="OWNER">Owner (OWNER)</option>
                  {Array.from(new Set(
                    getCustomAccounts()
                      .map(a => a.customId)
                      .filter(Boolean)
                  )).map(id => (
                    <option key={id} value={id}>
                      {id} (Ref: {getAdminReferralCode(id)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Referral Link Box */}
          <div className="lg:col-span-1 bg-muted/20 border border-border/80 p-5 rounded-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Your Referral Code</span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 bg-primary text-primary-foreground text-xs font-black font-mono rounded-lg shadow-sm shadow-primary/20">
                    Code: {getReferralCodeForCurrentUser(currentUserEmail)}
                  </span>
                  <span className="px-2 py-1 bg-muted text-muted-foreground text-[10px] font-bold font-mono rounded-lg border border-border">
                    {getAdminIdForCurrentUser(currentUserEmail) || (isOwner ? "OWNER" : "ADMIN")}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                Provide your short referral link or code (<strong className="text-primary font-mono">{getReferralCodeForCurrentUser(currentUserEmail)}</strong>) to clients. Any account created using this link will automatically map directly under your group panel for seamless management, deposit/withdrawal verification, and client support.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground">Dedicated Signup URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={
                    currentUserEmail?.toLowerCase() === 'admin2@crypxpro.com'
                      ? `${window.location.origin.includes('crypxpro.com') ? 'https://crypxpro.com' : window.location.origin.replace('//admin.', '//')}/auth`
                      : `${window.location.origin.includes('crypxpro.com') ? 'https://crypxpro.com' : window.location.origin.replace('//admin.', '//')}/auth?ref=${getReferralCodeForCurrentUser(currentUserEmail)}`
                  }
                  className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-xs font-bold text-muted-foreground font-mono focus:outline-none"
                />
                <button
                  id="copy-referral-link-btn"
                  onClick={() => {
                    const baseUrl = window.location.origin.includes('crypxpro.com') ? 'https://crypxpro.com' : window.location.origin.replace('//admin.', '//');
                    const isAdmin2 = currentUserEmail?.toLowerCase() === 'admin2@crypxpro.com';
                    const refLink = isAdmin2 ? `${baseUrl}/auth` : `${baseUrl}/auth?ref=${getReferralCodeForCurrentUser(currentUserEmail)}`;
                    navigator.clipboard.writeText(refLink);
                    setCopied(true);
                    toast.success(isAdmin2 ? 'Global referral link copied!' : `Referral link copied! (Code: ${getReferralCodeForCurrentUser(currentUserEmail)})`);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-center transition-all active:scale-95 ${
                    copied 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                      : 'bg-primary hover:bg-primary/90 border-primary text-primary-foreground shadow-sm shadow-primary/10'
                  }`}
                  title="Copy Link"
                >
                  {copied ? <Check size={14} className="stroke-[3]" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Referral Register Index Table */}
          <div className="lg:col-span-2 bg-muted/20 border border-border/80 p-5 rounded-2xl flex flex-col space-y-3 min-h-[180px]">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                <Users className="text-primary w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-wider">Referred Group Accounts</span>
              </div>
              <span className="text-xs font-black px-2.5 py-0.5 bg-primary/10 text-primary rounded-full font-mono">
                {referrals.filter(r => {
                  const targetAdmin = getAdminIdForCurrentUser(currentUserEmail) || (isOwner ? "OWNER" : "ADMIN");
                  if (isOwner) {
                    if (selectedAdminFilter === 'all') return true;
                    return r.referredByAdminId === selectedAdminFilter;
                  }
                  return r.referredByAdminId === targetAdmin;
                }).length} Registered
              </span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[140px] pr-1 space-y-2">
              {referrals.filter(r => {
                const targetAdmin = getAdminIdForCurrentUser(currentUserEmail) || (isOwner ? "OWNER" : "ADMIN");
                if (isOwner) {
                  if (selectedAdminFilter === 'all') return true;
                  return r.referredByAdminId === selectedAdminFilter;
                }
                return r.referredByAdminId === targetAdmin;
              }).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 py-6">
                  <Users className="w-8 h-8 mb-2 opacity-30" />
                  <span className="text-[10px] font-black uppercase tracking-wider">No group registrations found</span>
                </div>
              ) : (
                <div className="w-full space-y-1.5">
                  <div className="grid grid-cols-12 text-[9px] font-black uppercase tracking-wider text-muted-foreground/70 px-2 pb-1">
                    <span className="col-span-5">Client Email Address</span>
                    <span className="col-span-4 text-center">Registration Date</span>
                    <span className="col-span-3 text-right">Admin Group</span>
                  </div>
                  {referrals.filter(r => {
                    const targetAdmin = getAdminIdForCurrentUser(currentUserEmail) || (isOwner ? "OWNER" : "ADMIN");
                    if (isOwner) {
                      if (selectedAdminFilter === 'all') return true;
                      return r.referredByAdminId === selectedAdminFilter;
                    }
                    return r.referredByAdminId === targetAdmin;
                  }).map((refItem, idx) => (
                    <div key={idx} className="grid grid-cols-12 text-xs font-bold bg-card border border-border/60 p-2.5 rounded-xl hover:border-primary/10 transition-all items-center">
                      <span className="col-span-5 text-foreground truncate">{refItem.userEmail}</span>
                      <span className="col-span-4 text-muted-foreground text-center text-[11px] font-medium">
                        {new Date(refItem.referredAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className="col-span-3 text-right text-xs font-mono font-black text-primary">
                        {refItem.referredByAdminId}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Assign User to Admin Group Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleManualAssign} className="bg-card w-full max-w-md rounded-[28px] p-6 shadow-2xl relative border border-border animate-scale-in">
            <button 
              type="button" 
              onClick={() => setShowAssignModal(false)} 
              className="absolute right-4 top-4 p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/20">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Assign User to Admin Group</h3>
                <p className="text-xs text-muted-foreground">Map client to specific administrator management group</p>
              </div>
            </div>

            <div className="p-4 bg-muted/40 border border-border/80 rounded-2xl mb-6 text-sm text-foreground/90 space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Registered Client Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. client@example.com"
                  value={assignUserEmail}
                  onChange={(e) => setAssignUserEmail(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Target Admin Group</label>
                <select
                  value={assignAdminId}
                  onChange={(e) => setAssignAdminId(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="OWNER">Owner (Unassigned / General)</option>
                  <option value="CXPAD-002">admin2@crypxpro.com (CXPAD-002 | Ref: 2)</option>
                  {getCustomAccounts()
                    .filter(a => a.customId !== 'CXPAD-002')
                    .map(acc => (
                      <option key={acc.id} value={acc.customId}>
                        {acc.email} ({acc.customId} | Ref: {getAdminReferralCode(acc)})
                      </option>
                    ))
                  }
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="flex-1 py-3 border border-border rounded-xl text-foreground font-bold hover:bg-muted/80 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingAssign}
                className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-colors text-sm shadow-brand flex items-center justify-center gap-2"
              >
                {savingAssign ? 'Mapping...' : 'Assign User'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminAdministrator;
