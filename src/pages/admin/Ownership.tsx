import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, ShieldAlert, ArrowLeft, RefreshCw, Key, Trash2, 
  UserPlus, Check, X, Eye, EyeOff, User, Mail, Shield, AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { 
  PagePermissions, 
  CustomAccount, 
  getCustomAccounts, 
  saveCustomAccounts, 
  getNextAdminId,
  getAdminReferralCode,
  isPrimaryOwner,
  DEFAULT_PAGES,
  syncCustomAccountsWithSupabase,
  saveCustomAccountToSupabase,
  deleteCustomAccountFromSupabase
} from '@/lib/adminPermissions';

const ADMIN_PAGES: { key: keyof PagePermissions; label: string; desc: string }[] = [
  { key: 'dashboard', label: 'Dashboard', desc: 'Main admin dashboard' },
  { key: 'users', label: 'Users', desc: 'User accounts & general details' },
  { key: 'financial-status', label: 'Financial Status', desc: 'User balances & manual adjustment' },
  { key: 'deposit-requests', label: 'Deposits', desc: 'Process deposit requests' },
  { key: 'withdrawals', label: 'Withdrawals', desc: 'Approve & manage withdrawals' },
  { key: 'futures', label: 'Futures Control', desc: 'Control active futures and win rates' },
  { key: 'sample-tokens', label: 'Spot Control', desc: 'Control spot token prices and trend schedules' },
  { key: 'kyc', label: 'KYC', desc: 'Verify user submissions' },
  { key: 'wallets', label: 'Wallets', desc: 'Set company crypto addresses' },
  { key: 'customer-service', label: 'Support Chat', desc: 'Chat directly with users' },
  { key: 'support', label: 'Contact Details', desc: 'Edit contact support config' },
  { key: 'administrator', label: 'Administrator', desc: 'Manage group referrals and links' },
  { key: 'database-export', label: 'Database Export', desc: 'Backup and download complete database' }
];

const AdminOwnership = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentUserEmail = user?.email || '';
  const isOwner = isPrimaryOwner(currentUserEmail);

  // Core custom accounts state
  const [accounts, setAccounts] = useState<CustomAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Create admin form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<PagePermissions>({
    dashboard: true,
    users: true,
    'financial-status': false,
    'deposit-requests': true,
    withdrawals: true,
    futures: true,
    'sample-tokens': true,
    kyc: true,
    wallets: false,
    'customer-service': false,
    support: true,
    administrator: false,
    'database-export': false,
  });

  // Password editing and permission editing states for existing admins
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<{ id: string; customId: string; email: string } | null>(null);

  // Load custom accounts from permissions library
  const loadAccounts = async () => {
    setLoading(true);
    try {
      const allAccounts = await syncCustomAccountsWithSupabase();
      // Filter out only admin accounts for this page
      const admins = allAccounts.filter(a => a.role === 'admin');
      setAccounts(admins);
    } catch (e) {
      console.error("Failed to load custom admins:", e);
      // Fallback
      const allAccounts = getCustomAccounts();
      const admins = allAccounts.filter(a => a.role === 'admin');
      setAccounts(admins);
      toast.error("Could not fetch administrator accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOwner) {
      loadAccounts();
    }
  }, [isOwner]);

  // Handle new admin registration
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !email.trim() || !password.trim()) {
      toast.error("All credentials (username, email, password) are required.");
      return;
    }

    const normEmail = email.toLowerCase().trim();
    if (isPrimaryOwner(normEmail)) {
      toast.error("This email is registered as a platform primary owner.");
      return;
    }

    const allAccounts = getCustomAccounts();
    if (allAccounts.some(a => a.email.toLowerCase() === normEmail)) {
      toast.error("An account with this email already exists.");
      return;
    }

    // Generate next CXPAD sequential ID
    const nextId = getNextAdminId(allAccounts);

    const newAdmin: CustomAccount = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      customId: nextId,
      email: normEmail,
      username: username.trim(),
      role: 'admin',
      password: password.trim(),
      createdAt: new Date().toISOString(),
      permissions: { ...selectedPermissions }
    };

    const updatedAccounts = [...allAccounts, newAdmin];
    saveCustomAccounts(updatedAccounts);
    await saveCustomAccountToSupabase(newAdmin);
    
    // Reset form
    setUsername('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    
    // Reload lists
    loadAccounts();
    toast.success(`Admin account ${nextId} created successfully!`);
  };

  // Toggle page permission checkbox on form
  const handleToggleFormPermission = (key: keyof PagePermissions) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Toggle permission for existing Admin
  const handleToggleAdminPermission = async (adminId: string, pageKey: keyof PagePermissions) => {
    const allAccounts = getCustomAccounts();
    let updatedAdmin: CustomAccount | null = null;
    const updated = allAccounts.map(account => {
      if (account.id === adminId) {
        updatedAdmin = {
          ...account,
          permissions: {
            ...account.permissions,
            [pageKey]: !account.permissions[pageKey]
          }
        };
        return updatedAdmin;
      }
      return account;
    });

    saveCustomAccounts(updated);
    if (updatedAdmin) {
      await saveCustomAccountToSupabase(updatedAdmin);
    }
    loadAccounts();
    toast.success("Admin permissions updated successfully.");
  };

  // Handle admin deletion (initiated via pure React confirmation modal)
  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;
    const { id, customId, email } = adminToDelete;
    
    // Clear state first
    setAdminToDelete(null);

    const allAccounts = getCustomAccounts();
    const filtered = allAccounts.filter(account => account.id !== id);
    saveCustomAccounts(filtered);
    await deleteCustomAccountFromSupabase(email);
    
    loadAccounts();
    toast.success(`Admin ${customId} has been successfully deleted.`);
  };

  // Save updated password
  const handleSaveNewPassword = async (adminId: string) => {
    if (!newPassword.trim()) {
      toast.error("Password cannot be blank.");
      return;
    }

    const allAccounts = getCustomAccounts();
    let updatedAdmin: CustomAccount | null = null;
    const updated = allAccounts.map(account => {
      if (account.id === adminId) {
        updatedAdmin = {
          ...account,
          password: newPassword.trim()
        };
        return updatedAdmin;
      }
      return account;
    });

    saveCustomAccounts(updated);
    if (updatedAdmin) {
      await saveCustomAccountToSupabase(updatedAdmin);
    }
    setEditingAccountId(null);
    setNewPassword('');
    setShowNewPassword(false);
    loadAccounts();
    toast.success("Administrator password updated successfully.");
  };

  // Access check guard
  if (!isOwner) {
    return (
      <div className="p-8 min-h-[80vh] flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
          <ShieldAlert size={48} className="animate-bounce" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground uppercase mb-2">Restricted Access</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          This panel is reserved exclusively for the platform Owner. Unauthorized personnel are strictly forbidden from viewing ownership controls.
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

  // Pre-calculate next admin ID for UI preview
  const nextPreviewId = getNextAdminId(getCustomAccounts());

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-[32px] shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-primary w-6 h-6 animate-pulse" />
            <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Ownership Panel</h1>
          </div>
          <p className="text-xs font-semibold text-muted-foreground">
            Platform Owner Core. Create secondary Administrator accounts with custom permissions and manage credentials.
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

      {/* Info Warning Alert */}
      <div className="flex items-start gap-4 p-5 bg-amber-500/10 border border-amber-500/20 rounded-[24px] text-amber-500">
        <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold uppercase tracking-wider">Owner Credentials Active</h4>
          <p className="text-xs opacity-90 leading-relaxed font-medium">
            Your primary owner account (<span className="underline font-bold">{currentUserEmail}</span>) has permanent, absolute access across all panels. Created administrator accounts listed below will be restricted strictly to their assigned viewing privileges.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Side: Create Admin Form */}
        <div className="xl:col-span-1 bg-card border border-border rounded-[32px] p-6 shadow-xl space-y-6 h-fit">
          <div className="space-y-1 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <UserPlus className="text-primary w-5 h-5" />
              <h2 className="text-lg font-black uppercase tracking-tight">Create Administrator</h2>
            </div>
            <p className="text-xs text-muted-foreground">Register a new secure admin account with targeted rights.</p>
          </div>

          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">Assigned Admin ID & Referral Code</label>
              <div className="flex gap-2">
                <div className="flex-1 px-4 py-3 bg-muted border border-border rounded-xl text-sm font-bold text-primary font-mono flex items-center gap-2">
                  <ShieldCheck size={16} />
                  {nextPreviewId}
                </div>
                <div className="px-4 py-3 bg-primary/10 border border-primary/20 rounded-xl text-sm font-black text-primary font-mono flex items-center gap-1.5" title="Unique referral code">
                  <span className="text-[10px] uppercase font-sans text-muted-foreground">Code:</span>
                  {getAdminReferralCode(nextPreviewId)}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">Username / Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input 
                  type="text"
                  placeholder="e.g. John Admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input 
                  type="email"
                  placeholder="e.g. admin@crypx.pro"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">Login Password</label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="Create secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono font-bold"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Custom permissions checkboxes */}
            <div className="space-y-3 pt-2">
              <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-1">Page View Permissions</label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {ADMIN_PAGES.map((page) => (
                  <button
                    type="button"
                    key={page.key}
                    onClick={() => handleToggleFormPermission(page.key)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                      selectedPermissions[page.key]
                        ? 'bg-primary/10 border-primary/30 text-primary font-bold'
                        : 'bg-muted/40 border-border/50 text-muted-foreground'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                      selectedPermissions[page.key] ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-card'
                    }`}>
                      {selectedPermissions[page.key] && <Check size={10} className="stroke-[3]" />}
                    </div>
                    <span className="text-[10px] truncate">{page.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all uppercase tracking-wider text-xs"
            >
              <UserPlus size={16} />
              Register Administrator
            </button>
          </form>
        </div>

        {/* Right Side: Admins List */}
        <div className="xl:col-span-2 bg-card border border-border rounded-[32px] p-6 shadow-xl space-y-6 flex flex-col">
          <div className="space-y-1 border-b border-border pb-4">
            <h2 className="text-lg font-black uppercase tracking-tight">Active Administrators</h2>
            <p className="text-xs text-muted-foreground">Manage accounts, change credentials, and edit page permissions instantly.</p>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-muted-foreground">
              <RefreshCw className="w-8 h-8 animate-spin text-primary mb-4" />
              <span className="text-xs font-black uppercase">Reading Database Registry...</span>
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <ShieldAlert className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-sm font-black uppercase mb-1">No Secondary Admins Created</h3>
              <p className="text-xs text-muted-foreground max-w-sm">Use the registration form on the left to add your first secure Administrator account.</p>
            </div>
          ) : (
            <div className="space-y-6 flex-1 overflow-y-auto max-h-[70vh] pr-2">
              {accounts.map((admin) => (
                <div key={admin.id} className="p-5 bg-muted/20 border border-border rounded-2xl space-y-4 hover:border-primary/20 transition-all">
                  
                  {/* Row 1: Admin Identity */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-border/50">
                    <div className="flex items-start gap-3">
                      <div className="p-3 bg-primary/10 text-primary rounded-xl font-black font-mono text-xs">
                        {admin.customId}
                      </div>
                      <div>
                        <h4 className="text-sm font-black flex items-center gap-1.5">
                          {admin.username}
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[9px] uppercase font-bold rounded-full border border-blue-500/20">
                            ADMINISTRATOR
                          </span>
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] uppercase font-bold font-mono rounded-full border border-primary/20">
                            Ref: {getAdminReferralCode(admin)}
                          </span>
                        </h4>
                        <p className="text-xs text-muted-foreground font-medium">{admin.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Password Action Trigger */}
                      {editingAccountId === admin.id ? (
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <input 
                              type={showNewPassword ? "text" : "password"}
                              placeholder="New password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="px-3 py-1.5 pr-8 bg-card border border-border rounded-xl text-xs font-mono font-bold focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                            >
                              {showNewPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                          </div>
                          <button
                            onClick={() => handleSaveNewPassword(admin.id)}
                            className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-xs font-bold transition-all"
                            title="Save password"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setEditingAccountId(null);
                              setNewPassword('');
                            }}
                            className="p-2 bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 rounded-xl text-xs font-bold transition-all"
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono bg-card px-2.5 py-1 rounded-lg border border-border text-muted-foreground/80">
                            Pass: <span className="font-black font-sans">•••••</span> ({admin.password})
                          </span>
                          <button
                            onClick={() => {
                              setEditingAccountId(admin.id);
                              setNewPassword(admin.password || '');
                            }}
                            className="p-2 bg-muted hover:bg-accent border border-border text-muted-foreground hover:text-foreground rounded-xl transition-all"
                            title="Change password"
                          >
                            <Key size={14} />
                          </button>
                        </div>
                      )}

                      {/* Delete Trigger */}
                      <button
                        onClick={() => setAdminToDelete({ id: admin.id, customId: admin.customId, email: admin.email })}
                        className="p-2 bg-destructive/5 hover:bg-destructive/10 text-destructive border border-destructive/10 rounded-xl transition-all"
                        title="Delete Administrator account"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Assigned Page Permissions Matrix */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Shield size={12} />
                      Authorized Views Matrix
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5">
                      {ADMIN_PAGES.map((page) => {
                        const hasAccess = admin.permissions[page.key];
                        return (
                          <button
                            key={page.key}
                            onClick={() => handleToggleAdminPermission(admin.id, page.key)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border flex items-center gap-1.5 transition-all ${
                              hasAccess 
                                ? 'bg-primary/10 border-primary/30 text-primary' 
                                : 'bg-card border-border/40 text-muted-foreground/50 hover:bg-muted'
                            }`}
                            title={`Click to ${hasAccess ? 'revoke' : 'grant'} view permission for ${page.label}`}
                          >
                            {hasAccess ? (
                              <Check size={10} className="stroke-[3] text-primary" />
                            ) : (
                              <X size={10} className="text-muted-foreground/30" />
                            )}
                            {page.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {adminToDelete && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-[32px] max-w-md w-full p-6 shadow-2xl space-y-6"
          >
            <div className="flex items-center gap-3 text-destructive border-b border-border pb-4">
              <div className="p-3 bg-destructive/10 rounded-2xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">Delete Administrator?</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                You are about to permanently delete <span className="font-bold text-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{adminToDelete.customId}</span> (<span className="font-bold text-foreground underline">{adminToDelete.email}</span>). 
                This will revoke their access to all admin panels and remove their credentials immediately.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setAdminToDelete(null)}
                className="flex-1 py-3 bg-muted hover:bg-accent border border-border text-xs font-bold rounded-xl transition-all uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAdmin}
                className="flex-1 py-3 bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-bold rounded-xl transition-all uppercase tracking-wider shadow-lg shadow-destructive/20"
              >
                Permanently Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminOwnership;
