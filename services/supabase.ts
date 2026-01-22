import { createClient } from '@supabase/supabase-js';

// Access environment variables using Vite's import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Debug logging (will show in browser console)
console.log('[Supabase Config]', {
  url: supabaseUrl || 'NOT SET',
  keyLength: supabaseAnonKey?.length || 0,
  keyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 30) + '...' : 'NOT SET',
  configured: supabaseUrl !== '' && supabaseAnonKey !== ''
});

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = (): boolean => {
  return supabaseUrl !== '' && supabaseAnonKey !== '';
};

// Export for debugging
export const getSupabaseConfig = () => ({
  url: supabaseUrl,
  keyLength: supabaseAnonKey?.length || 0,
  configured: isSupabaseConfigured(),
});

// Test connection function (can be called from browser console)
export const testConnection = async () => {
  console.log('[Supabase] Testing connection...');
  
  const { data, error } = await supabase
    .from('messages')
    .select('id')
    .limit(1);
  
  if (error) {
    console.error('[Supabase] Connection test FAILED:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return { success: false, error };
  }
  
  console.log('[Supabase] Connection test PASSED:', data);
  return { success: true, data };
};

// Make testConnection available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).testSupabase = testConnection;
  (window as any).supabaseConfig = getSupabaseConfig;
}
