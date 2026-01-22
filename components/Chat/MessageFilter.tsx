import React from 'react';
import { Search, Calendar, Filter, X } from 'lucide-react';
import { format, subDays } from 'date-fns';

export interface FilterState {
  search: string;
  sender: string;
  messageType: string;
  dateStart: string;
  dateEnd: string;
}

interface MessageFilterProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  senders: string[];
  messageTypes: string[];
  onClear: () => void;
}

const MessageFilter: React.FC<MessageFilterProps> = ({
  filters,
  onFilterChange,
  senders,
  messageTypes,
  onClear,
}) => {
  const hasActiveFilters =
    filters.search ||
    filters.sender ||
    filters.messageType ||
    filters.dateStart ||
    filters.dateEnd;

  const presetRanges = [
    { label: 'Today', start: format(new Date(), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') },
    { label: '7 days', start: format(subDays(new Date(), 7), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') },
    { label: '30 days', start: format(subDays(new Date(), 30), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') },
  ];

  return (
    <div className="bg-wa-panel border-b border-gray-700 p-4 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search messages..."
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          className="w-full bg-wa-incoming border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-wa-teal transition-colors"
        />
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-3">
        {/* Sender Filter */}
        <div className="flex-1 min-w-[150px]">
          <select
            value={filters.sender}
            onChange={(e) => onFilterChange({ ...filters, sender: e.target.value })}
            className="w-full bg-wa-incoming border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-wa-teal"
          >
            <option value="">All Senders</option>
            {senders.map((sender) => (
              <option key={sender} value={sender}>
                {sender}
              </option>
            ))}
          </select>
        </div>

        {/* Message Type Filter */}
        <div className="flex-1 min-w-[150px]">
          <select
            value={filters.messageType}
            onChange={(e) => onFilterChange({ ...filters, messageType: e.target.value })}
            className="w-full bg-wa-incoming border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-wa-teal"
          >
            <option value="">All Types</option>
            {messageTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-wa-incoming border border-gray-700 rounded-lg px-2">
            <Calendar size={14} className="text-gray-400" />
            <input
              type="date"
              value={filters.dateStart}
              onChange={(e) => onFilterChange({ ...filters, dateStart: e.target.value })}
              className="bg-transparent border-none py-2 text-white text-sm focus:outline-none w-32"
            />
          </div>
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={filters.dateEnd}
            onChange={(e) => onFilterChange({ ...filters, dateEnd: e.target.value })}
            className="bg-wa-incoming border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-wa-teal w-36"
          />
        </div>

        {/* Quick Date Presets */}
        <div className="flex items-center gap-1">
          {presetRanges.map((range) => (
            <button
              key={range.label}
              onClick={() =>
                onFilterChange({ ...filters, dateStart: range.start, dateEnd: range.end })
              }
              className="px-3 py-2 text-xs bg-wa-incoming hover:bg-wa-teal/20 text-gray-300 hover:text-white rounded-lg transition-colors"
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Filter size={12} />
          <span>
            Filters active:
            {filters.search && ` search "${filters.search}"`}
            {filters.sender && ` sender: ${filters.sender}`}
            {filters.messageType && ` type: ${filters.messageType}`}
            {(filters.dateStart || filters.dateEnd) &&
              ` date: ${filters.dateStart || '...'} to ${filters.dateEnd || '...'}`}
          </span>
        </div>
      )}
    </div>
  );
};

export default MessageFilter;
