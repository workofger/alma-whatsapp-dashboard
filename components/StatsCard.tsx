import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, trend, trendUp }) => {
  return (
    <div className="bg-wa-panel p-6 rounded-lg border border-gray-800 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <h3 className="text-3xl font-bold text-white mt-2">{value}</h3>
        </div>
        <div className="p-2 bg-wa-incoming rounded-lg text-wa-teal">
          <Icon size={24} />
        </div>
      </div>
      {trend && (
        <div className={`mt-4 text-sm flex items-center ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
          <span>{trend}</span>
          <span className="ml-1 text-gray-500">vs last month</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
