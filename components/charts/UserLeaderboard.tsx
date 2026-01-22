import React, { useMemo } from 'react';
import { Message } from '../../types';
import { Trophy, Medal, Award, TrendingUp, MessageSquare } from 'lucide-react';

interface UserLeaderboardProps {
  messages: Message[];
  limit?: number;
}

interface UserStats {
  name: string;
  number: string;
  messageCount: number;
  percentage: number;
}

const UserLeaderboard: React.FC<UserLeaderboardProps> = ({ messages, limit = 10 }) => {
  const leaderboard = useMemo(() => {
    const userCounts = new Map<string, { name: string; number: string; count: number }>();

    messages.forEach((m) => {
      const key = m.sender_id;
      const current = userCounts.get(key) || {
        name: m.sender_pushname || m.sender_name || 'Unknown',
        number: m.sender_number || '',
        count: 0,
      };
      current.count++;
      userCounts.set(key, current);
    });

    const totalMessages = messages.length;
    const sorted = Array.from(userCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((user) => ({
        name: user.name,
        number: user.number,
        messageCount: user.count,
        percentage: totalMessages > 0 ? (user.count / totalMessages) * 100 : 0,
      }));

    return sorted;
  }, [messages, limit]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="text-yellow-400" size={20} />;
      case 1:
        return <Medal className="text-gray-300" size={20} />;
      case 2:
        return <Award className="text-amber-600" size={20} />;
      default:
        return <span className="text-gray-500 w-5 text-center text-sm">{index + 1}</span>;
    }
  };

  const maxCount = leaderboard[0]?.messageCount || 1;

  return (
    <div className="bg-wa-panel p-6 rounded-lg border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">Top Contributors</h3>
          <p className="text-sm text-gray-400">Most active users</p>
        </div>
        <TrendingUp className="text-wa-teal" size={24} />
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
          <p>No message data available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((user, index) => (
            <div
              key={user.number || index}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                index < 3 ? 'bg-wa-incoming/50' : 'hover:bg-wa-incoming/30'
              }`}
            >
              {/* Rank */}
              <div className="w-8 flex justify-center">{getRankIcon(index)}</div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white truncate">{user.name}</span>
                  {index === 0 && (
                    <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
                      TOP
                    </span>
                  )}
                </div>
                {/* Progress Bar */}
                <div className="mt-1.5 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-wa-teal rounded-full transition-all"
                    style={{ width: `${(user.messageCount / maxCount) * 100}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="text-right">
                <div className="font-bold text-white">{user.messageCount.toLocaleString()}</div>
                <div className="text-xs text-gray-400">{user.percentage.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between text-sm">
        <span className="text-gray-400">Total Users</span>
        <span className="text-white font-medium">{leaderboard.length}</span>
      </div>
    </div>
  );
};

export default UserLeaderboard;
