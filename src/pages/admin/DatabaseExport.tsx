import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  Download,
  FileCode,
  FileJson,
  Table as TableIcon,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  Server,
  ArrowLeft,
  Sparkles,
  Info,
  Search,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { isPrimaryOwner, isUserAdmin } from '@/lib/adminPermissions';
import {
  ALL_DATABASE_TABLES,
  TableExportInfo,
  exportEntireDatabase,
  generateSqlDump,
  generateCsv,
  fetchTableRows,
  triggerFileDownload
} from '@/services/dbExportService';
import CubeSpinner from '@/components/shared/CubeSpinner';

export const AdminDatabaseExport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentUserEmail = user?.email || '';

  const isOwner = isPrimaryOwner(currentUserEmail);
  const isAdmin = isUserAdmin(currentUserEmail);

  const [loading, setLoading] = useState(true);
  const [exportingType, setExportingType] = useState<'json' | 'sql' | 'schema' | null>(null);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [tableStats, setTableStats] = useState<Record<string, { count: number; status: 'ok' | 'error' | 'empty'; error?: string }>>({});
  const [totalRecords, setTotalRecords] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [previewTable, setPreviewTable] = useState<TableExportInfo | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [copiedPreview, setCopiedPreview] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      let grandTotal = 0;
      const stats: Record<string, { count: number; status: 'ok' | 'error' | 'empty'; error?: string }> = {};

      await Promise.all(
        ALL_DATABASE_TABLES.map(async (table) => {
          const { rows, error } = await fetchTableRows(table.name);
          if (error) {
            stats[table.name] = { count: 0, status: 'error', error };
          } else if (rows.length === 0) {
            stats[table.name] = { count: 0, status: 'empty' };
          } else {
            stats[table.name] = { count: rows.length, status: 'ok' };
            grandTotal += rows.length;
          }
        })
      );

      setTableStats(stats);
      setTotalRecords(grandTotal);
    } catch (err: any) {
      console.error('Failed to load database stats:', err);
      toast.error('Failed to load table counts: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin || isOwner) {
      loadStats();
    }
  }, [isAdmin, isOwner, loadStats]);

  const handleExportFullJson = async () => {
    setExportingType('json');
    setProgressStatus('Fetching all database records from Supabase...');
    try {
      const dump = await exportEntireDatabase((tableName, current, total) => {
        setProgressStatus(`Exporting ${tableName} (${current}/${total})...`);
      });

      const jsonStr = JSON.stringify(dump, null, 2);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `crypx_pro_full_db_dump_${timestamp}.json`;

      triggerFileDownload(jsonStr, filename, 'application/json');
      toast.success(`Successfully exported entire DB! (${dump.metadata.totalRecords} records across ${dump.metadata.totalTables} tables)`);
    } catch (err: any) {
      console.error('JSON export error:', err);
      toast.error('Export failed: ' + (err.message || 'Unknown error'));
    } finally {
      setExportingType(null);
      setProgressStatus('');
    }
  };

  const handleExportFullSql = async () => {
    setExportingType('sql');
    setProgressStatus('Fetching all database records for SQL dump...');
    try {
      const dump = await exportEntireDatabase((tableName, current, total) => {
        setProgressStatus(`Generating SQL for ${tableName} (${current}/${total})...`);
      });

      const sqlContent = generateSqlDump(dump);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `crypx_pro_full_postgres_dump_${timestamp}.sql`;

      triggerFileDownload(sqlContent, filename, 'application/sql');
      toast.success(`PostgreSQL SQL script exported! (${dump.metadata.totalRecords} records generated)`);
    } catch (err: any) {
      console.error('SQL export error:', err);
      toast.error('SQL Export failed: ' + (err.message || 'Unknown error'));
    } finally {
      setExportingType(null);
      setProgressStatus('');
    }
  };

  const handleExportSchemaOnly = async () => {
    setExportingType('schema');
    try {
      const res = await fetch('/schema.sql');
      let schemaText = '';
      if (res.ok) {
        schemaText = await res.text();
      } else {
        schemaText = '-- CrypX-Pro Consolidated Database Schema\n';
      }
      triggerFileDownload(schemaText, 'crypx_pro_schema.sql', 'application/sql');
      toast.success('Database schema DDL script downloaded.');
    } catch (err: any) {
      toast.error('Could not fetch schema file: ' + err.message);
    } finally {
      setExportingType(null);
    }
  };

  const handleExportTableCsv = async (table: TableExportInfo) => {
    try {
      toast.info(`Fetching rows for ${table.label}...`);
      const { rows, error } = await fetchTableRows(table.name);
      if (error) {
        toast.error(`Error fetching ${table.name}: ${error}`);
        return;
      }
      if (rows.length === 0) {
        toast.warning(`Table ${table.name} has no rows to export.`);
        return;
      }
      const csvStr = generateCsv(rows);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      triggerFileDownload(csvStr, `${table.name}_${timestamp}.csv`, 'text/csv');
      toast.success(`Exported ${rows.length} rows from ${table.label} (CSV).`);
    } catch (err: any) {
      toast.error('CSV export failed: ' + err.message);
    }
  };

  const handleExportTableJson = async (table: TableExportInfo) => {
    try {
      toast.info(`Fetching rows for ${table.label}...`);
      const { rows, error } = await fetchTableRows(table.name);
      if (error) {
        toast.error(`Error fetching ${table.name}: ${error}`);
        return;
      }
      const jsonStr = JSON.stringify(rows, null, 2);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      triggerFileDownload(jsonStr, `${table.name}_${timestamp}.json`, 'application/json');
      toast.success(`Exported ${rows.length} rows from ${table.label} (JSON).`);
    } catch (err: any) {
      toast.error('JSON export failed: ' + err.message);
    }
  };

  const handleInspectTable = async (table: TableExportInfo) => {
    setPreviewTable(table);
    setPreviewLoading(true);
    setCopiedPreview(false);
    try {
      const { rows, error } = await fetchTableRows(table.name);
      if (error) {
        toast.error(`Error fetching table: ${error}`);
        setPreviewRows([]);
      } else {
        setPreviewRows(rows);
      }
    } catch (err: any) {
      toast.error('Preview failed: ' + err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const copyPreviewToClipboard = () => {
    if (!previewRows || previewRows.length === 0) return;
    navigator.clipboard.writeText(JSON.stringify(previewRows, null, 2));
    setCopiedPreview(true);
    toast.success('Copied table data to clipboard.');
    setTimeout(() => setCopiedPreview(false), 2000);
  };

  const filteredTables = ALL_DATABASE_TABLES.filter((t) => {
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesQuery =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="p-2.5 rounded-2xl bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Database size={22} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  Database Backup & Full Export Center
                </h1>
                <p className="text-xs text-muted-foreground">
                  Fetch and export all database tables, user records, trades, balances & schema from Supabase
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadStats}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-card border border-border hover:bg-muted text-xs font-bold text-foreground transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-primary' : ''} />
            <span>Refresh Stats</span>
          </button>
        </div>
      </div>

      {exportingType && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-4 shadow-sm"
        >
          <CubeSpinner size="sm" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles size={16} className="text-primary animate-pulse" />
              Fetching Database Records ({exportingType.toUpperCase()})
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">{progressStatus || 'Querying database tables...'}</p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-card border border-border hover:border-primary/40 rounded-3xl p-6 sm:p-7 space-y-5 shadow-sm transition-all flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <FileJson size={24} />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider">
                Full Dump
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                Export Entire DB as JSON
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Fetches all records from all 14 database tables and bundles them into a comprehensive JSON file.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleExportFullJson}
              disabled={!!exportingType}
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download size={16} />
              <span>Download Entire DB (.json)</span>
            </button>
          </div>
        </div>

        <div className="bg-card border border-border hover:border-emerald-500/40 rounded-3xl p-6 sm:p-7 space-y-5 shadow-sm transition-all flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <FileCode size={24} />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                PostgreSQL Script
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground group-hover:text-emerald-400 transition-colors">
                Export Entire DB as SQL
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Fetches all live data and generates standard PostgreSQL transaction scripts with batch INSERT statements.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleExportFullSql}
              disabled={!!exportingType}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download size={16} />
              <span>Download SQL Dump (.sql)</span>
            </button>
          </div>
        </div>

        <div className="bg-card border border-border hover:border-purple-500/40 rounded-3xl p-6 sm:p-7 space-y-5 shadow-sm transition-all flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Server size={24} />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold uppercase tracking-wider">
                DDL & Policies
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground group-hover:text-purple-400 transition-colors">
                Database Schema (DDL)
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Download database schema definitions, RLS policies, triggers, and functions.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleExportSchemaOnly}
              disabled={!!exportingType}
              className="w-full py-3 px-4 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-black text-xs rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download size={16} />
              <span>Download Schema (schema.sql)</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Database Tables & Records Overview</h3>
              <p className="text-xs text-muted-foreground">Live row counts fetched from Supabase</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-muted/40 border border-border text-xs">
              <span className="text-muted-foreground">Total Tables: </span>
              <strong className="text-foreground">{ALL_DATABASE_TABLES.length}</strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs">
              <span className="text-primary font-bold">Total Records: </span>
              <strong className="text-foreground">{totalRecords.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            {[
              { id: 'all', label: 'All Tables' },
              { id: 'users', label: 'Users & Identity' },
              { id: 'finance', label: 'Balances & Funds' },
              { id: 'trading', label: 'Futures & Trading' },
              { id: 'system', label: 'System & Admin' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search table name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-muted/40 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-border rounded-2xl mt-4">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border font-bold">
              <tr>
                <th className="px-4 py-3">Table Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-center">Row Count</th>
                <th className="px-4 py-3 text-right">Individual Exports</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTables.map((table) => {
                const stat = tableStats[table.name];
                const count = stat?.count ?? 0;
                const status = stat?.status ?? 'ok';

                return (
                  <tr key={table.name} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <TableIcon size={14} className="text-primary" />
                        <span className="font-mono font-bold text-foreground">{table.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                        {table.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{table.description}</td>
                    <td className="px-4 py-3.5 text-center">
                      {loading ? (
                        <span className="text-[11px] text-muted-foreground">...</span>
                      ) : status === 'error' ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold inline-flex items-center gap-1">
                          <AlertCircle size={10} /> Error
                        </span>
                      ) : count > 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                          {count.toLocaleString()} rows
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border text-[11px]">
                          0 rows
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleInspectTable(table)}
                          className="p-1.5 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Inspect rows preview"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportTableJson(table)}
                          className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[11px] font-bold transition-colors"
                          title="Download table as JSON"
                        >
                          JSON
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportTableCsv(table)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold transition-colors"
                          title="Download table as CSV"
                        >
                          CSV
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {previewTable && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreviewTable(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-3xl p-6 sm:p-7 max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <TableIcon size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      Table Preview: <span className="font-mono text-primary">{previewTable.name}</span>
                    </h3>
                    <p className="text-xs text-muted-foreground">{previewTable.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyPreviewToClipboard}
                    className="px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    {copiedPreview ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedPreview ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTable(null)}
                    className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto bg-muted/20 border border-border rounded-2xl p-4 font-mono text-xs">
                {previewLoading ? (
                  <div className="h-48 flex items-center justify-center">
                    <CubeSpinner size="sm" label="Fetching table rows..." />
                  </div>
                ) : previewRows.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-muted-foreground space-y-2">
                    <Database size={24} className="opacity-40" />
                    <p>No records found in {previewTable.name}.</p>
                  </div>
                ) : (
                  <pre className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-[11px]">
                    {JSON.stringify(previewRows, null, 2)}
                  </pre>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">
                  Showing <strong>{previewRows.length}</strong> record{previewRows.length === 1 ? '' : 's'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportTableJson(previewTable)}
                    className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5"
                  >
                    <Download size={14} />
                    Download JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportTableCsv(previewTable)}
                    className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-500 transition-all flex items-center gap-1.5"
                  >
                    <Download size={14} />
                    Download CSV
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDatabaseExport;
