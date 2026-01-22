import React, { useEffect, useState } from 'react';
import { fetchGhosts } from '../services/dataService';
import { GhostUser } from '../types';
import { Ghost, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Ghosts = () => {
  const [ghosts, setGhosts] = useState<GhostUser[]>([]);

  useEffect(() => {
    fetchGhosts().then(setGhosts);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Ghost className="text-wa-teal" /> 
            Ghost Users
          </h2>
          <span className="text-sm text-gray-500">Users inactive for 30+ days</span>
      </div>

      <div className="bg-wa-panel rounded-lg border border-gray-800 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-wa-incoming text-gray-400 text-xs uppercase font-semibold">
                <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Group</th>
                    <th className="px-6 py-4">Last Active</th>
                    <th className="px-6 py-4 text-right">Inactive Days</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
                {ghosts.map((ghost, idx) => (
                    <tr key={idx} className="hover:bg-wa-incoming/30 transition-colors">
                        <td className="px-6 py-4">
                            <div className="font-medium text-white">{ghost.user_pushname || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">{ghost.user_number}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{ghost.group_name}</td>
                        <td className="px-6 py-4 text-gray-400 text-sm flex items-center gap-2">
                            <Clock size={14} />
                            {ghost.last_message_at ? formatDistanceToNow(new Date(ghost.last_message_at)) + ' ago' : 'Never'}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-red-400 font-bold">
                            {ghost.days_inactive}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        {ghosts.length === 0 && (
            <div className="p-8 text-center text-gray-500">
                No ghost users found. Everyone is active! 🎉
            </div>
        )}
      </div>
    </div>
  );
};

export default Ghosts;
