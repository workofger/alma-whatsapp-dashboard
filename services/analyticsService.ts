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
    const currentMessagesResult = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('message_timestamp', currentPeriodStart.toISOString())
      .lte('message_timestamp', now.toISOString());
    
    if (currentMessagesResult.error) {
      console.error('Error fetching current messages:', currentMessagesResult.error);
    }
    const currentMessages = currentMessagesResult.count ?? 0;

    // Get previous period message count
    const previousMessagesResult = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('message_timestamp', previousPeriodStart.toISOString())
      .lte('message_timestamp', previousPeriodEnd.toISOString());
    
    if (previousMessagesResult.error) {
      console.error('Error fetching previous messages:', previousMessagesResult.error);
    }
    const previousMessages = previousMessagesResult.count ?? 0;

    // Get total messages - use a more reliable method
    const totalMessagesResult = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });
    
    if (totalMessagesResult.error) {
      console.error('Error fetching total messages:', totalMessagesResult.error);
    }
    let totalMessages = totalMessagesResult.count ?? 0;

    // Fallback: If count is 0 but we have groups, calculate from v_group_stats
    if (totalMessages === 0) {
      const groupStatsResult = await supabase
        .from('v_group_stats')
        .select('total_messages');
      
      if (!groupStatsResult.error && groupStatsResult.data) {
        totalMessages = groupStatsResult.data.reduce((sum, g) => sum + (g.total_messages || 0), 0);
      }
    }

    // Get total members
    const totalMembersResult = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true });
    
    if (totalMembersResult.error) {
      console.error('Error fetching total members:', totalMembersResult.error);
    }
    const totalMembers = totalMembersResult.count ?? 0;

    // Get groups count
    const groupsResult = await supabase
      .from('v_group_stats')
      .select('group_id');
    
    if (groupsResult.error) {
      console.error('Error fetching groups:', groupsResult.error);
    }
    const groups = groupsResult.data || [];

    // Get ghost users count
    const ghostsResult = await supabase
      .from('v_ghost_users')
      .select('*');
    
    if (ghostsResult.error) {
      console.error('Error fetching ghosts:', ghostsResult.error);
    }
    const ghosts = ghostsResult.data || [];

    // Get previous ghost count (members who became inactive in previous period)
    const previousGhostsResult = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .lt('last_message_at', previousPeriodEnd.toISOString())
      .gte('last_message_at', previousPeriodStart.toISOString());
    
    if (previousGhostsResult.error) {
      console.error('Error fetching previous ghosts:', previousGhostsResult.error);
    }
    const previousGhosts = previousGhostsResult.count ?? 0;

    return {
      totalMessages,
      totalMembers,
      totalGroups: groups.length,
      ghostUsers: ghosts.length,
      trends: {
        messages: calculateTrend(currentMessages, previousMessages),
        members: calculateTrend(totalMembers, totalMembers), // Members don't change much
        ghosts: calculateTrend(ghosts.length, previousGhosts),
      },
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return null;
  }
}

/**
 * Fetch daily message counts for activity chart
 * Uses pagination to get ALL messages within the date range
 */
export async function fetchDailyMessageCounts(
  days: number = 30,
  groupId?: string
): Promise<DailyMessageCount[]> {
  if (!isSupabaseConfigured()) return [];

  const endDate = new Date();
  const startDate = subDays(endDate, days);

  try {
    // First, get the total count to know how many pages we need
    let countQuery = supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('message_timestamp', startDate.toISOString())
      .lte('message_timestamp', endDate.toISOString());

    if (groupId) {
      countQuery = countQuery.eq('group_id', groupId);
    }

    const { count: totalCount, error: countError } = await countQuery;
    
    if (countError) {
      console.error('Error counting messages:', countError);
      throw countError;
    }

    // Initialize day counts
    const dayCounts = new Map<string, number>();
    for (let i = 0; i <= days; i++) {
      const day = format(subDays(endDate, days - i), 'yyyy-MM-dd');
      dayCounts.set(day, 0);
    }

    // If no messages, return the initialized counts
    if (!totalCount || totalCount === 0) {
      return Array.from(dayCounts.entries()).map(([date, count]) => ({ date, count }));
    }

    // Fetch all messages in batches of 1000
    const pageSize = 1000;
    const totalPages = Math.ceil(totalCount / pageSize);
    
    for (let page = 0; page < totalPages; page++) {
      let query = supabase
        .from('messages')
        .select('message_timestamp')
        .gte('message_timestamp', startDate.toISOString())
        .lte('message_timestamp', endDate.toISOString())
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (groupId) {
        query = query.eq('group_id', groupId);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`Error fetching messages page ${page}:`, error);
        continue;
      }

      // Count messages per day
      data?.forEach((m) => {
        const day = format(new Date(m.message_timestamp), 'yyyy-MM-dd');
        if (dayCounts.has(day)) {
          dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
        }
      });
    }

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
 * Uses pagination to get ALL messages within the date range
 */
export async function fetchHourlyActivity(
  days: number = 30,
  groupId?: string
): Promise<HourlyActivity[]> {
  if (!isSupabaseConfigured()) return [];

  const endDate = new Date();
  const startDate = subDays(endDate, days);

  try {
    // First, get the total count
    let countQuery = supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('message_timestamp', startDate.toISOString())
      .lte('message_timestamp', endDate.toISOString());

    if (groupId) {
      countQuery = countQuery.eq('group_id', groupId);
    }

    const { count: totalCount, error: countError } = await countQuery;
    
    if (countError) {
      console.error('Error counting messages for hourly:', countError);
      throw countError;
    }

    // Initialize heatmap
    const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

    // If no messages, return empty heatmap
    if (!totalCount || totalCount === 0) {
      const result: HourlyActivity[] = [];
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          result.push({ day, hour, count: 0 });
        }
      }
      return result;
    }

    // Fetch all messages in batches
    const pageSize = 1000;
    const totalPages = Math.ceil(totalCount / pageSize);
    
    for (let page = 0; page < totalPages; page++) {
      let query = supabase
        .from('messages')
        .select('message_timestamp')
        .gte('message_timestamp', startDate.toISOString())
        .lte('message_timestamp', endDate.toISOString())
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (groupId) {
        query = query.eq('group_id', groupId);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`Error fetching hourly messages page ${page}:`, error);
        continue;
      }

      data?.forEach((m) => {
        const date = new Date(m.message_timestamp);
        const day = date.getDay();
        const hour = date.getHours();
        heatmap[day][hour]++;
      });
    }

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
 * For "all groups", aggregates from group_members table which has pre-computed message counts
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
        message_count: m.message_count || 0,
        last_message_at: m.last_message_at || '',
        first_message_at: '',
      }));
    } else {
      // For all groups, aggregate from group_members table
      // This gives us accurate totals from pre-computed message_count
      const { data, error } = await supabase
        .from('group_members')
        .select('user_id, user_pushname, user_number, user_lid, message_count, last_message_at');

      if (error) throw error;

      // Aggregate by user across all groups
      const userMap = new Map<string, UserActivity>();
      
      data?.forEach((m) => {
        const existing = userMap.get(m.user_id);
        if (existing) {
          existing.message_count += (m.message_count || 0);
          if (m.last_message_at && m.last_message_at > existing.last_message_at) {
            existing.last_message_at = m.last_message_at;
            // Update display name if current one is better
            if (m.user_pushname && !existing.sender_pushname) {
              existing.sender_pushname = m.user_pushname;
            }
          }
        } else {
          userMap.set(m.user_id, {
            sender_id: m.user_id,
            sender_pushname: m.user_pushname,
            sender_number: m.user_number,
            sender_lid: m.user_lid,
            message_count: m.message_count || 0,
            last_message_at: m.last_message_at || '',
            first_message_at: '',
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
 * Uses pagination to get ALL messages
 */
export async function fetchMessageTypeDistribution(
  groupId?: string
): Promise<{ type: string; count: number }[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    // First, get the total count
    let countQuery = supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });

    if (groupId) {
      countQuery = countQuery.eq('group_id', groupId);
    }

    const { count: totalCount, error: countError } = await countQuery;
    
    if (countError) {
      console.error('Error counting messages for types:', countError);
      throw countError;
    }

    if (!totalCount || totalCount === 0) {
      return [];
    }

    // Aggregate by type using pagination
    const typeCounts = new Map<string, number>();
    const pageSize = 1000;
    const totalPages = Math.ceil(totalCount / pageSize);
    
    for (let page = 0; page < totalPages; page++) {
      let query = supabase
        .from('messages')
        .select('message_type')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (groupId) {
        query = query.eq('group_id', groupId);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`Error fetching message types page ${page}:`, error);
        continue;
      }

      data?.forEach((m) => {
        const type = m.message_type || 'other';
        typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
      });
    }

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
