import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { DailyMessageCount } from '../../services/analyticsService';

interface Props {
  data: DailyMessageCount[];
  title?: string;
  subtitle?: string;
}

const ActivityChartV2: React.FC<Props> = ({
  data,
  title = 'Message Activity',
  subtitle,
}) => {
  // Calculate statistics
  const totalMessages = data.reduce((sum, d) => sum + d.count, 0);
  const avgPerDay = Math.round(totalMessages / data.length || 0);
  const maxDay = data.reduce(
    (max, d) => (d.count > max.count ? d : max),
    { date: '', count: 0 }
  );

  // Format data for chart
  const chartData = data.map((d) => ({
    date: format(parseISO(d.date), 'MMM d'),
    fullDate: d.date,
    messages: d.count,
  }));

  return (
    <div className="bg-wa-panel p-6 rounded-lg border border-gray-800">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <p className="text-2xl font-bold text-wa-teal">{totalMessages.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Total Messages</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-300">{avgPerDay.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Avg / Day</p>
          </div>
          {maxDay.date && (
            <div className="text-right hidden sm:block">
              <p className="text-2xl font-bold text-purple-400">{maxDay.count.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Peak ({format(parseISO(maxDay.date), 'MMM d')})</p>
            </div>
          )}
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
              dataKey="date"
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
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111b21',
                border: '1px solid #2a3942',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
              }}
              itemStyle={{ color: '#e9edef' }}
              labelStyle={{ color: '#8696a0' }}
              formatter={(value: number) => [value.toLocaleString(), 'Messages']}
            />
            <Area
              type="monotone"
              dataKey="messages"
              stroke="#00a884"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorMessages)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ActivityChartV2;
