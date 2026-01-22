import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchMessages, fetchGroups } from '../services/dataService';
import { subscribeToMessages, unsubscribe } from '../services/supabase';
import { Message, GroupStats } from '../types';
import MessageBubble from '../components/Chat/MessageBubble';
import MessageFilter, { FilterState } from '../components/Chat/MessageFilter';
import { Loader2, ArrowLeft, ChevronUp, Filter, X, Wifi, WifiOff, Bell } from 'lucide-react';
import { getUserDisplayName } from '../services/userUtils';

const MESSAGES_PER_PAGE = 50;

const initialFilters: FilterState = {
  search: '',
  sender: '',
  messageType: '',
  dateStart: '',
  dateEnd: '',
};

const GroupChat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [groupInfo, setGroupInfo] = useState<GroupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(MESSAGES_PER_PAGE);
  const [isConnected, setIsConnected] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Load messages and subscribe to realtime updates
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      const [msgs, groups] = await Promise.all([fetchMessages(id), fetchGroups()]);
      setAllMessages(msgs);
      setGroupInfo(groups.find((g) => g.group_id === id) || null);
      setLoading(false);
    };

    load();

    // Subscribe to realtime messages
    const channel = subscribeToMessages(id, (payload) => {
      const newMessage = payload.new as Message;
      setAllMessages((prev) => {
        // Check if message already exists
        if (prev.some((m) => m.message_id === newMessage.message_id)) {
          return prev;
        }
        // Add to the end (newest)
        return [...prev, newMessage];
      });
      setNewMessageCount((prev) => prev + 1);
      setIsConnected(true);
    });

    setIsConnected(true);

    return () => {
      unsubscribe(channel);
      setIsConnected(false);
    };
  }, [id]);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredMessages.length) {
          setVisibleCount((prev) => Math.min(prev + MESSAGES_PER_PAGE, filteredMessages.length));
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [visibleCount]);

  // Extract unique senders and message types for filters
  const { senders, messageTypes } = useMemo(() => {
    const senderSet = new Set<string>();
    const typeSet = new Set<string>();

    allMessages.forEach((m) => {
      const sender = getUserDisplayName(m);
      senderSet.add(sender);
      typeSet.add(m.message_type);
    });

    return {
      senders: Array.from(senderSet).sort(),
      messageTypes: Array.from(typeSet).sort(),
    };
  }, [allMessages]);

  // Filter messages
  const filteredMessages = useMemo(() => {
    return allMessages.filter((m) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesBody = m.body?.toLowerCase().includes(searchLower);
        const matchesSender =
          m.sender_pushname?.toLowerCase().includes(searchLower) ||
          m.sender_number?.includes(searchLower) ||
          m.sender_lid?.includes(searchLower);
        if (!matchesBody && !matchesSender) return false;
      }

      // Sender filter
      if (filters.sender) {
        const sender = getUserDisplayName(m);
        if (sender !== filters.sender) return false;
      }

      // Message type filter
      if (filters.messageType && m.message_type !== filters.messageType) {
        return false;
      }

      // Date range filter
      if (filters.dateStart || filters.dateEnd) {
        const msgDate = new Date(m.message_timestamp);
        if (filters.dateStart && msgDate < new Date(filters.dateStart)) return false;
        if (filters.dateEnd && msgDate > new Date(filters.dateEnd + 'T23:59:59')) return false;
      }

      return true;
    });
  }, [allMessages, filters]);

  // Paginated messages
  const visibleMessages = useMemo(() => {
    return filteredMessages.slice(0, visibleCount);
  }, [filteredMessages, visibleCount]);

  const hasMore = visibleCount < filteredMessages.length;

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!loading && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [loading]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewMessageCount(0);
  }, []);

  const clearFilters = () => {
    setFilters(initialFilters);
    setVisibleCount(MESSAGES_PER_PAGE);
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-wa-teal" size={48} />
        <p className="text-gray-400">Loading conversation...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col bg-wa-dark-paper border border-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-wa-panel p-4 flex items-center border-b border-gray-700">
        <Link to="/groups" className="mr-4 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">{groupInfo?.group_name || 'Unknown Group'}</h2>
            {isConnected && (
              <span className="flex items-center gap-1 text-xs text-green-400" title="Connected to realtime updates">
                <Wifi size={12} />
                <span className="hidden sm:inline">Live</span>
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            {groupInfo?.member_count} members • {filteredMessages.length} messages
            {filteredMessages.length !== allMessages.length && ` (filtered from ${allMessages.length})`}
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-lg transition-colors ${
            showFilters ? 'bg-wa-teal text-white' : 'text-gray-400 hover:bg-wa-incoming hover:text-white'
          }`}
        >
          {showFilters ? <X size={20} /> : <Filter size={20} />}
        </button>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <MessageFilter
          filters={filters}
          onFilterChange={setFilters}
          senders={senders}
          messageTypes={messageTypes}
          onClear={clearFilters}
        />
      )}

      {/* Chat Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 chat-bg relative"
      >
        {/* Load More Trigger (infinite scroll) */}
        {hasMore && (
          <div ref={loadMoreRef} className="flex justify-center py-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Loader2 className="animate-spin" size={16} />
              Loading more messages...
            </div>
          </div>
        )}

        {visibleMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-500 gap-2">
            <MessageSquareEmpty />
            {filters.search || filters.sender || filters.messageType || filters.dateStart || filters.dateEnd ? (
              <>
                <p>No messages match your filters</p>
                <button
                  onClick={clearFilters}
                  className="mt-2 text-sm text-wa-teal hover:underline"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <p>No messages in this conversation yet</p>
            )}
          </div>
        ) : (
          <>
            {visibleMessages.map((msg, idx) => (
              <MessageBubble
                key={`${msg.message_id}-${idx}`}
                message={msg}
                allMessages={allMessages}
                highlightTerm={filters.search}
              />
            ))}
            <div ref={bottomRef} />
          </>
        )}

        {/* New Message Indicator */}
        {newMessageCount > 0 && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-24 right-8 flex items-center gap-2 px-4 py-2 bg-wa-teal text-white rounded-full shadow-lg hover:bg-wa-teal/90 transition-all animate-bounce"
          >
            <Bell size={16} />
            {newMessageCount} new message{newMessageCount > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Footer Stats */}
      <div className="bg-wa-panel px-4 py-2 border-t border-gray-700 text-xs text-gray-500 flex justify-between">
        <span>
          Showing {visibleMessages.length} of {filteredMessages.length} messages
        </span>
        <span>
          {allMessages.length > 0 &&
            `${new Date(allMessages[0].message_timestamp).toLocaleDateString()} - ${new Date(
              allMessages[allMessages.length - 1].message_timestamp
            ).toLocaleDateString()}`}
        </span>
      </div>
    </div>
  );
};

// Empty state icon
const MessageSquareEmpty = () => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="opacity-30"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <line x1="9" y1="10" x2="15" y2="10" />
  </svg>
);

export default GroupChat;
