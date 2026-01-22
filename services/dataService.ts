import { supabase, isSupabaseConfigured } from './supabase';
import { GroupStats, Message, GhostUser, GroupMember } from '../types';

export const fetchGroups = async (): Promise<GroupStats[]> => {
  if (!isSupabaseConfigured()) {
    console.warn('[DataService] Supabase not configured - check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    return [];
  }
  
  const { data, error } = await supabase.from('v_group_stats').select('*');
  if (error) {
    console.error('[DataService] Error fetching groups:', error);
    return [];
  }
  return data as GroupStats[];
};

export const fetchMessages = async (groupId: string): Promise<Message[]> => {
  if (!isSupabaseConfigured()) {
    console.warn('[DataService] Supabase not configured');
    return [];
  }
  
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('group_id', groupId)
    .order('message_timestamp', { ascending: true });
    
  if (error) {
    console.error('[DataService] Error fetching messages:', error);
    return [];
  }
  return data as Message[];
};

export const fetchGhosts = async (): Promise<GhostUser[]> => {
  if (!isSupabaseConfigured()) {
    console.warn('[DataService] Supabase not configured');
    return [];
  }
  
  const { data, error } = await supabase.from('v_ghost_users').select('*');
  if (error) {
    console.error('[DataService] Error fetching ghosts:', error);
    return [];
  }
  return data as GhostUser[];
};

export const fetchMembers = async (groupId: string): Promise<GroupMember[]> => {
  if (!isSupabaseConfigured()) {
    console.warn('[DataService] Supabase not configured');
    return [];
  }
  
  const { data, error } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .order('message_count', { ascending: false });
    
  if (error) {
    console.error('[DataService] Error fetching members:', error);
    return [];
  }
  return data as GroupMember[];
};
