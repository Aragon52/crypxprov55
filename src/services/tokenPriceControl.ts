import { supabase } from '@/integrations/supabase/client';
import { recordActivityLog } from '@/services/systemActivityLog';

export interface TokenPriceSchedule {
  id: string;
  symbol: string; // e.g. "NAS", "AEP", "BOT", "TTZS", "ECB", etc.
  type: 'percentage' | 'fixed_target' | 'manual_override';
  direction: 'increase' | 'decrease' | 'set_price';
  changePercent: number; // e.g. 20 for 20%
  startPrice: number; // Base or starting price e.g. 92.54
  targetPrice: number; // Target price e.g. 74.032
  startTime: number; // timestamp in ms
  durationHours: number; // e.g., 24 (1 day), 96 (4 days)
  endTime: number; // timestamp in ms
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdByAdmin?: string;
  note?: string;
  returnDurationHours?: number;
  returnInitiatedAt?: number; // Timestamp in ms when admin clicked manual return
  returnStartPrice?: number; // Price when manual return was initiated
  returnBasePrice?: number; // Target base price to return to
}

export interface TokenPriceAuditLog {
  id: string;
  timestamp: string;
  symbol: string;
  action: string;
  details: string;
  adminEmail: string;
}

export const SAMPLE_TOKENS_LIST = [
  { symbol: 'NAS', name: 'Nebula Alpha Synth', category: 'Main', defaultPrice: 92.54 },
  { symbol: 'AEP', name: 'Apex Execution Pair', category: 'Main', defaultPrice: 84.97 },
  { symbol: 'ECB', name: 'Ecosystem Core Bridge', category: 'Main', defaultPrice: 89.32 },
  { symbol: 'BOT', name: 'Bot Trading Engine', category: 'Main', defaultPrice: 123.50 },
  { symbol: 'TTZS', name: 'Titan Training Zone', category: 'Main', defaultPrice: 131.75 },
  { symbol: 'OCT', name: 'Octa Core L2', category: 'Main', defaultPrice: 101.94 },
  { symbol: 'CFR', name: 'Crypto Financial Reserve', category: 'Main', defaultPrice: 127.78 },
  { symbol: 'STC', name: 'Smart Training Coin', category: 'Main', defaultPrice: 132.22 },
  { symbol: 'CFT', name: 'Core Financial Futures', category: 'Main', defaultPrice: 131.81 },
  { symbol: 'RTV', name: 'Real Time Velocity', category: 'Main', defaultPrice: 140.62 },
  { symbol: 'JOE', name: 'Joe Trader Coin', category: 'Main', defaultPrice: 140.52 },
  { symbol: 'REO', name: 'Reserve Ecosystem Oracle', category: 'Main', defaultPrice: 111.31 },
  { symbol: 'BEX', name: 'Block Exchange L2', category: 'Main', defaultPrice: 128.30 },
  { symbol: 'RYR', name: 'Rhythm Yield Reserve', category: 'Main', defaultPrice: 120.27 },
  { symbol: 'OAS', name: 'Oasis Alpha L2', category: 'Main', defaultPrice: 110.45 },
  { symbol: 'JTC', name: 'Joint Training Coin', category: 'Main', defaultPrice: 66.81 },
  { symbol: 'FTT', name: 'Futures Training Token', category: 'Main', defaultPrice: 105.93 },
  { symbol: 'AUR', name: 'Aurora Synth', category: 'Main', defaultPrice: 12.50 },
  { symbol: 'VTX', name: 'Vortex Protocol', category: 'Main', defaultPrice: 4.80 },
  { symbol: 'NEX', name: 'Nexus Chain', category: 'Main', defaultPrice: 0.95 },
  { symbol: 'GLX', name: 'Galaxya Network', category: 'Main', defaultPrice: 22.40 },
  { symbol: 'PHX', name: 'Phoenix Token', category: 'Main', defaultPrice: 1.25 },
  { symbol: 'ZEL', name: 'Zeta Labs', category: 'Main', defaultPrice: 0.45 },
  { symbol: 'CRY', name: 'Crypto Alpha', category: 'Main', defaultPrice: 8.50 },
  { symbol: 'ION', name: 'Ion Layer', category: 'Main', defaultPrice: 1.15 },
  { symbol: 'NOVA', name: 'Nova Network', category: 'Main', defaultPrice: 0.85 },
  { symbol: 'LYN', name: 'Lynx Protocol', category: 'Main', defaultPrice: 0.35 },
  
  // Custom Equity & Stocks
  { symbol: 'CPX', name: 'Crypx-PRO Inc', category: 'Stocks & Commodities', defaultPrice: 285.50 },
  { symbol: 'ARTS', name: 'Artesys Corp', category: 'Stocks & Commodities', defaultPrice: 164.20 },
  { symbol: 'AXG', name: 'AeroX Global', category: 'Stocks & Commodities', defaultPrice: 215.80 },
  { symbol: 'BGNX', name: 'BioGenix Labs', category: 'Stocks & Commodities', defaultPrice: 92.40 },
  { symbol: 'VOLT', name: 'Volt Motors', category: 'Stocks & Commodities', defaultPrice: 148.60 },
  { symbol: 'QCORE', name: 'QuantumCore Tech', category: 'Stocks & Commodities', defaultPrice: 312.00 },
  { symbol: 'CYBR', name: 'CyberShield Inc', category: 'Stocks & Commodities', defaultPrice: 185.30 },
  { symbol: 'OMNI', name: 'OmniMart Group', category: 'Stocks & Commodities', defaultPrice: 230.10 },
  { symbol: 'CINE', name: 'CineVerse Media', category: 'Stocks & Commodities', defaultPrice: 78.90 },
  { symbol: 'TFRA', name: 'Terra Infra Group', category: 'Stocks & Commodities', defaultPrice: 112.50 }
];

const SCHEDULES_STORAGE_KEY = 'crypx_sample_token_schedules_v1';
const MANUAL_OVERRIDES_KEY = 'crypx_sample_token_overrides_v1';
const AUDIT_LOGS_KEY = 'crypx_sample_token_audit_logs_v1';

// Internal state caches
let schedulesMap: Record<string, TokenPriceSchedule> = {};
let manualOverridesMap: Record<string, number> = {};
let auditLogsList: TokenPriceAuditLog[] = [];

// Initialize memory state from localStorage
const loadFromStorage = () => {
  if (typeof window === 'undefined') return;
  try {
    const storedSchedules = localStorage.getItem(SCHEDULES_STORAGE_KEY);
    if (storedSchedules) {
      schedulesMap = JSON.parse(storedSchedules);
    }
    const storedOverrides = localStorage.getItem(MANUAL_OVERRIDES_KEY);
    if (storedOverrides) {
      manualOverridesMap = JSON.parse(storedOverrides);
    }
    const storedLogs = localStorage.getItem(AUDIT_LOGS_KEY);
    if (storedLogs) {
      auditLogsList = JSON.parse(storedLogs);
    }
  } catch (e) {
    console.error("Failed to load token price controls from storage:", e);
  }
};

loadFromStorage();

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (
      e.key === SCHEDULES_STORAGE_KEY ||
      e.key === MANUAL_OVERRIDES_KEY ||
      e.key === AUDIT_LOGS_KEY
    ) {
      loadFromStorage();
      window.dispatchEvent(new Event('token-price-control-updated'));
    }
  });
}

// Supabase Realtime Broadcast and Database Syncing
let broadcastChannel: any = null;

export const loadTokenPricesFromDB = async () => {
  try {
    const { data, error } = await supabase.from('admin_wallet_configs')
      .select('address')
      .eq('admin_id', 'SYSTEM_PRICES')
      .eq('symbol', 'CONFIG')
      .eq('network', 'DATA')
      .maybeSingle();

    if (!error && data && data.address) {
      const parsed = JSON.parse(data.address);
      if (parsed.schedulesMap) schedulesMap = parsed.schedulesMap;
      if (parsed.manualOverridesMap) manualOverridesMap = parsed.manualOverridesMap;
      if (parsed.auditLogsList) auditLogsList = parsed.auditLogsList;
      
      localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(schedulesMap));
      localStorage.setItem(MANUAL_OVERRIDES_KEY, JSON.stringify(manualOverridesMap));
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(auditLogsList));
      window.dispatchEvent(new Event('token-price-control-updated'));
    }
  } catch (err) {
    console.error("Failed to load token prices from DB:", err);
  }
};

const saveTokenPricesToDB = async () => {
  try {
    const payload = JSON.stringify({
      schedulesMap,
      manualOverridesMap,
      auditLogsList
    });
    
    await supabase.from('admin_wallet_configs').upsert({
      admin_id: 'SYSTEM_PRICES',
      symbol: 'CONFIG',
      network: 'DATA',
      address: payload
    }, { onConflict: 'admin_id,symbol,network' });
  } catch (err) {
    console.error("Failed to save token prices to DB:", err);
  }
};

if (typeof window !== 'undefined') {
  broadcastChannel = supabase.channel('token-prices-sync');
  
  broadcastChannel
    .on('broadcast', { event: 'sync' }, (payload: any) => {
      const { schedules, overrides, logs } = payload.payload;
      if (schedules) schedulesMap = schedules;
      if (overrides) manualOverridesMap = overrides;
      if (logs) auditLogsList = logs;
      
      localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(schedulesMap));
      localStorage.setItem(MANUAL_OVERRIDES_KEY, JSON.stringify(manualOverridesMap));
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(auditLogsList));
      window.dispatchEvent(new Event('token-price-control-updated'));
    })
    .on('broadcast', { event: 'request_sync' }, () => {
      // Respond to sync requests
      if (Object.keys(schedulesMap).length > 0 || Object.keys(manualOverridesMap).length > 0) {
        broadcastState();
      }
    })
    .subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        // Load from DB first when connected
        loadTokenPricesFromDB().then(() => {
          if (Object.keys(schedulesMap).length === 0 && Object.keys(manualOverridesMap).length === 0) {
            broadcastChannel.send({
              type: 'broadcast',
              event: 'request_sync'
            }).catch(console.error);
          }
        });
      }
    });
}

const broadcastState = () => {
  if (broadcastChannel) {
    broadcastChannel.send({
      type: 'broadcast',
      event: 'sync',
      payload: {
        schedules: schedulesMap,
        overrides: manualOverridesMap,
        logs: auditLogsList
      }
    }).catch(console.error);
  }
};

const saveSchedules = () => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(schedulesMap));
  window.dispatchEvent(new Event('token-price-control-updated'));
  broadcastState();
  saveTokenPricesToDB();
};

const saveOverrides = () => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MANUAL_OVERRIDES_KEY, JSON.stringify(manualOverridesMap));
  window.dispatchEvent(new Event('token-price-control-updated'));
  broadcastState();
  saveTokenPricesToDB();
};

const saveAuditLogs = () => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(auditLogsList));
  broadcastState();
  saveTokenPricesToDB();
};

const logAction = (symbol: string, action: string, details: string, adminEmail: string = 'admin') => {
  const newLog: TokenPriceAuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    symbol,
    action,
    details,
    adminEmail
  };
  auditLogsList = [newLog, ...auditLogsList].slice(0, 200); // Keep last 200
  saveAuditLogs();
};

/**
 * Calculates smooth pseudo-random hourly drift between -10 and +10 USDT for uncontrolled sample tokens.
 */
const getUncontrolledHourlyPrice = (cleanSym: string, basePrice: number): number => {
  const now = Date.now();
  const HOUR_MS = 3600 * 1000;

  // Simple string hash for symbol seed
  let hash = 0;
  for (let i = 0; i < cleanSym.length; i++) {
    hash = (hash << 5) - hash + cleanSym.charCodeAt(i);
    hash |= 0;
  }

  const currentHour = Math.floor(now / HOUR_MS);
  const hourProgress = (now % HOUR_MS) / HOUR_MS; // 0 to 1 over current hour

  // Deterministic random offset (-10 to +10 USDT) for a given hour index
  const getHourOffset = (h: number) => {
    const seed = Math.sin(hash * 9999 + h * 1234.5678) * 10000;
    const raw = seed - Math.floor(seed); // 0 to 1
    return (raw * 20) - 10; // scale to [-10, +10] USDT
  };

  const startOffset = getHourOffset(currentHour);
  const endOffset = getHourOffset(currentHour + 1);

  // Smooth cosine interpolation ratio over the 60 minutes
  const smoothRatio = (1 - Math.cos(hourProgress * Math.PI)) / 2;
  const currentOffset = startOffset + (endOffset - startOffset) * smoothRatio;

  // Add micro tick noise (±0.04 USDT) so ticks update smoothly in real time
  const microNoise = (Math.random() * 0.08) - 0.04;

  const finalPrice = Math.max(0.0001, basePrice + currentOffset + microNoise);
  return parseFloat(finalPrice.toFixed(4));
};


const isTokenLocked = (symbol: string, adminEmail: string = 'admin'): { locked: boolean; lockedBy: string } => {
  const cleanSym = symbol.replace('USDT', '').replace('/', '').toUpperCase();
  const schedule = schedulesMap[cleanSym];
  if (schedule && schedule.isActive && schedule.endTime > Date.now()) {
    const owner = schedule.createdByAdmin || 'admin';
    // If the person trying to edit is not the owner, it's locked
    if (owner !== adminEmail) {
      return { locked: true, lockedBy: owner };
    }
  }
  return { locked: false, lockedBy: '' };
};

const assertNotLocked = (symbol: string, adminEmail?: string) => {
  const lock = isTokenLocked(symbol, adminEmail || 'admin');
  if (lock.locked) {
    throw new Error(`Token ${symbol} is locked by an ongoing adjustment from ${lock.lockedBy}.`);
  }
};

export const tokenPriceControl = {
  getSchedules: (): Record<string, TokenPriceSchedule> => {
    return { ...schedulesMap };
  },

  getSchedule: (symbol: string): TokenPriceSchedule | null => {
    const cleanSym = symbol.replace('USDT', '').replace('/', '').toUpperCase();
    return schedulesMap[cleanSym] || null;
  },

  getManualOverrides: (): Record<string, number> => {
    return { ...manualOverridesMap };
  },

  getAuditLogs: (): TokenPriceAuditLog[] => {
    return [...auditLogsList];
  },

  /**
   * Main calculated price retriever for market service & live tickers
   */
  getControlledPrice: (symbol: string, currentFallbackPrice: number): {
    price: number;
    isControlled: boolean;
    progress?: number;
    targetPrice?: number;
    isReturning?: boolean;
    isIdleAtTarget?: boolean;
    returnProgress?: number;
    returnDurationHours?: number;
    returnTimeRemainingMs?: number;
  } => {
    const cleanSym = symbol.replace('USDT', '').replace('/', '').toUpperCase();

    // 1. Check if there is an active schedule
    const schedule = schedulesMap[cleanSym];
    if (schedule && schedule.isActive) {
      const now = Date.now();
      
      // Check if return to base was manually initiated by admin
      if (schedule.returnInitiatedAt) {
        const returnDurationHours = schedule.returnDurationHours || 2;
        const returnDurationMs = returnDurationHours * 3600 * 1000;
        const elapsedSinceReturn = now - schedule.returnInitiatedAt;

        if (elapsedSinceReturn >= returnDurationMs) {
          // Complete returning to base! Deactivate and transition to standard uncontrolled state
          schedule.isActive = false;
          // Delete safely in a timeout block to prevent react warnings or context locks during ticker ticks
          setTimeout(() => {
            if (schedulesMap[cleanSym] && !schedulesMap[cleanSym].isActive) {
              delete schedulesMap[cleanSym];
              saveSchedules();
            }
          }, 10);
        } else {
          // Gradually returning to base price over the 1 to 4 hours return window
          const returnRatio = Math.min(1, Math.max(0, elapsedSinceReturn / returnDurationMs));
          const tokenMeta = SAMPLE_TOKENS_LIST.find(t => t.symbol === cleanSym);
          const fromPrice = schedule.returnStartPrice !== undefined ? schedule.returnStartPrice : schedule.targetPrice;
          const returnBasePrice = schedule.returnBasePrice !== undefined ? schedule.returnBasePrice : (tokenMeta?.defaultPrice || schedule.startPrice);
          
          // Linear smooth interpolation from returnStartPrice back to returnBasePrice
          const rawPrice = fromPrice + (returnBasePrice - fromPrice) * returnRatio;
          
          // Add subtle micro tick noise (± 0.03%) so chart candles and tickers move smoothly
          const noise = (Math.random() * 0.0006) - 0.0003;
          const tickPrice = Math.max(0.0001, rawPrice * (1 + noise));

          return {
            price: parseFloat(tickPrice.toFixed(4)),
            isControlled: true,
            progress: 100, // Trend is fully fulfilled
            targetPrice: returnBasePrice,
            isReturning: true,
            isIdleAtTarget: false,
            returnProgress: Math.round(returnRatio * 100),
            returnDurationHours,
            returnTimeRemainingMs: Math.max(0, returnDurationMs - elapsedSinceReturn)
          };
        }
      } else if (now <= schedule.startTime) {
        return {
          price: schedule.startPrice,
          isControlled: true,
          progress: 0,
          targetPrice: schedule.targetPrice,
          isReturning: false,
          isIdleAtTarget: false
        };
      } else if (now >= schedule.endTime) {
        // TARGET PRICE HAS BEEN REACHED (100%)!
        // Stays IDLE around the target price with natural small fluctuations until admin manually starts return
        const noise = (Math.random() * 0.0006) - 0.0003;
        const tickPrice = Math.max(0.0001, schedule.targetPrice * (1 + noise));

        return {
          price: parseFloat(tickPrice.toFixed(4)),
          isControlled: true,
          progress: 100, // 100% completed
          targetPrice: schedule.targetPrice,
          isReturning: false,
          isIdleAtTarget: true // Price will stay idle around target price until manual button click
        };
      } else {
        // Active trend phase (0% to 100%)
        const totalDuration = schedule.endTime - schedule.startTime;
        const elapsedTime = now - schedule.startTime;
        const progressRatio = Math.min(1, Math.max(0, elapsedTime / totalDuration));
        
        // Interpolate price linearly from startPrice to targetPrice
        const rawPrice = schedule.startPrice + (schedule.targetPrice - schedule.startPrice) * progressRatio;
        
        // Add subtle micro tick noise (± 0.03%) so chart candles and tickers move smoothly
        const noise = (Math.random() * 0.0006) - 0.0003;
        const tickPrice = Math.max(0.0001, rawPrice * (1 + noise));

        return {
          price: parseFloat(tickPrice.toFixed(4)),
          isControlled: true,
          progress: Math.round(progressRatio * 100),
          targetPrice: schedule.targetPrice,
          isReturning: false,
          isIdleAtTarget: false
        };
      }
    }

    // 2. Check if manual instant override exists
    if (manualOverridesMap[cleanSym] !== undefined) {
      const overrideVal = manualOverridesMap[cleanSym];
      const noise = (Math.random() * 0.0004) - 0.0002;
      const tickPrice = Math.max(0.0001, overrideVal * (1 + noise));
      return {
        price: parseFloat(tickPrice.toFixed(4)),
        isControlled: true
      };
    }

    // 3. Uncontrolled state for Spot Control tokens: simulate ±10 USDT price changes within an hour
    const tokenMeta = SAMPLE_TOKENS_LIST.find(t => t.symbol === cleanSym);
    if (tokenMeta) {
      const simPrice = getUncontrolledHourlyPrice(cleanSym, tokenMeta.defaultPrice);
      return {
        price: simPrice,
        isControlled: true // Flag as controlled so marketService broadcasts simulated ticker updates
      };
    }

    // Uncontrolled standard market tokens
    return {
      price: currentFallbackPrice,
      isControlled: false
    };
  },

  /**
   * Admin configures a percentage trend adjustment or target price schedule
   */
  setSchedule: (params: {
    symbol: string;
    direction: 'increase' | 'decrease' | 'set_price';
    type: 'percentage' | 'fixed_target';
    changePercent?: number; // e.g. 20 for 20%
    targetPrice?: number;
    durationHours: number; // e.g. 24 for 1 day, 96 for 4 days
    startPrice?: number;
    adminEmail?: string;
    note?: string;
  }): TokenPriceSchedule => {
    assertNotLocked(params.symbol, params.adminEmail);
    const cleanSym = params.symbol.replace('USDT', '').replace('/', '').toUpperCase();
    const tokenMeta = SAMPLE_TOKENS_LIST.find(t => t.symbol === cleanSym);
    
    // Get starting price baseline
    const baseStartPrice = params.startPrice || tokenMeta?.defaultPrice || 100;
    let target = baseStartPrice;

    if (params.type === 'percentage') {
      const pct = (params.changePercent || 0) / 100;
      if (params.direction === 'decrease') {
        target = baseStartPrice * (1 - pct);
      } else {
        target = baseStartPrice * (1 + pct);
      }
    } else if (params.targetPrice !== undefined) {
      target = params.targetPrice;
    }

    target = Math.max(0.0001, parseFloat(target.toFixed(4)));

    const startTime = Date.now();
    // Enforce minimum duration of 1 hour (60 minutes) for manual setup
    const effectiveHours = Math.max(1, params.durationHours);
    const durationMs = effectiveHours * 3600 * 1000;
    const endTime = startTime + durationMs;

    // Generate random return duration between 1.0 and 4.0 hours for the recovery phase
    const returnDurationHours = 1 + Math.random() * 3;

    const newSchedule: TokenPriceSchedule = {
      id: `sch_${cleanSym}_${Date.now()}`,
      symbol: cleanSym,
      type: params.type,
      direction: params.direction,
      changePercent: params.changePercent || 0,
      startPrice: baseStartPrice,
      targetPrice: target,
      startTime,
      durationHours: effectiveHours,
      endTime,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdByAdmin: params.adminEmail || 'admin',
      note: params.note || '',
      returnDurationHours
    };

    schedulesMap[cleanSym] = newSchedule;
    delete manualOverridesMap[cleanSym];

    saveSchedules();
    saveOverrides();

    const dirText = params.direction === 'decrease' ? 'Decrease' : 'Increase';
    const pctText = params.type === 'percentage' ? `${params.changePercent}%` : `$${target}`;
    const durText = params.durationHours >= 24 ? `${(params.durationHours / 24).toFixed(1)} day(s)` : `${params.durationHours} hour(s)`;
    
    logAction(
      cleanSym,
      'SET_PRICE_TREND',
      `Scheduled ${dirText} of ${pctText} from $${baseStartPrice.toFixed(2)} to target $${target.toFixed(2)} over ${durText}`,
      params.adminEmail || 'admin'
    );

    recordActivityLog({
      category: 'PRICE_CONTROL',
      action: 'TOKEN_PRICE_TREND_SCHEDULED',
      adminEmail: params.adminEmail || 'admin',
      target: `${cleanSym}/USDT`,
      title: 'Scheduled Token Price Trend',
      details: `Scheduled ${dirText} of ${pctText} from $${baseStartPrice.toFixed(2)} to target $${target.toFixed(2)} over ${durText}`,
      severity: 'warning',
      metadata: {
        symbol: cleanSym,
        direction: params.direction,
        type: params.type,
        startPrice: baseStartPrice,
        targetPrice: target,
        changePercent: params.changePercent,
        durationHours: effectiveHours,
        note: params.note
      }
    });

    return newSchedule;
  },

  /**
   * Instant direct price override
   */
  setManualOverride: (symbol: string, targetPrice: number, adminEmail?: string) => {
    assertNotLocked(symbol, adminEmail);
    const cleanSym = symbol.replace('USDT', '').replace('/', '').toUpperCase();
    manualOverridesMap[cleanSym] = targetPrice;
    
    // Clear schedule for this symbol
    delete schedulesMap[cleanSym];
    saveSchedules();
    saveOverrides();

    logAction(
      cleanSym,
      'MANUAL_OVERRIDE',
      `Set instant override price to $${targetPrice.toFixed(2)}`,
      adminEmail || 'admin'
    );

    recordActivityLog({
      category: 'PRICE_CONTROL',
      action: 'TOKEN_PRICE_MANUAL_OVERRIDE',
      adminEmail: adminEmail || 'admin',
      target: `${cleanSym}/USDT`,
      title: 'Instant Manual Price Override',
      details: `Set instant override price for ${cleanSym} to $${targetPrice.toFixed(2)}`,
      severity: 'warning',
      metadata: {
        symbol: cleanSym,
        targetPrice
      }
    });
  },

  /**
   * Manually trigger returning a sample token to its base price gradually (1 to 4 hours random duration)
   */
  startReturnToBase: (symbol: string, adminEmail?: string, customDurationHours?: number): boolean => {
    assertNotLocked(symbol, adminEmail);
    const cleanSym = symbol.replace('USDT', '').replace('/', '').toUpperCase();
    const schedule = schedulesMap[cleanSym];
    if (!schedule || !schedule.isActive) {
      throw new Error(`Token ${cleanSym} does not have an active price adjustment to return.`);
    }

    const tokenMeta = SAMPLE_TOKENS_LIST.find(t => t.symbol === cleanSym);
    const basePrice = tokenMeta?.defaultPrice || schedule.startPrice;
    
    // Get current calculated price to start return smoothly from current level
    const currentPriceInfo = tokenPriceControl.getControlledPrice(cleanSym, schedule.targetPrice);
    const startPriceForReturn = currentPriceInfo.price || schedule.targetPrice;

    // Default to random 1 to 4 hours if not explicitly provided
    const durationHours = customDurationHours || schedule.returnDurationHours || (1 + Math.random() * 3);

    schedule.returnInitiatedAt = Date.now();
    schedule.returnStartPrice = startPriceForReturn;
    schedule.returnBasePrice = basePrice;
    schedule.returnDurationHours = durationHours;
    schedule.updatedAt = new Date().toISOString();

    saveSchedules();

    logAction(
      cleanSym,
      'START_RETURN_TO_BASE',
      `Manually initiated gradual return from $${startPriceForReturn.toFixed(2)} to base $${basePrice.toFixed(2)} over ${durationHours.toFixed(1)} hours (1-4h random duration)`,
      adminEmail || 'admin'
    );

    recordActivityLog({
      category: 'PRICE_CONTROL',
      action: 'TOKEN_RETURN_TO_BASE_TRIGGERED',
      adminEmail: adminEmail || 'admin',
      target: `${cleanSym}/USDT`,
      title: 'Manual Return to Base Triggered',
      details: `Initiated gradual return from $${startPriceForReturn.toFixed(2)} to base $${basePrice.toFixed(2)} over ${durationHours.toFixed(1)} hours`,
      severity: 'info',
      metadata: {
        symbol: cleanSym,
        fromPrice: startPriceForReturn,
        basePrice,
        returnDurationHours: durationHours
      }
    });

    return true;
  },

  /**
   * Cancel returning to base and hold price at current target / level
   */
  cancelReturnToBase: (symbol: string, adminEmail?: string) => {
    assertNotLocked(symbol, adminEmail);
    const cleanSym = symbol.replace('USDT', '').replace('/', '').toUpperCase();
    const schedule = schedulesMap[cleanSym];
    if (schedule && schedule.returnInitiatedAt) {
      delete schedule.returnInitiatedAt;
      delete schedule.returnStartPrice;
      delete schedule.returnBasePrice;
      schedule.updatedAt = new Date().toISOString();
      saveSchedules();
      logAction(cleanSym, 'CANCEL_RETURN_TO_BASE', `Paused/Cancelled return to base; holding at target price for ${cleanSym}`, adminEmail || 'admin');
      
      recordActivityLog({
        category: 'PRICE_CONTROL',
        action: 'TOKEN_PRICE_SCHEDULE_CANCELLED',
        adminEmail: adminEmail || 'admin',
        target: `${cleanSym}/USDT`,
        title: 'Cancelled Return to Base',
        details: `Cancelled return to base; holding at target price for ${cleanSym}`,
        severity: 'info',
        metadata: { symbol: cleanSym }
      });
    }
  },

  /**
   * Bulk start return to base for all or selected tokens currently holding at target price
   */
  bulkStartReturnToBase: (symbols: string[], adminEmail?: string) => {
    const successSymbols: string[] = [];
    symbols.forEach(sym => {
      try {
        const cleanSym = sym.replace('USDT', '').replace('/', '').toUpperCase();
        if (schedulesMap[cleanSym] && schedulesMap[cleanSym].isActive) {
          tokenPriceControl.startReturnToBase(cleanSym, adminEmail);
          successSymbols.push(cleanSym);
        }
      } catch (err) {
        // Continue for other symbols if one is locked
      }
    });

    if (successSymbols.length > 0) {
      recordActivityLog({
        category: 'PRICE_CONTROL',
        action: 'TOKEN_BULK_RETURN_TO_BASE',
        adminEmail: adminEmail || 'admin',
        target: `${successSymbols.length} Tokens`,
        title: 'Bulk Return to Base Triggered',
        details: `Initiated bulk gradual return to base for tokens: ${successSymbols.join(', ')}`,
        severity: 'info',
        metadata: { symbols: successSymbols }
      });
    }
  },

  /**
   * Cancel active schedule for a symbol
   */
  cancelSchedule: (symbol: string, adminEmail?: string) => {
    const cleanSym = symbol.replace('USDT', '').replace('/', '').toUpperCase();
    if (schedulesMap[cleanSym]) {
      schedulesMap[cleanSym].isActive = false;
      delete schedulesMap[cleanSym];
      saveSchedules();
      logAction(cleanSym, 'CANCEL_SCHEDULE', `Cancelled active trend schedule for ${cleanSym}`, adminEmail || 'admin');
      
      recordActivityLog({
        category: 'PRICE_CONTROL',
        action: 'TOKEN_PRICE_SCHEDULE_CANCELLED',
        adminEmail: adminEmail || 'admin',
        target: `${cleanSym}/USDT`,
        title: 'Cancelled Active Trend Schedule',
        details: `Cancelled active trend schedule for ${cleanSym}`,
        severity: 'info',
        metadata: { symbol: cleanSym }
      });
    }
  },

  /**
   * Reset a token back to standard uncontrolled default
   */
  resetToken: (symbol: string, adminEmail?: string) => {
    const cleanSym = symbol.replace('USDT', '').replace('/', '').toUpperCase();
    delete schedulesMap[cleanSym];
    delete manualOverridesMap[cleanSym];
    saveSchedules();
    saveOverrides();
    logAction(cleanSym, 'RESET_DEFAULT', `Reset ${cleanSym} to default market calculation`, adminEmail || 'admin');

    recordActivityLog({
      category: 'PRICE_CONTROL',
      action: 'TOKEN_PRICE_RESET',
      adminEmail: adminEmail || 'admin',
      target: `${cleanSym}/USDT`,
      title: 'Reset Token Price Control',
      details: `Reset ${cleanSym} to default dynamic calculation`,
      severity: 'info',
      metadata: { symbol: cleanSym }
    });
  },

  /**
   * Reset all sample tokens to uncontrolled standard defaults
   */
  resetAllTokens: (adminEmail?: string) => {
    const email = adminEmail || 'admin';
    const lockedTokens = Object.values(schedulesMap).filter(sch => sch.isActive && sch.endTime > Date.now() && (sch.createdByAdmin || 'admin') !== email);
    if (lockedTokens.length > 0) {
      throw new Error(`Cannot reset all: ${lockedTokens.map(t=>t.symbol).join(', ')} are locked by other admins.`);
    }

    schedulesMap = {};
    manualOverridesMap = {};
    saveSchedules();
    saveOverrides();
    logAction('ALL', 'RESET_ALL', 'Reset all sample tokens to standard uncontrolled defaults', adminEmail || 'admin');

    recordActivityLog({
      category: 'PRICE_CONTROL',
      action: 'TOKEN_PRICE_RESET',
      adminEmail: adminEmail || 'admin',
      target: 'ALL_SAMPLE_TOKENS',
      title: 'Reset All Sample Tokens',
      details: 'Reset all sample tokens to standard uncontrolled defaults',
      severity: 'warning'
    });
  },

  /**
   * Bulk apply trend schedule across multiple symbols
   */
  bulkSetSchedule: (params: {
    symbols: string[];
    direction: 'increase' | 'decrease';
    changePercent: number;
    durationHours: number;
    adminEmail?: string;
  }) => {
    params.symbols.forEach(sym => {
      assertNotLocked(sym, params.adminEmail);
      const cleanSym = sym.replace('USDT', '').replace('/', '').toUpperCase();
      const meta = SAMPLE_TOKENS_LIST.find(t => t.symbol === cleanSym);
      const startP = meta?.defaultPrice || 100;

      tokenPriceControl.setSchedule({
        symbol: cleanSym,
        direction: params.direction,
        type: 'percentage',
        changePercent: params.changePercent,
        durationHours: params.durationHours,
        startPrice: startP,
        adminEmail: params.adminEmail,
        note: `Bulk schedule (${params.symbols.length} tokens)`
      });
    });
  }
};
