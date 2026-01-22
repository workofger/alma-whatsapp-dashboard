import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchMessages, fetchGroups } from '../services/dataService';
import { Message, GroupStats } from '../types';
import MessageBubble from '../components/Chat/MessageBubble';
import MessageFilter, { FilterState } from '../components/Chat/MessageFilter';
import { Loader2, ArrowLeft, ChevronDown, Filter, X } from 'lucide-react';
import { getUserDisplayName, getUserDisplayId } from '../services/userUtils';

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      const [msgs, groups] = await Promise.all([fetchMessages(id), fetchGroups()]);
      setAllMessages(msgs);
      setGroupInfo(groups.find((g) => g.group_id === id) || null);
      setLoading(false);
    };
    load();
  }, [id]);

  // Extract unique senders and message types for filters
  const { senders, messageTypes } = useMemo(() => {
    const senderSet = new Set<string>();
    const typeSet = new Set<string>();

    allMessages.forEach((m) => {
      // Use display name for consistent sender identification
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
      // Search filter - search in body, name, number, and LID
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesBody = m.body?.toLowerCase().includes(searchLower);
        const matchesSender =
          m.sender_pushname?.toLowerCase().includes(searchLower) ||
          m.sender_number?.includes(searchLower) ||
          m.sender_lid?.includes(searchLower);
        if (!matchesBody && !matchesSender) return false;
      }

      // Sender filter - use display name for matching
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

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + MESSAGES_PER_PAGE, filteredMessages.length));
  }, [filteredMessages.length]);

  const clearFilters = () => {
    setFilters(initialFilters);
    setVisibleCount(MESSAGES_PER_PAGE);
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="animate-spin text-wa-teal" size={48} />
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
          <h2 className="text-lg font-bold text-white">{groupInfo?.group_name || 'Unknown Group'}</h2>
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
        className="flex-1 overflow-y-auto p-4 space-y-2 chat-bg"
      >
        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center mb-4">
            <button
              onClick={loadMore}
              className="flex items-center gap-2 px-4 py-2 bg-wa-incoming hover:bg-wa-incoming/80 text-gray-300 rounded-full text-sm transition-colors"
            >
              <ChevronDown size={16} />
              Load {Math.min(MESSAGES_PER_PAGE, filteredMessages.length - visibleCount)} more messages
            </button>
          </div>
        )}

        {visibleMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            {filters.search || filters.sender || filters.messageType || filters.dateStart || filters.dateEnd
              ? 'No messages match your filters.'
              : 'No messages found.'}
          </div>
        ) : (
          <>
            {visibleMessages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} allMessages={allMessages} />
            ))}
            <div ref={bottomRef} />
          </>
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

export default GroupChat;
