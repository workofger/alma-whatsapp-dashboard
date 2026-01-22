import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchGroups } from '../services/dataService';
import { GroupStats } from '../types';
import { Users, MessageSquare, ChevronRight, Loader2, MessageCircle, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import EmptyState from '../components/EmptyState';

const GroupList: React.FC = () => {
  const [groups, setGroups] = useState<GroupStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchGroups()
      .then(setGroups)
      .finally(() => setLoading(false));
  }, []);

  const filteredGroups = groups.filter((g) =>
    g.group_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-wa-teal" size={48} />
        <p className="text-gray-400">Loading groups...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Monitored Groups</h2>
          <p className="text-sm text-gray-500 mt-1">
            {groups.length} group{groups.length !== 1 ? 's' : ''} being monitored
          </p>
        </div>

        {/* Search */}
        {groups.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-wa-incoming border border-gray-700 rounded-lg focus:outline-none focus:border-wa-teal text-gray-200 placeholder-gray-500 w-full sm:w-64"
            />
          </div>
        )}
      </div>

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <div className="bg-wa-panel rounded-lg border border-gray-800">
          <EmptyState
            icon={MessageCircle}
            title="No groups found"
            description="The bot hasn't captured any WhatsApp groups yet. Make sure the bot is running and connected to WhatsApp."
          />
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-wa-panel rounded-lg border border-gray-800">
          <EmptyState
            icon={Search}
            title="No matching groups"
            description={`No groups match "${searchTerm}". Try a different search term.`}
            action={{
              label: 'Clear search',
              onClick: () => setSearchTerm(''),
            }}
          />
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredGroups.map((group) => (
            <Link
              key={group.group_id}
              to={`/groups/${group.group_id}`}
              className="bg-wa-panel p-5 rounded-lg border border-gray-800 hover:border-wa-teal/50 hover:shadow-lg hover:shadow-wa-teal/5 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                {/* Avatar */}
                <div className="w-12 h-12 bg-gradient-to-br from-wa-teal to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-white font-bold text-lg">
                    {group.group_name?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-white truncate group-hover:text-wa-teal transition-colors">
                    {group.group_name}
                  </h3>
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mt-1">
                    <span className="flex items-center">
                      <Users size={14} className="mr-1.5" />
                      {group.member_count} members
                    </span>
                    <span className="flex items-center">
                      <MessageSquare size={14} className="mr-1.5" />
                      {group.total_messages?.toLocaleString()} messages
                    </span>
                  </div>
                </div>
              </div>

              {/* Activity & Arrow */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-gray-500">
                    {group.last_activity
                      ? `Active ${formatDistanceToNow(new Date(group.last_activity))} ago`
                      : 'No recent activity'}
                  </div>
                </div>
                <ChevronRight
                  size={20}
                  className="text-gray-600 group-hover:text-wa-teal group-hover:translate-x-1 transition-all"
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupList;
