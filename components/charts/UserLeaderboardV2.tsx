import React from 'react';
import { Crown, Medal, Award, MessageSquare, Clock } from 'lucide-react';
import { UserActivity } from '../../services/analyticsService';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  users: UserActivity[];
  title?: string;
}

const UserLeaderboardV2: React.FC<Props> = ({ users, title = 'Top Contributors' }) => {
  // Get display name for user
  const getDisplayName = (user: UserActivity): string => {
    return user.sender_pushname || user.sender_number || user.sender_lid || user.sender_id;
  };

  // Get display ID for subtitle
  const getDisplayId = (user: UserActivity): string => {
    if (user.sender_number) return user.sender_number;
    if (user.sender_lid) return `LID: ${user.sender_lid.substring(0, 8)}...`;
    return user.sender_id.substring(0, 15) + '...';
  };

  // Rank icon component
  const RankIcon: React.FC<{ rank: number }> = ({ rank }) => {
    switch (rank) {
      case 1:
        return <Crown className="text-yellow-400" size={18} />;
      case 2:
        return <Medal className="text-gray-300" size={18} />;
      case 3:
        return <Award className="text-amber-600" size={18} />;
      default:
        return (
          <span className="text-gray-500 font-mono text-sm w-[18px] text-center">
            {rank}
          </span>
        );
    }
  };

  const maxMessages = users[0]?.message_count || 1;

  return (
    <div className="bg-wa-panel p-6 rounded-lg border border-gray-800">
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      <div className="space-y-3">
        {users.map((user, index) => {
          const percentage = (user.message_count / maxMessages) * 100;
          
          return (
            <div
              key={user.sender_id}
              className="relative p-3 rounded-lg bg-wa-incoming/30 hover:bg-wa-incoming/50 transition-all cursor-pointer group"
            >
              {/* Progress bar background */}
              <div
                className="absolute inset-0 rounded-lg bg-wa-teal/10 transition-all"
                style={{ width: `${percentage}%` }}
              />
              
              <div className="relative flex items-center gap-3">
                {/* Rank */}
                <div className="w-6 flex justify-center">
                  <RankIcon rank={index + 1} />
                </div>
                
                {/* Avatar placeholder */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-wa-teal to-emerald-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">
                    {getDisplayName(user).charAt(0).toUpperCase()}
                  </span>
                </div>
                
                {/* User info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-200 truncate">
                    {getDisplayName(user)}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {getDisplayId(user)}
                  </p>
                </div>
                
                {/* Stats */}
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5 text-wa-teal font-semibold">
                    <MessageSquare size={14} />
                    <span>{user.message_count.toLocaleString()}</span>
                  </div>
                  {user.last_message_at && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={10} />
                      <span>
                        {formatDistanceToNow(new Date(user.last_message_at), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserLeaderboardV2;
