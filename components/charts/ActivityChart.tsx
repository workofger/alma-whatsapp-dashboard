import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Message } from '../../types';
import { format, parseISO, eachDayOfInterval, subDays, startOfDay } from 'date-fns';

interface ActivityChartProps {
  messages: Message[];
  days?: number;
}

const ActivityChart: React.FC<ActivityChartProps> = ({ messages, days = 30 }) => {
  const chartData = useMemo(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    // Create all days in range
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    const dayMap = new Map<string, number>();

    allDays.forEach((day) => {
      dayMap.set(format(day, 'yyyy-MM-dd'), 0);
    });

    // Count messages per day
    messages.forEach((m) => {
      const dayKey = format(startOfDay(parseISO(m.message_timestamp)), 'yyyy-MM-dd');
      if (dayMap.has(dayKey)) {
        dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + 1);
      }
    });

    return Array.from(dayMap.entries()).map(([date, count]) => ({
      date,
      displayDate: format(parseISO(date), 'MMM d'),
      messages: count,
    }));
  }, [messages, days]);

  const totalMessages = chartData.reduce((sum, d) => sum + d.messages, 0);
  const avgPerDay = Math.round(totalMessages / days);
  const peakDay = chartData.reduce((max, d) => (d.messages > max.messages ? d : max), chartData[0]);

  return (
    <div className="bg-wa-panel p-6 rounded-lg border border-gray-800">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">Activity Over Time</h3>
          <p className="text-sm text-gray-400">Messages per day (last {days} days)</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-wa-teal">{avgPerDay}</div>
          <div className="text-xs text-gray-400">avg/day</div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00a884" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00a884" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3942" vertical={false} />
            <XAxis
              dataKey="displayDate"
              stroke="#8696a0"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#8696a0"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111b21',
                border: '1px solid #2a3942',
                borderRadius: '8px',
              }}
              itemStyle={{ color: '#e9edef' }}
              labelStyle={{ color: '#8696a0' }}
            />
            <Area
              type="monotone"
              dataKey="messages"
              stroke="#00a884"
              strokeWidth={2}
              fill="url(#colorMessages)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Row */}
      <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-lg font-bold text-white">{totalMessages.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Total Messages</div>
        </div>
        <div>
          <div className="text-lg font-bold text-white">{peakDay?.messages || 0}</div>
          <div className="text-xs text-gray-400">Peak Day</div>
        </div>
        <div>
          <div className="text-lg font-bold text-white">{peakDay?.displayDate || '-'}</div>
          <div className="text-xs text-gray-400">Most Active</div>
        </div>
      </div>
    </div>
  );
};

export default ActivityChart;
