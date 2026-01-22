import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchGroups } from '../services/dataService';
import { GroupStats } from '../types';
import { Users, MessageSquare, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const GroupList = () => {
  const [groups, setGroups] = useState<GroupStats[]>([]);

  useEffect(() => {
    fetchGroups().then(setGroups);
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Monitored Groups</h2>
      <div className="grid gap-4">
        {groups.map((group) => (
          <Link 
            key={group.group_id} 
            to={`/groups/${group.group_id}`}
            className="bg-wa-panel p-5 rounded-lg border border-gray-800 hover:border-wa-teal transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-xl">
                    👥
                </div>
                <div>
                    <h3 className="font-bold text-lg text-white">{group.group_name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                        <span className="flex items-center"><Users size={14} className="mr-1"/> {group.member_count} Members</span>
                        <span className="flex items-center"><MessageSquare size={14} className="mr-1"/> {group.total_messages} Messages</span>
                    </div>
                </div>
            </div>
            <div className="text-right">
                <div className="text-xs text-gray-500 mb-2">
                    Active {group.last_activity ? formatDistanceToNow(new Date(group.last_activity)) + ' ago' : 'N/A'}
                </div>
                <ChevronRight className="ml-auto text-gray-600 group-hover:text-wa-teal" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default GroupList;
