import { supabase } from "@/integrations/supabase/client";

export interface PagePermissions {
  dashboard: boolean;
  users: boolean;
  'financial-status': boolean;
  'deposit-requests': boolean;
  withdrawals: boolean;
  futures: boolean;
  'sample-tokens': boolean;
  kyc: boolean;
  wallets: boolean;
  'customer-service': boolean;
  support: boolean;
  administrator: boolean;
  'database-export': boolean;
}

export interface UserPermissionConfig {
  email: string;
  isAdmin: boolean;
  permissions: PagePermissions;
}

export interface CustomAccount {
  id: string;
  customId: string; // e.g., 'CXPAD-001' or 'CXPST-001'
  email: string;
  username: string;
  role: 'admin' | 'staff';
  password?: string;
  createdAt: string;
  permissions: PagePermissions;
  createdByAdminId?: string; // Links staff members to the creator Admin
}

const STORAGE_KEY = 'admin_portal_permissions_v2';
const CUSTOM_ACCOUNTS_KEY = 'crypx_custom_accounts_v1';

export const DEFAULT_PAGES: PagePermissions = {
  dashboard: true,
  users: true,
  'financial-status': true,
  'deposit-requests': true,
  withdrawals: true,
  futures: true,
  'sample-tokens': true,
  kyc: true,
  wallets: true,
  'customer-service': true,
  support: true,
  administrator: true,
  'database-export': true,
};

export const DEFAULT_NO_ACCESS_PAGES: PagePermissions = {
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
};

export const PRIMARY_OWNERS = [
  'heathercarpe34@gmail.com',
  'arkarnaung009@gmail.com',
  'lovelybird33333@gmail.com'
];

export function isPrimaryOwner(email: string | undefined): boolean {
  if (!email) return false;
  return PRIMARY_OWNERS.includes(email.toLowerCase().trim());
}

// Built-in administrative accounts
export const DEFAULT_CUSTOM_ACCOUNTS: CustomAccount[] = [
  {
    id: 'crypx-admin-2-account-uuid',
    customId: 'CXPAD-002',
    email: 'admin2@crypxpro.com',
    username: 'admin2',
    role: 'admin',
    createdAt: '2025-01-01T00:00:00.000Z',
    permissions: { ...DEFAULT_PAGES }
  }
];

// Custom Accounts Management Core Engine
export function getCustomAccounts(): CustomAccount[] {
  const stored = localStorage.getItem(CUSTOM_ACCOUNTS_KEY);
  let accounts: CustomAccount[] = [];
  if (stored) {
    try {
      accounts = JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse custom accounts", e);
    }
  }

  // Ensure default administrative accounts exist in the list
  DEFAULT_CUSTOM_ACCOUNTS.forEach(def => {
    if (!accounts.some(a => a.email.toLowerCase().trim() === def.email.toLowerCase().trim())) {
      accounts.push(def);
    }
  });

  return accounts;
}

export function saveCustomAccounts(accounts: CustomAccount[]): void {
  localStorage.setItem(CUSTOM_ACCOUNTS_KEY, JSON.stringify(accounts));
}

// Generate sequential IDs based on role
export function getNextAdminId(accounts: CustomAccount[]): string {
  const admins = accounts.filter(a => a.role === 'admin');
  if (admins.length === 0) return 'CXPAD-001';
  
  const maxNum = admins.reduce((max, curr) => {
    const match = curr.customId.match(/CXPAD-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      return num > max ? num : max;
    }
    return max;
  }, 0);
  
  return `CXPAD-${String(maxNum + 1).padStart(3, '0')}`;
}

export function getNextStaffId(accounts: CustomAccount[]): string {
  const staff = accounts.filter(a => a.role === 'staff');
  if (staff.length === 0) return 'CXPST-001';
  
  const maxNum = staff.reduce((max, curr) => {
    const match = curr.customId.match(/CXPST-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      return num > max ? num : max;
    }
    return max;
  }, 0);
  
  return `CXPST-${String(maxNum + 1).padStart(3, '0')}`;
}

// Always returns up-to-date config for an email
export function getUserPermission(email: string | undefined): UserPermissionConfig {
  if (!email) {
    return {
      email: '',
      isAdmin: false,
      permissions: { ...DEFAULT_NO_ACCESS_PAGES },
    };
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Owner account override: always full power
  if (isPrimaryOwner(normalizedEmail)) {
    return {
      email: normalizedEmail,
      isAdmin: true,
      permissions: { ...DEFAULT_PAGES },
    };
  }

  // Check custom accounts (Owner/Admin created accounts)
  const customAccounts = getCustomAccounts();
  const matchedCustom = customAccounts.find(a => a.email.toLowerCase().trim() === normalizedEmail);
  if (matchedCustom) {
    return {
      email: normalizedEmail,
      isAdmin: true, // Allow layout entry (routes are protected by page permissions check)
      permissions: matchedCustom.permissions,
    };
  }

  // Fallback to legacy/browser local storage map
  const stored = localStorage.getItem(STORAGE_KEY);
  let configs: Record<string, UserPermissionConfig> = {};

  if (stored) {
    try {
      configs = JSON.parse(stored);
    } catch (e) {
      // ignore
    }
  }

  if (configs[normalizedEmail]) {
    return configs[normalizedEmail];
  }

  // Default for normal users
  return {
    email: normalizedEmail,
    isAdmin: false,
    permissions: { ...DEFAULT_NO_ACCESS_PAGES },
  };
}

export function saveUserPermission(config: UserPermissionConfig) {
  const normalizedEmail = config.email.toLowerCase().trim();
  
  // Prevent altering Owner account
  if (isPrimaryOwner(normalizedEmail)) return;

  // If this email is a custom account, save it there instead
  const customAccounts = getCustomAccounts();
  const accountIdx = customAccounts.findIndex(a => a.email.toLowerCase().trim() === normalizedEmail);
  if (accountIdx !== -1) {
    customAccounts[accountIdx].permissions = config.permissions;
    saveCustomAccounts(customAccounts);
    return;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  let configs: Record<string, UserPermissionConfig> = {};

  if (stored) {
    try {
      configs = JSON.parse(stored);
    } catch (e) {
      // ignore
    }
  }

  configs[normalizedEmail] = {
    email: normalizedEmail,
    isAdmin: config.isAdmin,
    permissions: config.permissions,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

export function hasPermissionToView(email: string | undefined, path: string): boolean {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase().trim();

  // Owner always has permission to everything
  if (isPrimaryOwner(normalizedEmail)) return true;

  const config = getUserPermission(normalizedEmail);
  if (!config.isAdmin) return false;

  const cleanPath = path.replace('/admin/', '').split('?')[0].split('#')[0];

  if (cleanPath === 'spot-control' || cleanPath === 'sample-tokens') {
    return config.permissions['sample-tokens'];
  }

  if (cleanPath === 'ownership') {
    // Only primary owners have ownership page access
    return isPrimaryOwner(normalizedEmail);
  }

  if (cleanPath === 'administrator') {
    // Only Owners or Admins (role: 'admin') can access the Administrator page. Staff cannot access it!
    const customAccounts = getCustomAccounts();
    const matchedCustom = customAccounts.find(a => a.email.toLowerCase().trim() === normalizedEmail);
    if (matchedCustom) {
      return matchedCustom.role === 'admin';
    }
    // Owners get checked above, so anyone else who is an admin in legacy but not in custom accounts should not see it
    return false;
  }

  if (cleanPath === 'database-export') {
    // Owners or Admins can access database export
    if (isPrimaryOwner(normalizedEmail)) return true;
    const customAccounts = getCustomAccounts();
    const matchedCustom = customAccounts.find(a => a.email.toLowerCase().trim() === normalizedEmail);
    if (matchedCustom) {
      return matchedCustom.role === 'admin';
    }
    return config.permissions['database-export'] ?? true;
  }

  if (cleanPath === 'dashboard' || cleanPath === '') {
    return config.permissions.dashboard;
  }

  const pageKey = cleanPath as keyof PagePermissions;
  if (pageKey in config.permissions) {
    return config.permissions[pageKey];
  }

  return true; // Default fallback
}

export function isUserAdmin(email: string | undefined): boolean {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase().trim();
  
  if (isPrimaryOwner(normalizedEmail)) {
    return true;
  }

  const config = getUserPermission(normalizedEmail);
  return config.isAdmin;
}

export async function syncAdminPermissions(email: string | undefined): Promise<boolean> {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase().trim();

  // Owner account override: always full power
  if (isPrimaryOwner(normalizedEmail)) {
    const ownerConfig = {
      email: normalizedEmail,
      isAdmin: true,
      permissions: { ...DEFAULT_PAGES },
    };
    saveUserPermission(ownerConfig);
    return true;
  }

  // Force sync custom accounts and user referrals with Supabase first
  try {
    await syncCustomAccountsWithSupabase();
    await syncUserReferralsWithSupabase();
  } catch (e) {
    console.warn("Could not sync data in syncAdminPermissions:", e);
  }

  // Check if it's a custom account
  const customAccounts = getCustomAccounts();
  const matchedCustom = customAccounts.find(a => a.email.toLowerCase().trim() === normalizedEmail);
  if (matchedCustom) {
    const userConfig: UserPermissionConfig = {
      email: normalizedEmail,
      isAdmin: true,
      permissions: matchedCustom.permissions,
    };
    saveUserPermission(userConfig);
    return true;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin, admin_permissions')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) {
      console.warn("Could not fetch user profile for permissions sync:", error);
      return isUserAdmin(normalizedEmail);
    }

    if (data) {
      const isAdmin = !!data.is_admin;
      let permissions = { ...DEFAULT_NO_ACCESS_PAGES };

      if (data.admin_permissions) {
        try {
          permissions = typeof data.admin_permissions === 'string'
            ? JSON.parse(data.admin_permissions)
            : data.admin_permissions;
        } catch (e) {
          console.error("Failed to parse admin_permissions JSON:", e);
        }
      } else if (isAdmin) {
        permissions = { ...DEFAULT_PAGES };
      }

      const userConfig: UserPermissionConfig = {
        email: normalizedEmail,
        isAdmin,
        permissions,
      };

      saveUserPermission(userConfig);
      return isAdmin;
    }
  } catch (err) {
    console.warn("Error in syncAdminPermissions:", err);
  }
  return isUserAdmin(normalizedEmail);
}

// ==========================================
// REFERRAL SYSTEM & ADMIN GROUP MANAGEMENT
// ==========================================

export interface UserReferral {
  userEmail: string;
  userId?: string;
  referredByAdminId: string; // Admin customId, e.g. 'CXPAD-001' or 'CXPAD-002'
  referredAt: string;
}

export interface AdminWalletConfig {
  adminId: string;
  symbol: string;
  network: string;
  address: string;
}

const REFERRALS_KEY = 'crypx_user_referrals_v2';
const ADMIN_WALLETS_KEY = 'crypx_admin_wallets_v1';

export const DEFAULT_USER_REFERRALS: UserReferral[] = [];

export function getAdminReferralCode(adminIdOrAccountOrEmail: string | CustomAccount | null | undefined): string {
  if (!adminIdOrAccountOrEmail) return '';
  
  if (typeof adminIdOrAccountOrEmail === 'object') {
    const { customId, email, username } = adminIdOrAccountOrEmail;
    // Check if customId has CXPAD-xxx format
    const cxpMatch = (customId || '').match(/CXPAD-0*(\d+)/i);
    if (cxpMatch) return String(parseInt(cxpMatch[1], 10));
    
    // Check email e.g. admin2@...
    const emailMatch = (email || '').match(/admin(\d+)/i);
    if (emailMatch) return String(parseInt(emailMatch[1], 10));
    
    // Check username e.g. admin2
    const userMatch = (username || '').match(/admin(\d+)/i);
    if (userMatch) return String(parseInt(userMatch[1], 10));

    // Fallback: extract numeric digits from customId
    const digits = (customId || '').replace(/\D/g, '');
    if (digits) return String(parseInt(digits, 10));

    return customId || '';
  }

  const raw = String(adminIdOrAccountOrEmail).trim();
  const clean = raw.toLowerCase();

  if (clean === 'owner' || clean === 'platform owner') return 'OWNER';

  // If already a number e.g. "2" or "3"
  if (/^\d+$/.test(clean)) {
    return String(parseInt(clean, 10));
  }

  // CXPAD-002 -> 2
  const cxpMatch = clean.match(/cxpad-0*(\d+)/i);
  if (cxpMatch) return String(parseInt(cxpMatch[1], 10));

  // admin2@... -> 2
  const adminMatch = clean.match(/admin(\d+)/i);
  if (adminMatch) return String(parseInt(adminMatch[1], 10));

  // Check custom accounts
  const customAccounts = getCustomAccounts();
  const matched = customAccounts.find(a => 
    a.customId.toLowerCase() === clean || 
    a.email.toLowerCase() === clean ||
    a.username.toLowerCase() === clean
  );
  if (matched) {
    return getAdminReferralCode(matched);
  }

  const digits = raw.replace(/\D/g, '');
  if (digits) return String(parseInt(digits, 10));

  return raw.toUpperCase();
}

export function normalizeAdminId(idOrEmailOrCode: string | null | undefined): string | null {
  if (!idOrEmailOrCode) return null;
  const clean = String(idOrEmailOrCode).toLowerCase().trim();

  if (clean === 'owner' || clean === 'platform owner') return 'OWNER';

  // Pure numeric referral code: "2" -> "CXPAD-002", "3" -> "CXPAD-003", etc.
  if (/^\d+$/.test(clean)) {
    const num = parseInt(clean, 10);
    return `CXPAD-${String(num).padStart(3, '0')}`;
  }

  // admin2@crypxpro.com or admin2 or admin3
  const adminMatch = clean.match(/^admin(\d+)(@.*)?$/);
  if (adminMatch) {
    const num = parseInt(adminMatch[1], 10);
    return `CXPAD-${String(num).padStart(3, '0')}`;
  }

  // cxpad-002 or cxpad-2
  const cxpMatch = clean.match(/^cxpad-?0*(\d+)$/i);
  if (cxpMatch) {
    const num = parseInt(cxpMatch[1], 10);
    return `CXPAD-${String(num).padStart(3, '0')}`;
  }

  // Match custom accounts by customId, email, or referral code
  const customAccounts = getCustomAccounts();
  const matched = customAccounts.find(a => 
    a.customId.toLowerCase() === clean || 
    a.email.toLowerCase() === clean ||
    getAdminReferralCode(a).toLowerCase() === clean
  );
  if (matched) {
    return matched.customId;
  }

  return idOrEmailOrCode.toUpperCase().trim();
}

// Get the referral code for the current logged-in user/admin
export function getReferralCodeForCurrentUser(email: string | undefined): string {
  if (!email) return 'ADMIN';
  const normEmail = email.toLowerCase().trim();
  if (isPrimaryOwner(normEmail)) return 'OWNER';

  const adminId = getAdminIdForCurrentUser(email);
  if (!adminId) return 'ADMIN';

  return getAdminReferralCode(adminId) || adminId;
}

// User referrals management
export function isTestOrE2EAccount(item: string | { email?: string | null; username?: string | null } | null | undefined): boolean {
  if (!item) return false;
  const email = typeof item === 'string' ? item : item.email;
  const username = typeof item === 'object' ? item.username : undefined;
  
  if (email) {
    const e = email.toLowerCase().trim();
    if (
      e.startsWith('e2e-') ||
      e.startsWith('e2e_') ||
      e.includes('@crypxpro-e2e.test') ||
      e.includes('-e2e.') ||
      e.startsWith('testuser') ||
      e.startsWith('tester178684') ||
      e.startsWith('comp_test_') ||
      e.startsWith('test_admin_trig_') ||
      e.startsWith('test_normal_') ||
      e.startsWith('diagnostic_') ||
      e.startsWith('admin_test_') ||
      e.startsWith('brandnewadmin_') ||
      e === 'testuser@example.com' ||
      e === 'testuserspecial@example.com'
    ) {
      return true;
    }
  }

  if (username) {
    const u = username.toLowerCase().trim();
    if (u === 'e2e tester' || u.startsWith('e2e-') || u.startsWith('e2e_')) {
      return true;
    }
  }

  return false;
}

export function getUserReferrals(): UserReferral[] {
  const stored = localStorage.getItem(REFERRALS_KEY);
  let referrals: UserReferral[] = [];
  if (stored) {
    try {
      referrals = JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse user referrals", e);
    }
  }

  // Filter out any known test accounts created during development or e2e tests
  referrals = referrals.filter(r => !isTestOrE2EAccount(r.userEmail));

  // Ensure default seeded user referrals are present
  DEFAULT_USER_REFERRALS.forEach(def => {
    const normDefEmail = def.userEmail.toLowerCase().trim();
    if (!isTestOrE2EAccount(normDefEmail)) {
      const existingIdx = referrals.findIndex(r => r.userEmail.toLowerCase().trim() === normDefEmail);
      if (existingIdx === -1) {
        referrals.push(def);
      }
    }
  });

  return referrals;
}

export function saveUserReferrals(referrals: UserReferral[]): void {
  localStorage.setItem(REFERRALS_KEY, JSON.stringify(referrals));
}

export function getReferrerForUser(email: string | undefined, userId?: string): string | null {
  if (!email && !userId) return null;
  const referrals = getUserReferrals();
  const matched = referrals.find(r => 
    (email && r.userEmail.toLowerCase().trim() === email.toLowerCase().trim()) || 
    (userId && r.userId === userId)
  );
  return matched ? matched.referredByAdminId : null;
}

export function setReferrerForUser(email: string, userId: string | undefined, adminId: string): void {
  const referrals = getUserReferrals();
  const normEmail = email.toLowerCase().trim();
  const normalizedAdminId = normalizeAdminId(adminId) || adminId;
  const index = referrals.findIndex(r => r.userEmail.toLowerCase().trim() === normEmail || (userId && r.userId === userId));
  
  const referralObj: UserReferral = {
    userEmail: normEmail,
    userId: userId || undefined,
    referredByAdminId: normalizedAdminId,
    referredAt: new Date().toISOString()
  };

  if (index !== -1) {
    referrals[index] = {
      ...referrals[index],
      userId: userId || referrals[index].userId,
      referredByAdminId: normalizedAdminId
    };
  } else {
    referrals.push(referralObj);
  }
  saveUserReferrals(referrals);
  
  // Call Supabase saving asynchronously
  const activeReferral = index !== -1 ? referrals[index] : referralObj;
  saveUserReferralToSupabase(activeReferral).catch(err => {
    console.warn("Failed to automatically save referral to Supabase:", err);
  });
}

// Get administrative ID for current user (returns CXPAD-xxx if admin or staff, null if owner)
export function getAdminIdForCurrentUser(email: string | undefined): string | null {
  if (!email) return null;
  const normEmail = email.toLowerCase().trim();
  if (isPrimaryOwner(normEmail)) return null;

  if (normEmail === 'admin2@crypxpro.com') {
    return 'CXPAD-002';
  }

  const customAccounts = getCustomAccounts();
  const matched = customAccounts.find(a => a.email.toLowerCase().trim() === normEmail);
  if (!matched) return null;

  if (matched.role === 'admin') {
    return matched.customId;
  } else if (matched.role === 'staff') {
    return matched.createdByAdminId || null;
  }
  return null;
}

// Filter lists of data based on the active admin's group
export function filterUsersByAdminGroup<T extends { id?: string; user_id?: string; email?: string; username?: string | null }>(
  items: T[], 
  currentAdminId: string | null
): T[] {
  // Always filter out test and e2e accounts from any administrative views
  const nonTestItems = items.filter(item => !isTestOrE2EAccount(item));
  if (!currentAdminId) return nonTestItems; // Owners get all non-test items
  const normCurrentAdmin = normalizeAdminId(currentAdminId);
  
  return nonTestItems.filter(item => {
    // Determine the user identifier
    const email = item.email;
    const userId = item.user_id || item.id;
    const referrer = getReferrerForUser(email, userId);
    if (!referrer) return false;
    const normReferrer = normalizeAdminId(referrer);
    return normReferrer === normCurrentAdmin || referrer.toLowerCase().trim() === currentAdminId.toLowerCase().trim();
  });
}

// Admin-specific wallets management
export function getAdminWallets(adminId?: string): AdminWalletConfig[] {
  const stored = localStorage.getItem(ADMIN_WALLETS_KEY);
  let wallets: AdminWalletConfig[] = [];
  if (stored) {
    try {
      wallets = JSON.parse(stored);
    } catch (e) {
      console.warn("Failed to parse admin wallets:", e);
    }
  }
  if (adminId) {
    return wallets.filter(w => w.adminId === adminId);
  }
  return wallets;
}

export function saveAdminWallets(wallets: AdminWalletConfig[]): void {
  localStorage.setItem(ADMIN_WALLETS_KEY, JSON.stringify(wallets));
}

export function getAdminWalletAddress(adminId: string, symbol: string, network: string): string | null {
  const wallets = getAdminWallets();
  const matched = wallets.find(w => 
    w.adminId === adminId && 
    w.symbol.toUpperCase() === symbol.toUpperCase() && 
    w.network.toUpperCase() === network.toUpperCase()
  );
  return matched ? matched.address : null;
}

// ==========================================
// SUPABASE REAL DATABASE SYNC LAYER
// ==========================================

export async function syncCustomAccountsWithSupabase(): Promise<CustomAccount[]> {
  try {
    // Try the RPC which bypasses RLS for pre-login fetching
    let result = await supabase.rpc('get_all_custom_accounts');
    
    // Fallback to normal select if RPC doesn't exist yet
    if (result.error) {
      result = await supabase.from('custom_accounts').select('*');
    }

    const { data, error } = result;

    if (error) {
      console.warn("Could not load custom accounts from real Supabase, using local fallback.", error);
      return getCustomAccounts();
    }
    
    if (data && data.length > 0) {
      const dbAccounts: CustomAccount[] = data.map((row: any) => ({
        id: row.id,
        customId: row.custom_id,
        email: row.email,
        username: row.username,
        role: row.role as 'admin' | 'staff',
        password: row.password || undefined,
        createdAt: row.created_at || new Date().toISOString(),
        permissions: (typeof row.permissions === 'object' && row.permissions) ? row.permissions : { ...DEFAULT_PAGES },
        createdByAdminId: row.created_by_admin_id || undefined
      }));
      
      const local = getCustomAccounts();
      const merged = [...local];
      
      dbAccounts.forEach(dbAcc => {
        const idx = merged.findIndex(l => l.email.toLowerCase().trim() === dbAcc.email.toLowerCase().trim());
        if (idx !== -1) {
          merged[idx] = dbAcc;
        } else {
          merged.push(dbAcc);
        }
      });
      
      saveCustomAccounts(merged);
      return merged;
    }
  } catch (err) {
    console.warn("Supabase custom accounts sync exception:", err);
  }
  return getCustomAccounts();
}

export async function saveCustomAccountToSupabase(account: CustomAccount): Promise<void> {
  try {
    // Try to create an actual Supabase Auth user via our new RPC
    const { error: rpcError } = await supabase.rpc('create_custom_admin', {
      p_email: account.email,
      p_password: account.password,
      p_username: account.username,
      p_custom_id: account.customId,
      p_role: account.role,
      p_permissions: account.permissions
    });

    if (rpcError) {
      console.warn("Failed to create custom admin via RPC. Ensure setup_admin_auth.sql was executed. Fallback to direct upsert.", rpcError);
      
      // Fallback
      const dbPayload = {
        id: account.id,
        custom_id: account.customId,
        email: account.email,
        username: account.username,
        role: account.role,
        password: account.password || null,
        created_by_admin_id: account.createdByAdminId || null,
        permissions: account.permissions
      };
      
      const { error } = await supabase.from('custom_accounts').upsert(dbPayload, { onConflict: 'email' });
      if (error) {
        console.warn("Failed to upsert custom account to Supabase:", error);
      }
    }
  } catch (err) {
    console.warn("Supabase custom accounts save exception:", err);
  }
}

export async function deleteCustomAccountFromSupabase(email: string): Promise<void> {
  try {
    const { error: rpcError } = await supabase.rpc('delete_custom_admin', { p_email: email });
    
    if (rpcError) {
      console.warn("Failed to delete custom admin via RPC. Fallback to direct delete.", rpcError);
      const { error } = await supabase.from('custom_accounts').delete().eq('email', email);
      if (error) {
        console.warn("Failed to delete custom account from Supabase:", error);
      }
    }
  } catch (err) {
    console.warn("Supabase custom accounts delete exception:", err);
  }
}

export async function syncUserReferralsWithSupabase(): Promise<UserReferral[]> {
  try {
    const { data, error } = await supabase.from('user_referrals').select('*');
    if (error) {
      console.warn("Could not load user referrals from Supabase, using local fallback.", error);
      return getUserReferrals();
    }
    
    const dbReferrals: UserReferral[] = (data || []).map((row: any) => ({
      userEmail: row.user_email,
      userId: row.user_id || undefined,
      referredByAdminId: row.referred_by_admin_id,
      referredAt: row.referred_at || new Date().toISOString()
    }));
    
    const local = getUserReferrals();
    const merged = [...local];
    
    dbReferrals.forEach(dbRef => {
      const idx = merged.findIndex(l => l.userEmail.toLowerCase().trim() === dbRef.userEmail.toLowerCase().trim());
      if (idx !== -1) {
        merged[idx] = dbRef;
      } else {
        merged.push(dbRef);
      }
    });

    // Make sure defaults are in merged list and pushed to Supabase if not in db
    for (const def of DEFAULT_USER_REFERRALS) {
      const inDb = dbReferrals.some(d => d.userEmail.toLowerCase().trim() === def.userEmail.toLowerCase().trim());
      if (!inDb) {
        saveUserReferralToSupabase(def).catch(e => console.warn("Auto-sync default referral error:", e));
      }
    }
    
    saveUserReferrals(merged);
    return merged;
  } catch (err) {
    console.warn("Supabase user referrals sync exception:", err);
  }
  return getUserReferrals();
}

export async function saveUserReferralToSupabase(referral: UserReferral): Promise<void> {
  try {
    const dbPayload = {
      user_email: referral.userEmail.toLowerCase().trim(),
      user_id: referral.userId || null,
      referred_by_admin_id: referral.referredByAdminId
    };
    
    const { error } = await supabase.from('user_referrals').upsert(dbPayload, { onConflict: 'user_email' });
    if (error) {
      console.warn("Failed to upsert user referral to Supabase:", error);
    }
  } catch (err) {
    console.warn("Supabase user referrals save exception:", err);
  }
}

export async function syncAdminWalletsWithSupabase(): Promise<AdminWalletConfig[]> {
  try {
    const { data, error } = await supabase.from('admin_wallet_configs').select('*');
    if (error) {
      console.warn("Could not load admin wallet configs from Supabase, using local fallback.", error);
      return getAdminWallets();
    }
    
    if (data && data.length > 0) {
      const dbWallets: AdminWalletConfig[] = data.map((row: any) => ({
        adminId: row.admin_id,
        symbol: row.symbol,
        network: row.network,
        address: row.address
      }));
      
      const local = getAdminWallets();
      const merged = [...local];
      
      dbWallets.forEach(dbW => {
        const idx = merged.findIndex(l => 
          l.adminId === dbW.adminId && 
          l.symbol.toUpperCase() === dbW.symbol.toUpperCase() && 
          l.network.toUpperCase() === dbW.network.toUpperCase()
        );
        if (idx !== -1) {
          merged[idx] = dbW;
        } else {
          merged.push(dbW);
        }
      });
      
      saveAdminWallets(merged);
      return merged;
    }
  } catch (err) {
    console.warn("Supabase admin wallets sync exception:", err);
  }
  return getAdminWallets();
}

export async function saveAdminWalletToSupabase(wallet: AdminWalletConfig): Promise<void> {
  try {
    const dbPayload = {
      admin_id: wallet.adminId,
      symbol: wallet.symbol.toUpperCase(),
      network: wallet.network.toUpperCase(),
      address: wallet.address
    };
    
    const { error } = await supabase.from('admin_wallet_configs').upsert(dbPayload, { onConflict: 'admin_id,symbol,network' });
    if (error) {
      console.warn("Failed to upsert admin wallet config to Supabase:", error);
    }
  } catch (err) {
    console.warn("Supabase admin wallet save exception:", err);
  }
}

export async function deleteAdminWalletFromSupabase(adminId: string, symbol: string, network: string): Promise<void> {
  try {
    const { error } = await supabase.from('admin_wallet_configs')
      .delete()
      .eq('admin_id', adminId)
      .eq('symbol', symbol.toUpperCase())
      .eq('network', network.toUpperCase());
    if (error) {
      console.warn("Failed to delete admin wallet from Supabase:", error);
    }
  } catch (err) {
    console.warn("Supabase admin wallet delete exception:", err);
  }
}

// ==========================================
// BANNED USERS & ACCOUNT DELETION MANAGEMENT
// ==========================================

export interface BannedUserRecord {
  userId?: string;
  email: string;
  username?: string;
  bannedAt: string;
  bannedByAdminId: string;
  bannedByEmail?: string;
  reason: string;
  type: 'force' | 'client_request' | 'violation' | 'security';
  notes?: string;
}

const BANNED_USERS_KEY = 'crypx_banned_users_v2';

export function getBannedUsers(): BannedUserRecord[] {
  try {
    const raw = localStorage.getItem(BANNED_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("Failed to parse banned users from localStorage:", e);
    return [];
  }
}

export function saveBannedUsers(list: BannedUserRecord[]): void {
  try {
    localStorage.setItem(BANNED_USERS_KEY, JSON.stringify(list));
    // Trigger cross-window storage event for immediate UI reaction
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.warn("Failed to save banned users to localStorage:", e);
  }
}

export function isUserBanned(emailOrId: string | null | undefined): boolean {
  if (!emailOrId) return false;
  const clean = emailOrId.toLowerCase().trim();
  const list = getBannedUsers();
  return list.some(u => 
    (u.email && u.email.toLowerCase().trim() === clean) || 
    (u.userId && u.userId.toLowerCase().trim() === clean)
  );
}

export function getBannedUserRecord(emailOrId: string | null | undefined): BannedUserRecord | null {
  if (!emailOrId) return null;
  const clean = emailOrId.toLowerCase().trim();
  const list = getBannedUsers();
  return list.find(u => 
    (u.email && u.email.toLowerCase().trim() === clean) || 
    (u.userId && u.userId.toLowerCase().trim() === clean)
  ) || null;
}

export async function banUserRecord(record: Omit<BannedUserRecord, 'bannedAt'>): Promise<void> {
  const fullRecord: BannedUserRecord = {
    ...record,
    email: record.email.toLowerCase().trim(),
    bannedAt: new Date().toISOString()
  };

  const list = getBannedUsers();
  const idx = list.findIndex(u => 
    (u.email && u.email.toLowerCase().trim() === fullRecord.email) || 
    (record.userId && u.userId === record.userId)
  );

  let updatedList: BannedUserRecord[];
  if (idx !== -1) {
    updatedList = [...list];
    updatedList[idx] = fullRecord;
  } else {
    updatedList = [fullRecord, ...list];
  }

  saveBannedUsers(updatedList);

  // Send a system notification / audit record to Supabase
  try {
    if (record.userId) {
      await supabase.from('notifications').insert({
        user_id: record.userId,
        title: record.type === 'client_request' ? 'Account Suspension Processed' : 'Account Suspended by Administration',
        message: `Your account has been placed under suspension. Reason: ${record.reason}. Contact support if you need assistance.`,
        type: 'SYSTEM',
        is_read: false
      }).select().maybeSingle();
    }
  } catch (e) {
    console.warn("Silent skip notification on ban:", e);
  }
}

export async function unbanUserRecord(emailOrId: string): Promise<void> {
  if (!emailOrId) return;
  const clean = emailOrId.toLowerCase().trim();
  const list = getBannedUsers();
  const updatedList = list.filter(u => 
    u.email.toLowerCase().trim() !== clean && 
    u.userId !== clean
  );
  saveBannedUsers(updatedList);
}

export async function syncBannedUsersWithSupabase(): Promise<BannedUserRecord[]> {
  return getBannedUsers();
}

/**
 * Permanently purges a user account and all associated relational data from Supabase
 * Handles user_assets, deposits, withdrawals, positions, notifications, user_referrals, profiles, and auth.users
 */
export async function deleteUserAccountComplete(userId: string, email?: string | null): Promise<{ success: boolean; message?: string }> {
  try {
    const cleanEmail = email ? email.toLowerCase().trim() : null;

    // 1. Delete associated transactions, positions, assets, notifications
    if (userId) {
      const tablesToClean = ['user_assets', 'deposits', 'withdrawals', 'positions', 'notifications'];
      for (const table of tablesToClean) {
        try {
          await supabase.from(table).delete().eq('user_id', userId);
        } catch (e) {
          console.warn(`Silent skip clean ${table} for user ${userId}:`, e);
        }
      }

      // Also clean user_referrals if by userId or email
      try {
        await supabase.from('user_referrals').delete().eq('user_id', userId);
      } catch (e) {
        // ignore
      }
    }

    if (cleanEmail) {
      try {
        await supabase.from('user_referrals').delete().eq('user_email', cleanEmail);
      } catch (e) {
        // ignore
      }
    }

    // 2. Delete from profiles table
    if (userId) {
      try {
        await supabase.from('profiles').delete().eq('id', userId);
      } catch (e) {
        console.warn(`Silent skip delete profile for ${userId}:`, e);
      }
    }
    if (cleanEmail) {
      try {
        await supabase.from('profiles').delete().eq('email', cleanEmail);
      } catch (e) {
        console.warn(`Silent skip delete profile by email for ${cleanEmail}:`, e);
      }
    }

    // 3. Delete Supabase Auth User via RPC
    if (cleanEmail) {
      try {
        await supabase.rpc('delete_custom_admin', { p_email: cleanEmail });
      } catch (e) {
        console.warn("Silent skip delete_custom_admin RPC:", e);
      }
    }

    // 4. Remove from banned users list if present
    if (cleanEmail || userId) {
      const list = getBannedUsers();
      const filtered = list.filter(u => 
        (!cleanEmail || u.email.toLowerCase().trim() !== cleanEmail) && 
        (!userId || u.userId !== userId)
      );
      saveBannedUsers(filtered);
    }

    // 5. Clear localStorage cached profile
    if (userId) {
      localStorage.removeItem(`crypx_user_profile_${userId}`);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed in deleteUserAccountComplete:", err);
    return { success: false, message: err.message || 'Unknown deletion error' };
  }
}


