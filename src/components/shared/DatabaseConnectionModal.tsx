import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  ExternalLink,
  Lock,
  ArrowRight,
  Sparkles,
  Server,
  Cloud,
  Check
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface DatabaseConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseConnectionModal: React.FC<DatabaseConnectionModalProps> = ({
  isOpen,
  onClose
}) => {
  const currentUrl =
    (typeof window !== 'undefined' && (window as any).__RUNTIME_CONFIG__?.VITE_SUPABASE_URL) ||
    import.meta.env.VITE_SUPABASE_URL ||
    'https://your-supabase-project.supabase.co';

  const currentKey =
    (typeof window !== 'undefined' && (window as any).__RUNTIME_CONFIG__?.VITE_SUPABASE_ANON_KEY) ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    '';

  const [newUrl, setNewUrl] = useState(currentUrl);
  const [newAnonKey, setNewAnonKey] = useState(currentKey);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const customUrl = localStorage.getItem('crypx_custom_supabase_url');
    const customKey = localStorage.getItem('crypx_custom_supabase_key');
    if (customUrl) setNewUrl(customUrl);
    if (customKey) setNewAnonKey(customKey);
  }, []);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!newUrl.trim() || !newAnonKey.trim()) {
      toast.error('Please enter both Supabase Project URL and Anon Public Key.');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const testClient = createClient(newUrl.trim(), newAnonKey.trim());
      const { data, error } = await testClient.from('profiles').select('id').limit(1);

      if (error && !error.message.includes('PGRST116')) {
        // Even if profiles table doesn't exist yet, we connected to REST API
        if (error.message.includes('FetchError') || error.message.includes('Failed to fetch')) {
          throw new Error('Could not connect to URL. Please check project URL.');
        }
      }

      setTestResult({
        success: true,
        message: 'Successfully reached new Supabase database instance!'
      });
      toast.success('Connection test successful!');
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to connect to Supabase instance.'
      });
      toast.error('Connection test failed.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConnection = () => {
    if (!newUrl.trim() || !newAnonKey.trim()) {
      toast.error('Please fill in valid Supabase credentials.');
      return;
    }

    localStorage.setItem('crypx_custom_supabase_url', newUrl.trim());
    localStorage.setItem('crypx_custom_supabase_key', newAnonKey.trim());

    if (typeof window !== 'undefined') {
      (window as any).__RUNTIME_CONFIG__ = (window as any).__RUNTIME_CONFIG__ || {};
      (window as any).__RUNTIME_CONFIG__.VITE_SUPABASE_URL = newUrl.trim();
      (window as any).__RUNTIME_CONFIG__.VITE_SUPABASE_ANON_KEY = newAnonKey.trim();
    }

    toast.success('New Supabase database connected! Reloading application...');
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  const handleResetDefault = () => {
    localStorage.removeItem('crypx_custom_supabase_url');
    localStorage.removeItem('crypx_custom_supabase_key');
    toast.info('Reset database credentials to default environment settings.');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-xl w-full bg-card rounded-3xl border border-border shadow-2xl p-6 sm:p-7 space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Database size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Connect New Supabase Database</h3>
              <p className="text-xs text-muted-foreground">Switch database host & migrate project data</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2 text-xs text-blue-200">
          <div className="flex items-center gap-2 font-bold text-blue-300">
            <Cloud size={16} />
            <span>Database Migration Steps</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-blue-200/90 leading-relaxed">
            <li>Create a new project in your Supabase Dashboard.</li>
            <li>Run <code className="text-white font-mono bg-blue-950/60 px-1 py-0.5 rounded">schema.sql</code> in the SQL Editor of your NEW Supabase project.</li>
            <li>Paste your new Supabase Project URL and Anon Public Key below.</li>
            <li>Click <strong>Test Connection</strong>, then <strong>Save & Connect</strong>.</li>
          </ol>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">New Supabase Project URL</label>
            <input
              type="text"
              placeholder="https://your-new-project.supabase.co"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-muted/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">New Supabase Anon Public Key</label>
            <textarea
              rows={3}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={newAnonKey}
              onChange={(e) => setNewAnonKey(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-muted/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
          </div>
        </div>

        {/* Test Result Feedback */}
        {testResult && (
          <div
            className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 ${
              testResult.success
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="w-full sm:w-auto px-4 py-3 bg-muted hover:bg-muted/80 text-foreground font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} className={isTesting ? 'animate-spin text-primary' : ''} />
            <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveConnection}
            className="w-full sm:flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Sparkles size={14} />
            <span>Save & Connect New DB</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefault}
            className="w-full sm:w-auto px-3 py-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatabaseConnectionModal;
