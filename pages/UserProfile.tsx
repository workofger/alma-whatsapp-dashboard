import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { Message, GroupStats } from '../types';
import { getUserDisplayName, getUserDisplayId } from '../services/userUtils';
import { format, formatDistanceToNow, subDays } from 'date-fns';
import {
  User,
  MessageSquare,
  Calendar,
  Clock,
  TrendingUp,
  ArrowLeft,
  Loader2,
  Activity,
  Hash,
  Phone,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface UserStats {
  totalMessages: number;
  firstMessage: string | null;
  lastMessage: string | null;
  avgPerDay: number;
  groupsActive: GroupStats[];
  recentMessages: Message[];
  dailyActivity: { date: string; count: number }[];
  topWords: { word: string; count: number }[];
}

const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<Message | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      if (!isSupabaseConfigured() || !id) {
        setLoading(false);
        return;
      }

      const decodedId = decodeURIComponent(id);

      try {
        // Fetch user's messages
        const { data: messages, error } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${decodedId},sender_number.eq.${decodedId},sender_lid.eq.${decodedId}`)
          .order('message_timestamp', { ascending: false });

        if (error) throw error;

        if (!messages || messages.length === 0) {
          setLoading(false);
          return;
        }

        // Set user info from first message
        setUserInfo(messages[0]);

        // Fetch groups where user is active
        const groupIds = [...new Set(messages.map((m) => m.group_id))];
        const { data: groups } = await supabase
          .from('v_group_stats')
          .select('*')
          .in('group_id', groupIds);

        // Calculate daily activity (last 30 days)
        const last30Days = subDays(new Date(), 30);
        const recentMessages = messages.filter(
          (m) => new Date(m.message_timestamp) >= last30Days
        );

        const dailyMap = new Map<string, number>();
        for (let i = 0; i <= 30; i++) {
          const day = format(subDays(new Date(), 30 - i), 'yyyy-MM-dd');
          dailyMap.set(day, 0);
        }

        recentMessages.forEach((m) => {
          const day = format(new Date(m.message_timestamp), 'yyyy-MM-dd');
          if (dailyMap.has(day)) {
            dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
          }
        });

        const dailyActivity = Array.from(dailyMap.entries()).map(([date, count]) => ({
          date,
          count,
        }));

        // Calculate top words (simple word frequency)
        const wordCounts = new Map<string, number>();
        messages.forEach((m) => {
          if (m.body && m.message_type === 'chat') {
            const words = m.body
              .toLowerCase()
              .split(/\s+/)
              .filter((w: string) => w.length > 3 && !/^https?:\/\//.test(w));
            words.forEach((word: string) => {
              wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
            });
          }
        });

        const topWords = Array.from(wordCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([word, count]) => ({ word, count }));

        // Calculate stats
        const sortedByDate = [...messages].sort(
          (a, b) =>
            new Date(a.message_timestamp).getTime() -
            new Date(b.message_timestamp).getTime()
        );

        const firstDate = new Date(sortedByDate[0].message_timestamp);
        const lastDate = new Date(sortedByDate[sortedByDate.length - 1].message_timestamp);
        const daysDiff = Math.max(
          1,
          Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))
        );

        setStats({
          totalMessages: messages.length,
          firstMessage: sortedByDate[0].message_timestamp,
          lastMessage: sortedByDate[sortedByDate.length - 1].message_timestamp,
          avgPerDay: Math.round(messages.length / daysDiff),
          groupsActive: groups || [],
          recentMessages: messages.slice(0, 20),
          dailyActivity,
          topWords,
        });
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [id]);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-wa-teal" size={48} />
        <p className="text-gray-400">Loading user profile...</p>
      </div>
    );
  }

  if (!userInfo || !stats) {
    return (
      <div className="text-center py-12">
        <User size={64} className="mx-auto text-gray-700 mb-4" />
        <h2 className="text-xl font-medium text-gray-400 mb-2">User not found</h2>
        <p className="text-gray-500 mb-6">No messages found for this user.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-wa-teal text-white rounded-lg hover:bg-wa-teal/90"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const chartData = stats.dailyActivity.map((d) => ({
    date: format(new Date(d.date), 'MMM d'),
    messages: d.count,
  }));

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-wa-teal transition-colors"
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </Link>

      {/* User Header */}
      <div className="bg-wa-panel border border-gray-800 rounded-lg p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-wa-teal to-emerald-600 flex items-center justify-center flex-shrink-0 mx-auto md:mx-0">
            <span className="text-white font-bold text-4xl">
              {getUserDisplayName(userInfo).charAt(0).toUpperCase()}
            </span>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-gray-100 mb-2">
              {getUserDisplayName(userInfo)}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-400">
              {userInfo.sender_number && (
                <div className="flex items-center gap-1">
                  <Phone size={14} className="text-wa-teal" />
                  <span>{userInfo.sender_number}</span>
                </div>
              )}
              {userInfo.sender_lid && (
                <div className="flex items-center gap-1">
                  <Hash size={14} className="text-purple-400" />
                  <span className="font-mono text-xs">{userInfo.sender_lid.substring(0, 12)}...</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Active in {stats.groupsActive.length} group{stats.groupsActive.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-wa-incoming/50 rounded-lg">
              <MessageSquare className="w-5 h-5 text-wa-teal mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-100">{stats.totalMessages.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Messages</p>
            </div>
            <div className="text-center p-3 bg-wa-incoming/50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-100">{stats.avgPerDay}</p>
              <p className="text-xs text-gray-500">Avg/Day</p>
            </div>
            <div className="text-center p-3 bg-wa-incoming/50 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <p className="text-sm font-bold text-gray-100">
                {stats.firstMessage ? format(new Date(stats.firstMessage), 'MMM d, yy') : '-'}
              </p>
              <p className="text-xs text-gray-500">First Seen</p>
            </div>
            <div className="text-center p-3 bg-wa-incoming/50 rounded-lg">
              <Clock className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <p className="text-sm font-bold text-gray-100">
                {stats.lastMessage
                  ? formatDistanceToNow(new Date(stats.lastMessage), { addSuffix: true })
                  : '-'}
              </p>
              <p className="text-xs text-gray-500">Last Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-wa-panel border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4">Activity (Last 30 Days)</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorUserActivity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00a884" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00a884" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3942" vertical={false} />
              <XAxis dataKey="date" stroke="#8696a0" fontSize={10} tickLine={false} />
              <YAxis stroke="#8696a0" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111b21',
                  border: '1px solid #2a3942',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="messages"
                stroke="#00a884"
                fill="url(#colorUserActivity)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Groups */}
        <div className="bg-wa-panel border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">Active Groups</h3>
          <div className="space-y-2">
            {stats.groupsActive.map((group) => (
              <Link
                key={group.group_id}
                to={`/groups/${group.group_id}`}
                className="flex items-center justify-between p-3 bg-wa-incoming/30 rounded-lg hover:bg-wa-incoming/50 transition-colors"
              >
                <span className="text-gray-200 truncate">{group.group_name}</span>
                <span className="text-sm text-gray-500">
                  {group.total_messages?.toLocaleString()} msgs
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Top Words */}
        <div className="bg-wa-panel border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">Frequent Words</h3>
          <div className="flex flex-wrap gap-2">
            {stats.topWords.map(({ word, count }) => (
              <span
                key={word}
                className="px-3 py-1 bg-wa-incoming rounded-full text-sm text-gray-300"
                title={`Used ${count} times`}
              >
                {word}
                <span className="ml-1 text-gray-500 text-xs">({count})</span>
              </span>
            ))}
            {stats.topWords.length === 0 && (
              <p className="text-gray-500 text-sm">Not enough text messages to analyze</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Messages */}
      <div className="bg-wa-panel border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4">Recent Messages</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {stats.recentMessages.map((msg, idx) => (
            <div
              key={`${msg.message_id}-${idx}`}
              className="p-3 bg-wa-incoming/30 rounded-lg"
            >
              <p className="text-gray-200 text-sm break-words">
                {msg.body || <span className="text-gray-500 italic">&lt;{msg.message_type}&gt;</span>}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <Link
                  to={`/groups/${msg.group_id}`}
                  className="hover:text-wa-teal transition-colors"
                >
                  {stats.groupsActive.find((g) => g.group_id === msg.group_id)?.group_name ||
                    'Unknown Group'}
                </Link>
                <span>•</span>
                <span>{format(new Date(msg.message_timestamp), 'MMM d, HH:mm')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
