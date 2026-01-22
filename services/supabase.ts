import { createClient, RealtimeChannel } from '@supabase/supabase-js';

// Access environment variables using Vite's import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = (): boolean => {
  return supabaseUrl !== '' && supabaseAnonKey !== '';
};

// Export for debugging (can be accessed via browser console if needed)
export const getSupabaseConfig = () => ({
  url: supabaseUrl,
  keyLength: supabaseAnonKey?.length || 0,
  configured: isSupabaseConfigured(),
});

// Realtime subscription helper
export const subscribeToMessages = (
  groupId: string,
  callback: (payload: any) => void
): RealtimeChannel => {
  return supabase
    .channel(`messages:${groupId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `group_id=eq.${groupId}`,
      },
      callback
    )
    .subscribe();
};

// Subscribe to all new messages (for dashboard updates)
export const subscribeToAllMessages = (
  callback: (payload: any) => void
): RealtimeChannel => {
  return supabase
    .channel('all-messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      callback
    )
    .subscribe();
};

// Unsubscribe helper
export const unsubscribe = (channel: RealtimeChannel) => {
  supabase.removeChannel(channel);
};
