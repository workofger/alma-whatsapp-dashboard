import React, { useMemo } from 'react';
import { Message } from '../../types';

interface HeatmapChartProps {
  messages: Message[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const HeatmapChart: React.FC<HeatmapChartProps> = ({ messages }) => {
  const { heatmapData, maxCount, peakTime } = useMemo(() => {
    // Initialize grid: [day][hour] = count
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    let max = 0;
    let peak = { day: 0, hour: 0, count: 0 };

    messages.forEach((m) => {
      const date = new Date(m.message_timestamp);
      const day = date.getDay();
      const hour = date.getHours();
      grid[day][hour]++;

      if (grid[day][hour] > max) {
        max = grid[day][hour];
        peak = { day, hour, count: grid[day][hour] };
      }
    });

    return { heatmapData: grid, maxCount: max, peakTime: peak };
  }, [messages]);

  const getColor = (count: number): string => {
    if (count === 0) return 'bg-gray-800';
    const intensity = count / maxCount;
    if (intensity < 0.2) return 'bg-wa-teal/20';
    if (intensity < 0.4) return 'bg-wa-teal/40';
    if (intensity < 0.6) return 'bg-wa-teal/60';
    if (intensity < 0.8) return 'bg-wa-teal/80';
    return 'bg-wa-teal';
  };

  const formatHour = (hour: number): string => {
    if (hour === 0) return '12am';
    if (hour === 12) return '12pm';
    return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
  };

  return (
    <div className="bg-wa-panel p-6 rounded-lg border border-gray-800">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">Peak Activity Hours</h3>
          <p className="text-sm text-gray-400">When are your groups most active?</p>
        </div>
        {peakTime.count > 0 && (
          <div className="text-right">
            <div className="text-sm font-medium text-wa-teal">
              {DAYS[peakTime.day]} {formatHour(peakTime.hour)}
            </div>
            <div className="text-xs text-gray-400">Peak time</div>
          </div>
        )}
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hour Labels */}
          <div className="flex mb-2 ml-12">
            {HOURS.filter((h) => h % 3 === 0).map((hour) => (
              <div
                key={hour}
                className="text-xs text-gray-500 text-center"
                style={{ width: `${100 / 8}%` }}
              >
                {formatHour(hour)}
              </div>
            ))}
          </div>

          {/* Grid Rows */}
          {DAYS.map((day, dayIndex) => (
            <div key={day} className="flex items-center mb-1">
              <div className="w-12 text-xs text-gray-400 text-right pr-2">{day}</div>
              <div className="flex-1 flex gap-0.5">
                {HOURS.map((hour) => {
                  const count = heatmapData[dayIndex][hour];
                  return (
                    <div
                      key={hour}
                      className={`flex-1 h-6 rounded-sm ${getColor(count)} cursor-pointer transition-all hover:ring-1 hover:ring-wa-teal`}
                      title={`${day} ${formatHour(hour)}: ${count} messages`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-end gap-2 text-xs text-gray-400">
        <span>Less</span>
        <div className="flex gap-0.5">
          <div className="w-4 h-4 rounded-sm bg-gray-800" />
          <div className="w-4 h-4 rounded-sm bg-wa-teal/20" />
          <div className="w-4 h-4 rounded-sm bg-wa-teal/40" />
          <div className="w-4 h-4 rounded-sm bg-wa-teal/60" />
          <div className="w-4 h-4 rounded-sm bg-wa-teal/80" />
          <div className="w-4 h-4 rounded-sm bg-wa-teal" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

export default HeatmapChart;
