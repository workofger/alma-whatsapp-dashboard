import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchGroups, fetchGhosts } from '../services/dataService';
import {
  fetchDailyMessageCounts,
  fetchHourlyActivity,
  fetchTopUsers,
  fetchMessageTypeDistribution,
  DailyMessageCount,
  HourlyActivity,
  UserActivity,
} from '../services/analyticsService';
import { GroupStats } from '../types';
import {
  BarChart3,
  Calendar,
  Filter,
  Loader2,
  TrendingUp,
  Users,
  MessageSquare,
  Clock,
  FileDown,
  RefreshCw,
  ArrowLeftRight,
  LucideIcon,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import HeatmapChartV2 from '../components/charts/HeatmapChartV2';
import UserLeaderboardV2 from '../components/charts/UserLeaderboardV2';
import ExportPdfModal from '../components/ExportPdfModal';

const COLORS = ['#00a884', '#53bdeb', '#a288f5', '#e56450', '#f5a623', '#7bc8a4', '#d673ad'];

type DateRange = '7d' | '30d' | '90d' | 'custom';

const Analytics: React.FC = () => {
  // State
  const [groups, setGroups] = useState<GroupStats[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [compareGroupId, setCompareGroupId] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [customStart, setCustomStart] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [ghostCount, setGhostCount] = useState(0);
  const [totalMemberCount, setTotalMemberCount] = useState(0);
  const chartRef = useRef<HTMLDivElement>(null);

  // Data state
  const [dailyCounts, setDailyCounts] = useState<DailyMessageCount[]>([]);
  const [compareDailyCounts, setCompareDailyCounts] = useState<DailyMessageCount[]>([]);
  const [hourlyActivity, setHourlyActivity] = useState<HourlyActivity[]>([]);
  const [topUsers, setTopUsers] = useState<UserActivity[]>([]);
  const [messageTypes, setMessageTypes] = useState<{ type: string; count: number }[]>([]);

  // Calculate days from date range
  const getDays = (): number => {
    switch (dateRange) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case 'custom':
        const start = new Date(customStart);
        const end = new Date(customEnd);
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      default: return 30;
    }
  };

  // Load groups and ghosts
  useEffect(() => {
    fetchGroups().then(data => {
      setGroups(data);
      // Calculate total members from group stats
      const membersTotal = data.reduce((sum, g) => sum + (g.member_count || 0), 0);
      setTotalMemberCount(membersTotal);
    });
    fetchGhosts().then(ghosts => setGhostCount(ghosts.length));
  }, []);

  // Load analytics data
  const loadData = async () => {
    setLoading(true);
    const days = getDays();
    const groupId = selectedGroupId === 'all' ? undefined : selectedGroupId;

    try {
      const [daily, hourly, users, types] = await Promise.all([
        fetchDailyMessageCounts(days, groupId),
        fetchHourlyActivity(days, groupId),
        fetchTopUsers(20, groupId),
        fetchMessageTypeDistribution(groupId),
      ]);

      setDailyCounts(daily);
      setHourlyActivity(hourly);
      setTopUsers(users);
      setMessageTypes(types);

      // Load comparison data if enabled
      if (showComparison && compareGroupId) {
        const compareDaily = await fetchDailyMessageCounts(days, compareGroupId);
        setCompareDailyCounts(compareDaily);
      } else {
        setCompareDailyCounts([]);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedGroupId, dateRange, customStart, customEnd, showComparison, compareGroupId]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalMessages = dailyCounts.reduce((sum, d) => sum + d.count, 0);
    const avgPerDay = Math.round(totalMessages / (dailyCounts.length || 1));
    const maxDay = dailyCounts.reduce((max, d) => d.count > max.count ? d : max, { date: '', count: 0 });
    const minDay = dailyCounts.filter(d => d.count > 0).reduce((min, d) => d.count < min.count ? d : min, { date: '', count: Infinity });
    
    // Find most active hour
    const hourTotals = new Map<number, number>();
    hourlyActivity.forEach(h => {
      hourTotals.set(h.hour, (hourTotals.get(h.hour) || 0) + h.count);
    });
    let peakHour = 0;
    let peakHourCount = 0;
    hourTotals.forEach((count, hour) => {
      if (count > peakHourCount) {
        peakHour = hour;
        peakHourCount = count;
      }
    });

    return {
      totalMessages,
      avgPerDay,
      maxDay,
      minDay: minDay.count === Infinity ? { date: '', count: 0 } : minDay,
      peakHour,
      peakHourCount,
      avgPerUser: topUsers.length > 0 ? Math.round(totalMessages / topUsers.length) : 0,
    };
  }, [dailyCounts, hourlyActivity, topUsers]);

  // Prepare comparison chart data
  const comparisonChartData = useMemo(() => {
    if (!showComparison || compareDailyCounts.length === 0) return [];
    
    return dailyCounts.map((d, i) => ({
      date: format(parseISO(d.date), 'MMM d'),
      primary: d.count,
      compare: compareDailyCounts[i]?.count || 0,
    }));
  }, [dailyCounts, compareDailyCounts, showComparison]);

  // Prepare pie chart data
  const pieData = messageTypes.slice(0, 6).map(({ type, count }) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
  }));

  // Prepare hourly chart data
  const hourlyChartData = useMemo(() => {
    const hourTotals = new Map<number, number>();
    hourlyActivity.forEach(h => {
      hourTotals.set(h.hour, (hourTotals.get(h.hour) || 0) + h.count);
    });
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      messages: hourTotals.get(i) || 0,
    }));
  }, [hourlyActivity]);

  const selectedGroupName = groups.find(g => g.group_id === selectedGroupId)?.group_name || 'All Groups';
  const compareGroupName = groups.find(g => g.group_id === compareGroupId)?.group_name || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="text-wa-teal" />
            Analytics
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Detailed insights and metrics for your WhatsApp groups
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-lg bg-wa-incoming hover:bg-wa-incoming/80 text-gray-400 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowPdfModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-wa-teal text-white rounded-lg hover:bg-wa-teal/90 transition-colors"
          >
            <FileDown size={18} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-wa-panel p-4 rounded-lg border border-gray-800">
        <div className="flex flex-wrap items-end gap-4">
          {/* Date Range */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1.5">
              <Calendar size={12} className="inline mr-1" />
              Date Range
            </label>
            <div className="flex gap-2">
              {(['7d', '30d', '90d', 'custom'] as DateRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    dateRange === range
                      ? 'bg-wa-teal text-white'
                      : 'bg-wa-incoming text-gray-400 hover:text-white'
                  }`}
                >
                  {range === 'custom' ? 'Custom' : range.replace('d', ' days')}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Inputs */}
          {dateRange === 'custom' && (
            <div className="flex gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-1.5 bg-wa-incoming border border-gray-700 rounded-lg text-sm text-gray-200"
              />
              <span className="text-gray-500 self-center">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-1.5 bg-wa-incoming border border-gray-700 rounded-lg text-sm text-gray-200"
              />
            </div>
          )}

          {/* Group Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1.5">
              <Filter size={12} className="inline mr-1" />
              Group
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full px-3 py-1.5 bg-wa-incoming border border-gray-700 rounded-lg text-sm text-gray-200"
            >
              <option value="all">All Groups</option>
              {groups.map((g) => (
                <option key={g.group_id} value={g.group_id}>
                  {g.group_name}
                </option>
              ))}
            </select>
          </div>

          {/* Comparison Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowComparison(!showComparison)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                showComparison
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-600'
                  : 'bg-wa-incoming text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              <ArrowLeftRight size={14} />
              Compare
            </button>
          </div>

          {/* Comparison Group Selector */}
          {showComparison && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-gray-500 mb-1.5">Compare with</label>
              <select
                value={compareGroupId}
                onChange={(e) => setCompareGroupId(e.target.value)}
                className="w-full px-3 py-1.5 bg-wa-incoming border border-purple-600/50 rounded-lg text-sm text-gray-200"
              >
                <option value="">Select group...</option>
                {groups.filter(g => g.group_id !== selectedGroupId).map((g) => (
                  <option key={g.group_id} value={g.group_id}>
                    {g.group_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-wa-teal" size={48} />
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <StatCard
              label="Total Messages"
              value={stats.totalMessages.toLocaleString()}
              icon={MessageSquare}
              color="text-wa-teal"
            />
            <StatCard
              label="Avg / Day"
              value={stats.avgPerDay.toLocaleString()}
              icon={TrendingUp}
              color="text-blue-400"
            />
            <StatCard
              label="Peak Day"
              value={stats.maxDay.count.toLocaleString()}
              sublabel={stats.maxDay.date ? format(parseISO(stats.maxDay.date), 'MMM d') : '-'}
              icon={TrendingUp}
              color="text-green-400"
            />
            <StatCard
              label="Slowest Day"
              value={stats.minDay.count.toLocaleString()}
              sublabel={stats.minDay.date ? format(parseISO(stats.minDay.date), 'MMM d') : '-'}
              icon={TrendingUp}
              color="text-red-400"
            />
            <StatCard
              label="Peak Hour"
              value={`${stats.peakHour}:00`}
              sublabel={`${stats.peakHourCount} msgs`}
              icon={Clock}
              color="text-purple-400"
            />
            <StatCard
              label="Avg / User"
              value={stats.avgPerUser.toLocaleString()}
              icon={Users}
              color="text-orange-400"
            />
          </div>

          {/* Main Activity Chart or Comparison */}
          <div ref={chartRef} className="bg-wa-panel p-6 rounded-lg border border-gray-800" id="activity-chart">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">
                  {showComparison ? 'Group Comparison' : 'Message Activity'}
                </h3>
                <p className="text-sm text-gray-500">
                  {showComparison 
                    ? `${selectedGroupName} vs ${compareGroupName || 'Select group'}`
                    : `Last ${getDays()} days`
                  }
                </p>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                {showComparison && compareGroupId ? (
                  <LineChart data={comparisonChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3942" vertical={false} />
                    <XAxis dataKey="date" stroke="#8696a0" fontSize={11} />
                    <YAxis stroke="#8696a0" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111b21', border: '1px solid #2a3942', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="primary" 
                      name={selectedGroupName}
                      stroke="#00a884" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="compare" 
                      name={compareGroupName}
                      stroke="#a288f5" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                ) : (
                  <AreaChart data={dailyCounts.map(d => ({ date: format(parseISO(d.date), 'MMM d'), messages: d.count }))}>
                    <defs>
                      <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00a884" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00a884" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3942" vertical={false} />
                    <XAxis dataKey="date" stroke="#8696a0" fontSize={11} interval="preserveStartEnd" />
                    <YAxis stroke="#8696a0" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111b21', border: '1px solid #2a3942', borderRadius: '8px' }}
                      formatter={(value: number) => [value.toLocaleString(), 'Messages']}
                    />
                    <Area type="monotone" dataKey="messages" stroke="#00a884" fill="url(#colorActivity)" strokeWidth={2} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Second Row: Hourly + Pie */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Activity */}
            <div className="bg-wa-panel p-6 rounded-lg border border-gray-800">
              <h3 className="text-lg font-bold mb-4">Activity by Hour</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3942" vertical={false} />
                    <XAxis dataKey="hour" stroke="#8696a0" fontSize={10} interval={2} />
                    <YAxis stroke="#8696a0" fontSize={10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111b21', border: '1px solid #2a3942', borderRadius: '8px' }}
                    />
                    <Bar dataKey="messages" fill="#00a884" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Message Types */}
            <div className="bg-wa-panel p-6 rounded-lg border border-gray-800">
              <h3 className="text-lg font-bold mb-4">Message Types</h3>
              {pieData.length > 0 ? (
                <div className="h-64 flex items-center">
                  <ResponsiveContainer width="55%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#111b21', border: '1px solid #2a3942', borderRadius: '8px' }}
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
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No message type data available
                </div>
              )}
            </div>
          </div>

          {/* Third Row: Heatmap + Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HeatmapChartV2 data={hourlyActivity} />
            <UserLeaderboardV2 users={topUsers} title="Top 20 Contributors" />
          </div>
        </>
      )}

      {/* PDF Export Modal */}
      <ExportPdfModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        reportData={{
          stats: {
            // Use sum of group total_messages for accurate total, not filtered daily counts
            totalMessages: groups.reduce((sum, g) => sum + (g.total_messages || 0), 0),
            totalGroups: groups.length,
            totalMembers: totalMemberCount,
            ghostUsers: ghostCount,
          },
          groups,
          topUsers,
        }}
        chartElement={chartRef.current}
        dateRange={dateRange === 'custom' ? `${customStart} to ${customEnd}` : `Last ${getDays()} days`}
      />
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon: LucideIcon;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sublabel, icon: Icon, color }) => (
  <div className="bg-wa-panel p-4 rounded-lg border border-gray-800">
    <div className="flex items-center gap-2 mb-2">
      <Icon size={14} className={color} />
      <span className="text-xs text-gray-500">{label}</span>
    </div>
    <div className="text-xl font-bold text-white">{value}</div>
    {sublabel && <div className="text-xs text-gray-500 mt-1">{sublabel}</div>}
  </div>
);

export default Analytics;
