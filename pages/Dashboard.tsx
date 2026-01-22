import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchGroups, fetchGhosts } from '../services/dataService';
import {
  fetchDashboardStats,
  fetchDailyMessageCounts,
  fetchHourlyActivity,
  fetchTopUsers,
  fetchMessageTypeDistribution,
  DashboardStats,
  DailyMessageCount,
  HourlyActivity,
  UserActivity,
} from '../services/analyticsService';
import { GroupStats, GhostUser } from '../types';
import StatsCard from '../components/StatsCard';
import ActivityChartV2 from '../components/charts/ActivityChartV2';
import HeatmapChartV2 from '../components/charts/HeatmapChartV2';
import UserLeaderboardV2 from '../components/charts/UserLeaderboardV2';
import { MessageSquare, Users, Ghost, Activity, TrendingUp, Loader2, Search, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { getUserDisplayName } from '../services/userUtils';

const COLORS = ['#00a884', '#53bdeb', '#a288f5', '#e56450', '#f5a623'];

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [groups, setGroups] = useState<GroupStats[]>([]);
  const [ghosts, setGhosts] = useState<GhostUser[]>([]);
  const [dailyCounts, setDailyCounts] = useState<DailyMessageCount[]>([]);
  const [hourlyActivity, setHourlyActivity] = useState<HourlyActivity[]>([]);
  const [topUsers, setTopUsers] = useState<UserActivity[]>([]);
  const [messageTypes, setMessageTypes] = useState<{ type: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          statsData,
          groupsData,
          ghostsData,
          dailyData,
          hourlyData,
          usersData,
          typesData,
        ] = await Promise.all([
          fetchDashboardStats(),
          fetchGroups(),
          fetchGhosts(),
          fetchDailyMessageCounts(30),
          fetchHourlyActivity(30),
          fetchTopUsers(10),
          fetchMessageTypeDistribution(),
        ]);

        setStats(statsData);
        setGroups(groupsData);
        setGhosts(ghostsData);
        setDailyCounts(dailyData);
        setHourlyActivity(hourlyData);
        setTopUsers(usersData);
        setMessageTypes(typesData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-wa-teal" size={48} />
        <p className="text-gray-400">Loading analytics...</p>
      </div>
    );
  }

  // Prepare chart data
  const groupChartData = groups.map((g) => ({
    name: g.group_name?.substring(0, 12) || 'Unknown',
    messages: g.total_messages,
  }));

  const pieData = messageTypes
    .slice(0, 5)
    .map(({ type, count }) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
    }));

  // Format trend display
  const formatTrend = (trend: { percentage: number | null; direction: string }) => {
    if (trend.percentage === null) return null;
    const prefix = trend.direction === 'up' ? '+' : '';
    return `${prefix}${trend.percentage}%`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Overview</h2>
          <p className="text-gray-400 text-sm mt-1">
            Real-time analytics from your WhatsApp groups
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/search"
            className="flex items-center gap-2 px-4 py-2 bg-wa-incoming hover:bg-wa-incoming/80 rounded-lg text-gray-300 text-sm transition-colors"
          >
            <Search size={16} />
            Search Messages
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Messages"
          value={stats?.totalMessages?.toLocaleString() || '0'}
          icon={MessageSquare}
          trend={stats?.trends.messages ? formatTrend(stats.trends.messages) : undefined}
          trendUp={stats?.trends.messages?.direction === 'up'}
          subtitle="Last 7 days vs previous"
        />
        <StatsCard
          title="Active Groups"
          value={stats?.totalGroups || groups.length}
          icon={Activity}
        />
        <StatsCard
          title="Monitored Users"
          value={stats?.totalMembers?.toLocaleString() || '0'}
          icon={Users}
        />
        <StatsCard
          title="Ghost Users"
          value={stats?.ghostUsers || ghosts.length}
          icon={Ghost}
          trend={stats?.trends.ghosts ? formatTrend(stats.trends.ghosts) : undefined}
          trendUp={stats?.trends.ghosts?.direction === 'down'}
          subtitle="Inactive 30+ days"
        />
      </div>

      {/* Activity Chart */}
      {dailyCounts.length > 0 && (
        <ActivityChartV2 data={dailyCounts} title="Message Activity" subtitle="Last 30 days" />
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Messages by Group */}
        <div className="bg-wa-panel p-6 rounded-lg border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Messages by Group</h3>
            <Link to="/groups" className="text-sm text-wa-teal hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {groupChartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a3942" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#8696a0"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke="#8696a0" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111b21',
                      border: '1px solid #2a3942',
                      borderRadius: '8px',
                    }}
                    itemStyle={{ color: '#e9edef' }}
                  />
                  <Bar dataKey="messages" fill="#00a884" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="No group data available" />
          )}
        </div>

        {/* Message Types Pie Chart */}
        <div className="bg-wa-panel p-6 rounded-lg border border-gray-800">
          <h3 className="text-lg font-bold mb-4">Message Types</h3>
          {pieData.length > 0 ? (
            <div className="h-64 w-full flex items-center">
              <ResponsiveContainer width="60%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111b21',
                      border: '1px solid #2a3942',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-gray-300 truncate">{entry.name}</span>
                    <span className="text-gray-500 ml-auto">{entry.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState message="No message type data available" />
          )}
        </div>
      </div>

      {/* Heatmap and Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {hourlyActivity.length > 0 ? (
          <HeatmapChartV2 data={hourlyActivity} />
        ) : (
          <div className="bg-wa-panel p-6 rounded-lg border border-gray-800">
            <h3 className="text-lg font-bold mb-4">Peak Activity Hours</h3>
            <EmptyState message="Not enough data for heatmap" />
          </div>
        )}
        
        {topUsers.length > 0 ? (
          <UserLeaderboardV2 users={topUsers} />
        ) : (
          <div className="bg-wa-panel p-6 rounded-lg border border-gray-800">
            <h3 className="text-lg font-bold mb-4">Top Contributors</h3>
            <EmptyState message="No user activity data available" />
          </div>
        )}
      </div>

      {/* Recent Ghost Users Table */}
      <div className="bg-wa-panel p-6 rounded-lg border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Recent Ghost Users</h3>
          <Link to="/ghosts" className="text-sm text-wa-teal hover:underline flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {ghosts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="border-b border-gray-700 text-xs uppercase">
                <tr>
                  <th className="py-2">User</th>
                  <th className="py-2">Group</th>
                  <th className="py-2 text-right">Inactive Days</th>
                </tr>
              </thead>
              <tbody>
                {ghosts.slice(0, 5).map((ghost, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-800 last:border-0 hover:bg-wa-incoming/30 transition-colors"
                  >
                    <td className="py-3 font-medium text-gray-200">
                      {getUserDisplayName(ghost)}
                    </td>
                    <td className="py-3">{ghost.group_name}</td>
                    <td className="py-3 text-right text-red-400 font-mono">{ghost.days_inactive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No ghost users found. Everyone is active! 🎉" />
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-600 pt-4">
        Created by Gerardo, Alma's God 🛐
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="h-48 flex flex-col items-center justify-center text-gray-500">
    <Activity size={32} className="mb-2 opacity-30" />
    <p>{message}</p>
  </div>
);

export default Dashboard;
