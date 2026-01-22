import { supabase, isSupabaseConfigured } from './supabase';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

export interface DashboardStats {
  totalMessages: number;
  totalMembers: number;
  totalGroups: number;
  ghostUsers: number;
  trends: {
    messages: TrendData;
    members: TrendData;
    ghosts: TrendData;
  };
}

export interface TrendData {
  current: number;
  previous: number;
  percentage: number | null;
  direction: 'up' | 'down' | 'neutral';
}

export interface DailyMessageCount {
  date: string;
  count: number;
}

export interface HourlyActivity {
  day: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  count: number;
}

export interface UserActivity {
  sender_id: string;
  sender_pushname: string | null;
  sender_number: string | null;
  sender_lid: string | null;
  message_count: number;
  last_message_at: string;
  first_message_at: string;
}

/**
 * Calculate trend between current and previous period
 */
function calculateTrend(current: number, previous: number): TrendData {
  if (previous === 0) {
    return {
      current,
      previous,
      percentage: current > 0 ? 100 : null,
      direction: current > 0 ? 'up' : 'neutral',
    };
  }

  const percentage = Math.round(((current - previous) / previous) * 100);
  return {
    current,
    previous,
    percentage,
    direction: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral',
  };
}

/**
 * Fetch dashboard statistics with real trend calculations
 */
export async function fetchDashboardStats(): Promise<DashboardStats | null> {
  if (!isSupabaseConfigured()) return null;

  const now = new Date();
  const currentPeriodStart = subDays(now, 7);
  const previousPeriodStart = subDays(now, 14);
  const previousPeriodEnd = subDays(now, 7);

  try {
    // Get current period message count
    const { count: currentMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('message_timestamp', currentPeriodStart.toISOString())
      .lte('message_timestamp', now.toISOString());

    // Get previous period message count
    const { count: previousMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('message_timestamp', previousPeriodStart.toISOString())
      .lte('message_timestamp', previousPeriodEnd.toISOString());

    // Get total messages
    const { count: totalMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });

    // Get total members
    const { count: totalMembers } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true });

    // Get groups count
    const { data: groups } = await supabase
      .from('v_group_stats')
      .select('group_id');

    // Get ghost users count
    const { data: ghosts } = await supabase
      .from('v_ghost_users')
      .select('*');

    // Get previous ghost count (members who became inactive in previous period)
    const { count: previousGhosts } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .lt('last_message_at', previousPeriodEnd.toISOString())
      .gte('last_message_at', previousPeriodStart.toISOString());

    return {
      totalMessages: totalMessages || 0,
      totalMembers: totalMembers || 0,
      totalGroups: groups?.length || 0,
      ghostUsers: ghosts?.length || 0,
      trends: {
        messages: calculateTrend(currentMessages || 0, previousMessages || 0),
        members: calculateTrend(totalMembers || 0, totalMembers || 0), // Members don't change much
        ghosts: calculateTrend(ghosts?.length || 0, previousGhosts || 0),
      },
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return null;
  }
}

/**
 * Fetch daily message counts for activity chart
 */
export async function fetchDailyMessageCounts(
  days: number = 30,
  groupId?: string
): Promise<DailyMessageCount[]> {
  if (!isSupabaseConfigured()) return [];

  const endDate = new Date();
  const startDate = subDays(endDate, days);

  try {
    let query = supabase
      .from('messages')
      .select('message_timestamp')
      .gte('message_timestamp', startDate.toISOString())
      .lte('message_timestamp', endDate.toISOString());

    if (groupId) {
      query = query.eq('group_id', groupId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Aggregate by day
    const dayCounts = new Map<string, number>();
    
    // Initialize all days with 0
    for (let i = 0; i <= days; i++) {
      const day = format(subDays(endDate, days - i), 'yyyy-MM-dd');
      dayCounts.set(day, 0);
    }

    // Count messages per day
    data?.forEach((m) => {
      const day = format(new Date(m.message_timestamp), 'yyyy-MM-dd');
      if (dayCounts.has(day)) {
        dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
      }
    });

    return Array.from(dayCounts.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  } catch (error) {
    console.error('Error fetching daily message counts:', error);
    return [];
  }
}

/**
 * Fetch hourly activity heatmap data
 */
export async function fetchHourlyActivity(
  days: number = 30,
  groupId?: string
): Promise<HourlyActivity[]> {
  if (!isSupabaseConfigured()) return [];

  const endDate = new Date();
  const startDate = subDays(endDate, days);

  try {
    let query = supabase
      .from('messages')
      .select('message_timestamp')
      .gte('message_timestamp', startDate.toISOString())
      .lte('message_timestamp', endDate.toISOString());

    if (groupId) {
      query = query.eq('group_id', groupId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Aggregate by day of week and hour
    const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

    data?.forEach((m) => {
      const date = new Date(m.message_timestamp);
      const day = date.getDay();
      const hour = date.getHours();
      heatmap[day][hour]++;
    });

    // Flatten to array
    const result: HourlyActivity[] = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        result.push({ day, hour, count: heatmap[day][hour] });
      }
    }

    return result;
  } catch (error) {
    console.error('Error fetching hourly activity:', error);
    return [];
  }
}

/**
 * Fetch top users by message count
 */
export async function fetchTopUsers(
  limit: number = 10,
  groupId?: string
): Promise<UserActivity[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    if (groupId) {
      // For a specific group, get from group_members
      const { data, error } = await supabase
        .from('group_members')
        .select('user_id, user_pushname, user_number, user_lid, message_count, last_message_at')
        .eq('group_id', groupId)
        .order('message_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((m) => ({
        sender_id: m.user_id,
        sender_pushname: m.user_pushname,
        sender_number: m.user_number,
        sender_lid: m.user_lid,
        message_count: m.message_count,
        last_message_at: m.last_message_at,
        first_message_at: '',
      }));
    } else {
      // For all groups, aggregate from messages
      const { data, error } = await supabase
        .from('messages')
        .select('sender_id, sender_pushname, sender_number, sender_lid, message_timestamp')
        .order('message_timestamp', { ascending: false })
        .limit(5000); // Get recent messages for aggregation

      if (error) throw error;

      // Aggregate by sender
      const userMap = new Map<string, UserActivity>();
      
      data?.forEach((m) => {
        const existing = userMap.get(m.sender_id);
        if (existing) {
          existing.message_count++;
          if (m.message_timestamp > existing.last_message_at) {
            existing.last_message_at = m.message_timestamp;
          }
          if (m.message_timestamp < existing.first_message_at) {
            existing.first_message_at = m.message_timestamp;
          }
        } else {
          userMap.set(m.sender_id, {
            sender_id: m.sender_id,
            sender_pushname: m.sender_pushname,
            sender_number: m.sender_number,
            sender_lid: m.sender_lid,
            message_count: 1,
            last_message_at: m.message_timestamp,
            first_message_at: m.message_timestamp,
          });
        }
      });

      return Array.from(userMap.values())
        .sort((a, b) => b.message_count - a.message_count)
        .slice(0, limit);
    }
  } catch (error) {
    console.error('Error fetching top users:', error);
    return [];
  }
}

/**
 * Fetch message type distribution
 */
export async function fetchMessageTypeDistribution(
  groupId?: string
): Promise<{ type: string; count: number }[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    let query = supabase
      .from('messages')
      .select('message_type');

    if (groupId) {
      query = query.eq('group_id', groupId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Aggregate by type
    const typeCounts = new Map<string, number>();
    
    data?.forEach((m) => {
      const type = m.message_type || 'other';
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    });

    return Array.from(typeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error fetching message type distribution:', error);
    return [];
  }
}

/**
 * Search messages across all groups
 */
export async function searchMessages(
  query: string,
  options: {
    groupId?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ messages: any[]; total: number }> {
  if (!isSupabaseConfigured() || !query.trim()) {
    return { messages: [], total: 0 };
  }

  const { groupId, limit = 50, offset = 0 } = options;

  try {
    let dbQuery = supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .ilike('body', `%${query}%`)
      .order('message_timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (groupId) {
      dbQuery = dbQuery.eq('group_id', groupId);
    }

    const { data, count, error } = await dbQuery;

    if (error) throw error;

    return {
      messages: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error('Error searching messages:', error);
    return { messages: [], total: 0 };
  }
}
