import React from 'react';
import { HourlyActivity } from '../../services/analyticsService';

interface Props {
  data: HourlyActivity[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const HeatmapChartV2: React.FC<Props> = ({ data }) => {
  // Build heatmap matrix
  const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  data.forEach(({ day, hour, count }) => {
    matrix[day][hour] = count;
  });

  // Find max for color scaling
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  // Get color intensity based on count
  const getColor = (count: number): string => {
    if (count === 0) return 'bg-gray-900/50';
    const intensity = count / maxCount;
    if (intensity < 0.2) return 'bg-wa-teal/20';
    if (intensity < 0.4) return 'bg-wa-teal/40';
    if (intensity < 0.6) return 'bg-wa-teal/60';
    if (intensity < 0.8) return 'bg-wa-teal/80';
    return 'bg-wa-teal';
  };

  // Calculate peak hour
  const peakHour = data.reduce(
    (max, d) => (d.count > max.count ? d : max),
    { day: 0, hour: 0, count: 0 }
  );

  return (
    <div className="bg-wa-panel p-6 rounded-lg border border-gray-800">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">Peak Activity Hours</h3>
          <p className="text-sm text-gray-500">When your groups are most active</p>
        </div>
        {peakHour.count > 0 && (
          <div className="text-right">
            <p className="text-sm text-gray-400">
              Peak: <span className="text-wa-teal font-semibold">{DAYS[peakHour.day]} {peakHour.hour}:00</span>
            </p>
            <p className="text-xs text-gray-500">{peakHour.count.toLocaleString()} messages</p>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hour labels */}
          <div className="flex mb-1">
            <div className="w-10 flex-shrink-0" />
            {HOURS.filter((_, i) => i % 2 === 0).map((hour) => (
              <div
                key={hour}
                className="flex-1 text-center text-[10px] text-gray-500"
                style={{ minWidth: '20px' }}
              >
                {hour}
              </div>
            ))}
          </div>

          {/* Heatmap rows */}
          {DAYS.map((day, dayIndex) => (
            <div key={day} className="flex items-center mb-1">
              <div className="w-10 flex-shrink-0 text-xs text-gray-500 font-medium">
                {day}
              </div>
              <div className="flex flex-1 gap-[2px]">
                {HOURS.map((hour) => {
                  const count = matrix[dayIndex][hour];
                  return (
                    <div
                      key={hour}
                      className={`flex-1 h-5 rounded-sm transition-colors cursor-pointer ${getColor(count)} hover:ring-1 hover:ring-wa-teal`}
                      style={{ minWidth: '10px' }}
                      title={`${day} ${hour}:00 - ${count} messages`}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center justify-end mt-4 gap-1 text-xs text-gray-500">
            <span>Less</span>
            <div className="flex gap-[2px]">
              <div className="w-3 h-3 bg-gray-900/50 rounded-sm" />
              <div className="w-3 h-3 bg-wa-teal/20 rounded-sm" />
              <div className="w-3 h-3 bg-wa-teal/40 rounded-sm" />
              <div className="w-3 h-3 bg-wa-teal/60 rounded-sm" />
              <div className="w-3 h-3 bg-wa-teal/80 rounded-sm" />
              <div className="w-3 h-3 bg-wa-teal rounded-sm" />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapChartV2;
