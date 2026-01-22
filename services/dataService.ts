import { supabase, isSupabaseConfigured } from './supabase';
import { mockGroups, getMockMessages, mockGhosts, mockMembers } from './mockData';
import { GroupStats, Message, GhostUser, GroupMember } from '../types';

export const fetchGroups = async (): Promise<GroupStats[]> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('v_group_stats').select('*');
    if (error) {
      console.error('Error fetching groups:', error);
      return mockGroups;
    }
    return data as GroupStats[];
  }
  return new Promise(resolve => setTimeout(() => resolve(mockGroups), 500));
};

export const fetchMessages = async (groupId: string): Promise<Message[]> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('group_id', groupId)
      .order('message_timestamp', { ascending: true })
      .limit(100); // Limit for performance in demo
    if (error) {
      console.error('Error fetching messages:', error);
      return getMockMessages(groupId);
    }
    return data as Message[];
  }
  return new Promise(resolve => setTimeout(() => resolve(getMockMessages(groupId)), 500));
};

export const fetchGhosts = async (): Promise<GhostUser[]> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('v_ghost_users').select('*');
    if (error) {
      console.error('Error fetching ghosts:', error);
      return mockGhosts;
    }
    return data as GhostUser[];
  }
  return new Promise(resolve => setTimeout(() => resolve(mockGhosts), 500));
};

export const fetchMembers = async (groupId: string): Promise<GroupMember[]> => {
    if (isSupabaseConfigured()) {
        const { data, error } = await supabase
            .from('group_members')
            .select('*')
            .eq('group_id', groupId)
            .order('message_count', { ascending: false });
        if(error) {
            console.error('Error fetching members:', error);
            return mockMembers.filter(m => m.group_id === groupId);
        }
        return data as GroupMember[];
    }
    // Return mock members filtered by group (simulate)
    return new Promise(resolve => setTimeout(() => resolve(mockMembers), 500));
}
