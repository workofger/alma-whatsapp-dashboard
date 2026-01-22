import React, { useEffect, useState } from 'react';
import { fetchGroups, fetchGhosts, fetchMessages } from '../services/dataService';
import { GroupStats, GhostUser, Message } from '../types';
import StatsCard from '../components/StatsCard';
import ActivityChart from '../components/charts/ActivityChart';
import HeatmapChart from '../components/charts/HeatmapChart';
import UserLeaderboard from '../components/charts/UserLeaderboard';
import { MessageSquare, Users, Ghost, Activity, TrendingUp, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

const Dashboard: React.FC = () => {
  const [groups, setGroups] = useState<GroupStats[]>([]);
  const [ghosts, setGhosts] = useState<GhostUser[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [groupsData, ghostsData] = await Promise.all([fetchGroups(), fetchGhosts()]);
      setGroups(groupsData);
      setGhosts(ghostsData);

      // Fetch messages from all groups for analytics
      if (groupsData.length > 0) {
        const messagesPromises = groupsData.map((g) => fetchMessages(g.group_id));
        const allGroupMessages = await Promise.all(messagesPromises);
        setAllMessages(allGroupMessages.flat());
      }

      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-wa-teal" size={48} />
      </div>
    );
  }

  const totalMessages = groups.reduce((acc, g) => acc + g.total_messages, 0);
  const totalMembers = groups.reduce((acc, g) => acc + g.member_count, 0);

  const chartData = groups.map((g) => ({
    name: g.group_name?.substring(0, 15) || 'Unknown',
    messages: g.total_messages,
  }));

  // Message type distribution
  const messageTypeCounts = allMessages.reduce((acc, m) => {
    const type = m.message_type || 'other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(messageTypeCounts)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const COLORS = ['#00a884', '#53bdeb', '#a288f5', '#e56450', '#f5a623'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Overview</h2>
          <p className="text-gray-400 text-sm mt-1">
            Monitor your WhatsApp groups activity
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Activity size={16} className="text-wa-teal" />
          <span>Real-time analytics</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Messages"
          value={totalMessages.toLocaleString()}
          icon={MessageSquare}
          trend="+12%"
          trendUp={true}
        />
        <StatsCard title="Active Groups" value={groups.length} icon={Activity} />
        <StatsCard
          title="Monitored Users"
          value={totalMembers}
          icon={Users}
          trend="+5%"
          trendUp={true}
        />
        <StatsCard
          title="Ghost Users"
          value={ghosts.length}
          icon={Ghost}
          trend={`${ghosts.length}`}
          trendUp={false}
        />
      </div>

      {/* Activity Chart - Full Width */}
      {allMessages.length > 0 && <ActivityChart messages={allMessages} days={30} />}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Messages by Group */}
        <div className="bg-wa-panel p-6 rounded-lg border border-gray-800">
          <h3 className="text-lg font-bold mb-4">Messages by Group</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3942" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#8696a0"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#8696a0" fontSize={12} tickLine={false} axisLine={false} />
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
        </div>

        {/* Message Types Pie Chart */}
        <div className="bg-wa-panel p-6 rounded-lg border border-gray-800">
          <h3 className="text-lg font-bold mb-4">Message Types</h3>
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
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-gray-300">{entry.name}</span>
                  <span className="text-gray-500 ml-auto">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap and Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {allMessages.length > 0 && <HeatmapChart messages={allMessages} />}
        {allMessages.length > 0 && <UserLeaderboard messages={allMessages} limit={8} />}
      </div>

      {/* Recent Ghost Users Table */}
      <div className="bg-wa-panel p-6 rounded-lg border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Recent Ghost Users</h3>
          <a href="#/ghosts" className="text-sm text-wa-teal hover:underline">
            View all
          </a>
        </div>
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
                    {ghost.user_pushname || ghost.user_number}
                  </td>
                  <td className="py-3">{ghost.group_name}</td>
                  <td className="py-3 text-right text-red-400 font-mono">{ghost.days_inactive}</td>
                </tr>
              ))}
              {ghosts.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-500">
                    No ghost users found. Everyone is active! 🎉
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-600 pt-4">
        Created by Gerardo, Alma's God 🛐
      </div>
    </div>
  );
};

export default Dashboard;
