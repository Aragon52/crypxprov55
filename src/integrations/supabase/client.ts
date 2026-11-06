import { createClient } from '@supabase/supabase-js';

const getRuntimeConfig = (key: string): string | undefined => {
  if (typeof window !== 'undefined') {
    const localVal = key === 'VITE_SUPABASE_URL' 
      ? localStorage.getItem('crypx_custom_supabase_url') 
      : localStorage.getItem('crypx_custom_supabase_key');
    if (localVal && localVal.trim()) {
      return localVal.trim();
    }

    if ((window as any).__RUNTIME_CONFIG__) {
      const val = (window as any).__RUNTIME_CONFIG__[key];
      if (val && !val.startsWith('__')) {
        return val;
      }
    }
  }
  return undefined;
};

const DEFAULT_NEW_SUPABASE_URL = 'https://sesvoudoekdsiulcmcdb.supabase.co';

const supabaseUrl =
  getRuntimeConfig('VITE_SUPABASE_URL') ||
  ((typeof import.meta !== 'undefined' && import.meta.env)
    ? import.meta.env.VITE_SUPABASE_URL
    : (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_URL : undefined)) ||
  DEFAULT_NEW_SUPABASE_URL;

const supabaseAnonKey =
  getRuntimeConfig('VITE_SUPABASE_ANON_KEY') ||
  ((typeof import.meta !== 'undefined' && import.meta.env)
    ? (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
    : (typeof process !== 'undefined' ? (process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY) : undefined)) ||
  '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY should be configured for full authentication.');
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey || 'placeholder'
);
