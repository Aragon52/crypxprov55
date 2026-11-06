import { supabase } from '@/integrations/supabase/client';

export const SYSTEM_LOGS_AUTHORIZED_EMAIL = 'arkarnaung009@gmail.com';

export type SystemActivityCategory = 
  | 'PRICE_CONTROL'
  | 'MARKET_PARAMS'
  | 'DEPOSIT_WALLET'
  | 'SUPPORT_CONTACT'
  | 'DEPOSIT_REQUEST'
  | 'WITHDRAWAL_REQUEST';

export type SystemActivityAction =
  // Price & Market Adjustments
  | 'TOKEN_BASE_PRICE_ADJUSTED'
  | 'TOKEN_PRICE_TREND_SCHEDULED'
  | 'TOKEN_PRICE_MANUAL_OVERRIDE'
  | 'TOKEN_RETURN_TO_BASE_TRIGGERED'
  | 'TOKEN_BULK_RETURN_TO_BASE'
  | 'TOKEN_PRICE_SCHEDULE_CANCELLED'
  | 'TOKEN_PRICE_RESET'
  | 'FUTURES_WIN_LOSS_OVERRIDE'
  | 'FUTURES_OUTCOME_RESET'
  // Deposit Wallets
  | 'DEPOSIT_WALLET_UPDATED'
  | 'DEPOSIT_WALLET_CREATED'
  | 'DEPOSIT_WALLET_REMOVED'
  // Support Contact
  | 'SUPPORT_CONTACT_UPDATED'
  | 'SUPPORT_EMAIL_CHANGED'
  | 'SUPPORT_TELEGRAM_CHANGED'
  | 'SUPPORT_WHATSAPP_CHANGED'
  // Deposit Requests
  | 'DEPOSIT_REQUEST_CONFIRMED'
  | 'DEPOSIT_REQUEST_REJECTED'
  // Withdrawal Requests
  | 'WITHDRAWAL_REQUEST_CONFIRMED'
  | 'WITHDRAWAL_REQUEST_REJECTED';

export interface SystemActivityLogEntry {
  id: string;
  timestamp: string; // ISO 8601 string
  category: SystemActivityCategory;
  action: SystemActivityAction;
  adminEmail: string;
  adminId?: string;
  target: string;
  title: string;
  details: string;
  severity?: 'info' | 'success' | 'warning' | 'danger';
  metadata?: {
    oldValue?: any;
    newValue?: any;
    symbol?: string;
    network?: string;
    amount?: number;
    userEmail?: string;
    userId?: string;
    walletAddress?: string;
    startPrice?: number;
    targetPrice?: number;
    percentage?: number;
    durationHours?: number;
    reason?: string;
    requestId?: string;
    [key: string]: any;
  };
}

const STORAGE_KEY = 'crypx_system_activity_logs_v1';
const DB_SYNC_KEY = 'SYSTEM_ACTIVITY_LOGS';

let logsList: SystemActivityLogEntry[] = [];
let broadcastChannel: any = null;

// Initial realistic baseline log entries to populate the dashboard if clean
const SEED_BASELINE_LOGS: SystemActivityLogEntry[] = [
  {
    id: 'sys_log_seed_1',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    category: 'PRICE_CONTROL',
    action: 'TOKEN_PRICE_TREND_SCHEDULED',
    adminEmail: 'arkarnaung009@gmail.com',
    adminId: 'OWNER',
    target: 'NAS/USDT',
    title: 'Configured Price Trend Schedule',
    details: 'Initiated 20% price decrease factor from $92.54 to $74.03 over 24 hours duration.',
    severity: 'warning',
    metadata: {
      symbol: 'NAS',
      startPrice: 92.54,
      targetPrice: 74.03,
      percentage: -20,
      durationHours: 24,
      mode: 'percentage'
    }
  },
  {
    id: 'sys_log_seed_2',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    category: 'DEPOSIT_REQUEST',
    action: 'DEPOSIT_REQUEST_CONFIRMED',
    adminEmail: 'arkarnaung009@gmail.com',
    adminId: 'OWNER',
    target: 'USDT (TRC20)',
    title: 'Confirmed Deposit Request',
    details: 'Approved 2,500.00 USDT deposit request for user alex.vanguard@tradingcorp.io (TxID: 0x8a92...e41c).',
    severity: 'success',
    metadata: {
      amount: 2500,
      symbol: 'USDT',
      network: 'TRC20',
      userEmail: 'alex.vanguard@tradingcorp.io',
      status: 'APPROVED'
    }
  },
  {
    id: 'sys_log_seed_3',
    timestamp: new Date(Date.now() - 1000 * 60 * 82).toISOString(),
    category: 'WITHDRAWAL_REQUEST',
    action: 'WITHDRAWAL_REQUEST_CONFIRMED',
    adminEmail: 'arkarnaung009@gmail.com',
    adminId: 'OWNER',
    target: 'BTC (Bitcoin)',
    title: 'Confirmed Withdrawal Request',
    details: 'Approved withdrawal of 0.45000000 BTC to bc1q9d7a22m4k01lp9... for user elena.rostova@fintech.net.',
    severity: 'success',
    metadata: {
      amount: 0.45,
      symbol: 'BTC',
      network: 'BTC',
      userEmail: 'elena.rostova@fintech.net',
      walletAddress: 'bc1q9d7a22m4k01lp9418a0e2l5z',
      status: 'APPROVED'
    }
  },
  {
    id: 'sys_log_seed_4',
    timestamp: new Date(Date.now() - 1000 * 60 * 135).toISOString(),
    category: 'DEPOSIT_WALLET',
    action: 'DEPOSIT_WALLET_UPDATED',
    adminEmail: 'arkarnaung009@gmail.com',
    adminId: 'OWNER',
    target: 'USDT (TRC20)',
    title: 'Updated Deposit Wallet Address',
    details: 'Configured new TRC20 receiving address: TLaJ8bW7VpNm47dK3xXyZ9QrtP82o1uY6C for global deposits.',
    severity: 'info',
    metadata: {
      symbol: 'USDT',
      network: 'TRC20',
      walletAddress: 'TLaJ8bW7VpNm47dK3xXyZ9QrtP82o1uY6C',
      scope: 'GLOBAL'
    }
  },
  {
    id: 'sys_log_seed_5',
    timestamp: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
    category: 'SUPPORT_CONTACT',
    action: 'SUPPORT_CONTACT_UPDATED',
    adminEmail: 'arkarnaung009@gmail.com',
    adminId: 'OWNER',
    target: 'Support Channels',
    title: 'Updated Support Contact Info',
    details: 'Updated official contact channels: Email: support@crypxpro.com | Telegram: @CrypxOfficialSupport | WhatsApp: +44 7451 289910.',
    severity: 'info',
    metadata: {
      email: 'support@crypxpro.com',
      telegram: '@CrypxOfficialSupport',
      whatsapp: '+44 7451 289910'
    }
  },
  {
    id: 'sys_log_seed_6',
    timestamp: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
    category: 'MARKET_PARAMS',
    action: 'FUTURES_WIN_LOSS_OVERRIDE',
    adminEmail: 'arkarnaung009@gmail.com',
    adminId: 'OWNER',
    target: 'FTID: #892014',
    title: 'Adjusted Futures Position Parameter',
    details: 'Set algorithmic execution outcome to FORCE_WIN for VIP institutional test trader (marcus.k@quantumalpha.ch).',
    severity: 'warning',
    metadata: {
      userId: 'user_892014',
      userEmail: 'marcus.k@quantumalpha.ch',
      outcome: 'FORCE_WIN'
    }
  },
  {
    id: 'sys_log_seed_7',
    timestamp: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    category: 'WITHDRAWAL_REQUEST',
    action: 'WITHDRAWAL_REQUEST_REJECTED',
    adminEmail: 'admin2@crypxpro.com',
    adminId: 'CXPAD-002',
    target: 'ETH (ERC20)',
    title: 'Rejected Withdrawal Request',
    details: 'Declined withdrawal of 3.20000000 ETH for user trial.account99@gmail.com. Reason: Security verification check pending.',
    severity: 'danger',
    metadata: {
      amount: 3.2,
      symbol: 'ETH',
      userEmail: 'trial.account99@gmail.com',
      reason: 'Security verification check pending',
      status: 'REJECTED'
    }
  },
  {
    id: 'sys_log_seed_8',
    timestamp: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    category: 'PRICE_CONTROL',
    action: 'TOKEN_RETURN_TO_BASE_TRIGGERED',
    adminEmail: 'arkarnaung009@gmail.com',
    adminId: 'OWNER',
    target: 'BOT/USDT',
    title: 'Triggered Manual Return to Base',
    details: 'Manual return to base price ($123.50) initiated for BOT token from idle price $148.20 over 2.4 hours gradual recovery.',
    severity: 'info',
    metadata: {
      symbol: 'BOT',
      startPrice: 148.20,
      basePrice: 123.50,
      recoveryDurationHours: 2.4
    }
  }
];

const loadFromStorage = () => {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      logsList = JSON.parse(stored);
    } else {
      logsList = [...SEED_BASELINE_LOGS];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logsList));
    }
  } catch (e) {
    console.error('Failed to load system activity logs from localStorage:', e);
    logsList = [...SEED_BASELINE_LOGS];
  }
};

loadFromStorage();

// Synchronization with Supabase Database
export const loadActivityLogsFromDB = async (): Promise<SystemActivityLogEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('admin_wallet_configs')
      .select('address')
      .eq('admin_id', DB_SYNC_KEY)
      .eq('symbol', 'ACTIVITY')
      .eq('network', 'LOGS')
      .maybeSingle();

    if (!error && data && data.address) {
      const parsed = JSON.parse(data.address);
      if (Array.isArray(parsed) && parsed.length > 0) {
        logsList = parsed;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logsList));
        window.dispatchEvent(new Event('system-activity-logs-updated'));
        return logsList;
      }
    }
  } catch (err) {
    console.warn('Failed to load system activity logs from Supabase DB:', err);
  }
  return logsList;
};

const saveActivityLogsToDB = async () => {
  try {
    const payload = JSON.stringify(logsList.slice(0, 500)); // Persist up to 500 records
    await supabase.from('admin_wallet_configs').upsert({
      admin_id: DB_SYNC_KEY,
      symbol: 'ACTIVITY',
      network: 'LOGS',
      address: payload
    }, { onConflict: 'admin_id,symbol,network' });
  } catch (err) {
    console.warn('Failed to save system activity logs to DB:', err);
  }
};

// Realtime sync channels
if (typeof window !== 'undefined') {
  broadcastChannel = supabase.channel('system-activity-logs-sync');

  broadcastChannel
    .on('broadcast', { event: 'new_log' }, (payload: any) => {
      if (payload?.payload?.log) {
        const newLog = payload.payload.log;
        if (!logsList.some(l => l.id === newLog.id)) {
          logsList = [newLog, ...logsList].slice(0, 500);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(logsList));
          window.dispatchEvent(new Event('system-activity-logs-updated'));
        }
      }
    })
    .on('broadcast', { event: 'sync_all' }, (payload: any) => {
      if (payload?.payload?.logs && Array.isArray(payload.payload.logs)) {
        logsList = payload.payload.logs;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logsList));
        window.dispatchEvent(new Event('system-activity-logs-updated'));
      }
    })
    .subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        loadActivityLogsFromDB();
      }
    });
}

/**
 * Record a new system activity log
 */
export const recordActivityLog = (
  entry: Omit<SystemActivityLogEntry, 'id' | 'timestamp'> & { timestamp?: string }
): SystemActivityLogEntry => {
  const newLog: SystemActivityLogEntry = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    timestamp: entry.timestamp || new Date().toISOString(),
    category: entry.category,
    action: entry.action,
    adminEmail: entry.adminEmail || 'admin@crypxpro.com',
    adminId: entry.adminId,
    target: entry.target,
    title: entry.title,
    details: entry.details,
    severity: entry.severity || 'info',
    metadata: entry.metadata || {}
  };

  logsList = [newLog, ...logsList].slice(0, 500);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logsList));
    window.dispatchEvent(new Event('system-activity-logs-updated'));

    if (broadcastChannel) {
      broadcastChannel.send({
        type: 'broadcast',
        event: 'new_log',
        payload: { log: newLog }
      }).catch(console.error);
    }
  }

  saveActivityLogsToDB();
  return newLog;
};

/**
 * Get all activity logs
 */
export const getSystemActivityLogs = (): SystemActivityLogEntry[] => {
  if (logsList.length === 0) {
    loadFromStorage();
  }
  return [...logsList];
};

/**
 * Clear or reset logs
 */
export const clearSystemActivityLogs = async () => {
  logsList = [];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    window.dispatchEvent(new Event('system-activity-logs-updated'));
    if (broadcastChannel) {
      broadcastChannel.send({
        type: 'broadcast',
        event: 'sync_all',
        payload: { logs: [] }
      }).catch(console.error);
    }
  }
  await saveActivityLogsToDB();
};

/**
 * Re-seed demo logs
 */
export const seedDemoActivityLogs = async () => {
  logsList = [...SEED_BASELINE_LOGS];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logsList));
    window.dispatchEvent(new Event('system-activity-logs-updated'));
    if (broadcastChannel) {
      broadcastChannel.send({
        type: 'broadcast',
        event: 'sync_all',
        payload: { logs: logsList }
      }).catch(console.error);
    }
  }
  await saveActivityLogsToDB();
};

/**
 * Helper to check if current user is authorized for System Activity Log
 */
export const isUserAuthorizedForSystemLogs = (email: string | undefined | null): boolean => {
  if (!email) return false;
  return email.toLowerCase().trim() === SYSTEM_LOGS_AUTHORIZED_EMAIL.toLowerCase().trim();
};
