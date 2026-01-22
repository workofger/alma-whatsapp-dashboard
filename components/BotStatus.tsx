import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, getSupabaseConfig } from '../services/supabase';
import { Activity, Clock, MessageSquare, Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow, differenceInMinutes } from 'date-fns';

interface BotStatusData {
  lastMessageAt: Date | null;
  messagesLastHour: number;
  messagesLastDay: number;
  isOnline: boolean;
}

const BotStatus: React.FC = () => {
  const [status, setStatus] = useState<BotStatusData>({
    lastMessageAt: null,
    messagesLastHour: 0,
    messagesLastDay: 0,
    isOnline: false,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase not configured');
      setLoading(false);
      return;
    }

    setError(null);

    try {
      // Get the most recent message
      const { data: lastMessage, error: lastMsgError } = await supabase
        .from('messages')
        .select('message_timestamp')
        .order('message_timestamp', { ascending: false })
        .limit(1)
        .single();

      if (lastMsgError && lastMsgError.code !== 'PGRST116') {
        throw lastMsgError;
      }

      // Get messages count for last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count: hourCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .gte('message_timestamp', oneHourAgo);

      // Get messages count for last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: dayCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .gte('message_timestamp', oneDayAgo);

      const lastMsgTime = lastMessage?.message_timestamp
        ? new Date(lastMessage.message_timestamp)
        : null;

      // Consider bot online if last message was within 15 minutes
      const isOnline = lastMsgTime
        ? differenceInMinutes(new Date(), lastMsgTime) < 15
        : false;

      setStatus({
        lastMessageAt: lastMsgTime,
        messagesLastHour: hourCount || 0,
        messagesLastDay: dayCount || 0,
        isOnline,
      });
    } catch (err: any) {
      console.error('Error fetching bot status:', err);
      setError(err.message || 'Connection error');
    } finally {
      setLoading(false);
      setLastUpdate(new Date());
    }
  };

  useEffect(() => {
    fetchStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Show error state if Supabase not configured
  if (error) {
    return (
      <div className="bg-wa-panel border border-red-800/50 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-400 mb-2">
          <AlertTriangle size={18} />
          <span className="font-semibold text-sm">Connection Error</span>
        </div>
        <p className="text-xs text-gray-400 mb-2">{error}</p>
        <p className="text-xs text-gray-500">
          Check environment variables in Vercel
        </p>
      </div>
    );
  }

  return (
    <div className="bg-wa-panel border border-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Activity size={18} className="text-wa-teal" />
          Bot Status
        </h3>
        <button
          onClick={() => {
            setLoading(true);
            fetchStatus();
          }}
          className="p-1.5 rounded hover:bg-wa-incoming transition-colors"
          title="Refresh"
        >
          <RefreshCw size={14} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Online Status */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-wa-incoming/50">
        {status.isOnline ? (
          <>
            <div className="relative">
              <Wifi size={24} className="text-green-400" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
            </div>
            <div>
              <div className="font-medium text-green-400">Online</div>
              <div className="text-xs text-gray-400">Bot is receiving messages</div>
            </div>
          </>
        ) : (
          <>
            <WifiOff size={24} className="text-yellow-400" />
            <div>
              <div className="font-medium text-yellow-400">Idle</div>
              <div className="text-xs text-gray-400">No recent activity</div>
            </div>
          </>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Last Message */}
        <div className="p-3 rounded-lg bg-wa-incoming/30">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Clock size={12} />
            <span className="text-xs">Last Message</span>
          </div>
          <div className="font-medium text-white text-sm">
            {status.lastMessageAt
              ? formatDistanceToNow(status.lastMessageAt, { addSuffix: true })
              : 'N/A'}
          </div>
        </div>

        {/* Messages/Hour */}
        <div className="p-3 rounded-lg bg-wa-incoming/30">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <MessageSquare size={12} />
            <span className="text-xs">Last Hour</span>
          </div>
          <div className="font-medium text-white text-sm">
            {status.messagesLastHour.toLocaleString()} msgs
          </div>
        </div>

        {/* Messages/Day */}
        <div className="col-span-2 p-3 rounded-lg bg-wa-incoming/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              <Activity size={12} />
              <span className="text-xs">Last 24 Hours</span>
            </div>
            <div className="font-medium text-wa-teal">
              {status.messagesLastDay.toLocaleString()} messages
            </div>
          </div>
          {/* Rate bar */}
          <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-wa-teal rounded-full transition-all"
              style={{
                width: `${Math.min((status.messagesLastDay / 1000) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500 text-center">
        Updated {formatDistanceToNow(lastUpdate, { addSuffix: true })}
      </div>
    </div>
  );
};

export default BotStatus;
