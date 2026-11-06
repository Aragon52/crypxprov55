import { supabase } from "@/integrations/supabase/client";
import { getCustomAccounts, getUserReferrals } from "@/lib/adminPermissions";

export interface TableExportInfo {
  name: string;
  label: string;
  description: string;
  category: 'users' | 'trading' | 'finance' | 'system';
}

export const ALL_DATABASE_TABLES: TableExportInfo[] = [
  { name: 'profiles', label: 'User Profiles', description: 'User accounts, balances, credentials & verification states', category: 'users' },
  { name: 'user_roles', label: 'User Roles', description: 'Role assignments (admin, staff, user)', category: 'users' },
  { name: 'user_assets', label: 'User Assets', description: 'Token balances (BTC, ETH, SOL, USDT, etc.) per account', category: 'finance' },
  { name: 'positions', label: 'Futures Positions', description: 'Leveraged derivatives, trade orders, margins & PnL logs', category: 'trading' },
  { name: 'deposits', label: 'Deposit Requests', description: 'Cryptocurrency on-chain deposits & approval history', category: 'finance' },
  { name: 'withdrawals', label: 'Withdrawals', description: 'Asset withdrawal requests, addresses, and transaction notes', category: 'finance' },
  { name: 'admin_wallets', label: 'Platform Wallets', description: 'Company deposit addresses mapped by coin and network', category: 'system' },
  { name: 'admin_wallet_configs', label: 'Admin Specific Wallets', description: 'Multi-admin custom wallet configurations & overrides', category: 'system' },
  { name: 'kyc_submissions', label: 'KYC Submissions', description: 'User identity documents, passport/ID scans, and audit logs', category: 'users' },
  { name: 'support_config', label: 'Support Config', description: 'Official customer support contact details (Telegram, WhatsApp, Email)', category: 'system' },
  { name: 'support_messages', label: 'Support Messages', description: 'Customer service direct chat conversations & attachments', category: 'system' },
  { name: 'notifications', label: 'Notifications', description: 'System alerts, execution confirmations & broadcast updates', category: 'system' },
  { name: 'custom_accounts', label: 'Custom Admin Accounts', description: 'Admin & staff accounts with granular page permissions', category: 'system' },
  { name: 'user_referrals', label: 'User Referrals', description: 'User referral mappings linking traders to specific admins', category: 'users' },
];

export interface DatabaseDumpResult {
  metadata: {
    appName: string;
    exportTimestamp: string;
    databaseEngine: string;
    schemaVersion: string;
    totalTables: number;
    totalRecords: number;
    tableSummary: Record<string, { count: number; status: 'ok' | 'error' | 'empty'; error?: string }>;
  };
  tables: Record<string, any[]>;
}

export async function fetchTableRows(tableName: string): Promise<{ rows: any[]; error: string | null }> {
  try {
    if (tableName === 'custom_accounts') {
      try {
        const { data, error } = await supabase.from('custom_accounts').select('*');
        if (!error && data && data.length > 0) {
          return { rows: data, error: null };
        }
      } catch (e) {
        console.warn('Fallback to local custom accounts:', e);
      }
      const local = getCustomAccounts();
      return { rows: local, error: null };
    }

    if (tableName === 'user_referrals') {
      try {
        const { data, error } = await supabase.from('user_referrals').select('*');
        if (!error && data && data.length > 0) {
          return { rows: data, error: null };
        }
      } catch (e) {
        console.warn('Fallback to local user referrals:', e);
      }
      const local = getUserReferrals();
      return { rows: local, error: null };
    }

    const { data, error } = await supabase.from(tableName as any).select('*');
    if (error) {
      return { rows: [], error: error.message };
    }
    return { rows: data || [], error: null };
  } catch (err: any) {
    return { rows: [], error: err.message || 'Failed to fetch table' };
  }
}

export async function exportEntireDatabase(
  onProgress?: (currentTable: string, index: number, total: number) => void
): Promise<DatabaseDumpResult> {
  const tablesData: Record<string, any[]> = {};
  const tableSummary: Record<string, { count: number; status: 'ok' | 'error' | 'empty'; error?: string }> = {};
  let totalRecords = 0;

  for (let i = 0; i < ALL_DATABASE_TABLES.length; i++) {
    const table = ALL_DATABASE_TABLES[i];
    if (onProgress) {
      onProgress(table.label, i + 1, ALL_DATABASE_TABLES.length);
    }

    const { rows, error } = await fetchTableRows(table.name);
    tablesData[table.name] = rows;
    totalRecords += rows.length;

    if (error) {
      tableSummary[table.name] = { count: 0, status: 'error', error };
    } else if (rows.length === 0) {
      tableSummary[table.name] = { count: 0, status: 'empty' };
    } else {
      tableSummary[table.name] = { count: rows.length, status: 'ok' };
    }
  }

  return {
    metadata: {
      appName: 'CrypX-Pro',
      exportTimestamp: new Date().toISOString(),
      databaseEngine: 'Supabase PostgreSQL (15+)',
      schemaVersion: '2.5.0',
      totalTables: ALL_DATABASE_TABLES.length,
      totalRecords,
      tableSummary,
    },
    tables: tablesData,
  };
}

function formatSqlValue(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return isNaN(val) ? 'NULL' : String(val);
  if (typeof val === 'object') {
    const jsonStr = JSON.stringify(val).replace(/'/g, "''");
    return `'${jsonStr}'::jsonb`;
  }
  const escaped = String(val).replace(/'/g, "''");
  return `'${escaped}'`;
}

export function generateSqlDump(dump: DatabaseDumpResult): string {
  const lines: string[] = [];
  lines.push('-- =========================================================================');
  lines.push('-- CrypX-Pro Complete PostgreSQL Database Dump');
  lines.push(`-- Generated At: ${dump.metadata.exportTimestamp}`);
  lines.push(`-- Total Records: ${dump.metadata.totalRecords}`);
  lines.push('-- =========================================================================');
  lines.push('');
  lines.push('BEGIN;');
  lines.push('');

  for (const table of ALL_DATABASE_TABLES) {
    const rows = dump.tables[table.name] || [];
    lines.push(`-- Table: public.${table.name} (${rows.length} rows)`);
    if (rows.length === 0) {
      lines.push('');
      continue;
    }

    const columnSet = new Set<string>();
    rows.forEach((r) => Object.keys(r).forEach((k) => columnSet.add(k)));
    const columns = Array.from(columnSet);

    lines.push(`INSERT INTO public.${table.name} (${columns.map((c) => `"${c}"`).join(', ')}) VALUES`);
    const valuesLines: string[] = [];
    rows.forEach((row, idx) => {
      const rowValues = columns.map((col) => formatSqlValue(row[col]));
      const isLast = idx === rows.length - 1;
      valuesLines.push(`  (${rowValues.join(', ')})${isLast ? ';' : ','}`);
    });
    lines.push(valuesLines.join('\n'));
    lines.push('');
  }

  lines.push('COMMIT;');
  return lines.join('\n');
}

export function generateCsv(rows: any[]): string {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const csvLines = [headers.join(',')];

  rows.forEach((row) => {
    const line = headers.map((header) => {
      const val = row[header];
      if (val === null || val === undefined) return '';
      const stringified = typeof val === 'object' ? JSON.stringify(val) : String(val);
      const escaped = stringified.replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvLines.push(line.join(','));
  });

  return csvLines.join('\n');
}

export function triggerFileDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
