import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
  link?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  subtitle,
  link,
}) => {
  const CardWrapper = link ? Link : 'div';
  const wrapperProps = link ? { to: link } : {};

  return (
    <CardWrapper
      {...(wrapperProps as any)}
      className={`bg-wa-panel p-6 rounded-lg border border-gray-800 shadow-sm transition-all ${
        link ? 'hover:border-wa-teal/50 hover:shadow-wa-teal/10 hover:shadow-md cursor-pointer' : ''
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <h3 className="text-3xl font-bold text-white mt-2">{value}</h3>
        </div>
        <div className="p-2 bg-wa-incoming rounded-lg text-wa-teal flex-shrink-0">
          <Icon size={24} />
        </div>
      </div>
      {(trend || subtitle) && (
        <div className="mt-4 flex items-center justify-between gap-2">
          {trend && (
            <div
              className={`text-sm flex items-center gap-1 ${
                trendUp ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{trend}</span>
            </div>
          )}
          {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
        </div>
      )}
    </CardWrapper>
  );
};

export default StatsCard;
