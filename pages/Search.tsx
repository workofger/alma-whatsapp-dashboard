import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, Loader2, Filter, X, MessageSquare, Calendar, User, ArrowRight } from 'lucide-react';
import { searchMessages } from '../services/analyticsService';
import { fetchGroups } from '../services/dataService';
import { GroupStats, Message } from '../types';
import { getUserDisplayName, getUserDisplayId } from '../services/userUtils';
import { format } from 'date-fns';

const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Message[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [groups, setGroups] = useState<GroupStats[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const LIMIT = 50;

  useEffect(() => {
    fetchGroups().then(setGroups);
  }, []);

  const handleSearch = useCallback(async (resetPage = true) => {
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    const currentPage = resetPage ? 0 : page;
    if (resetPage) setPage(0);

    try {
      const { messages, total: totalCount } = await searchMessages(query, {
        groupId: selectedGroup || undefined,
        limit: LIMIT,
        offset: currentPage * LIMIT,
      });

      if (resetPage) {
        setResults(messages);
      } else {
        setResults((prev) => [...prev, ...messages]);
      }
      setTotal(totalCount);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [query, selectedGroup, page]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(true);
    }
  };

  const loadMore = () => {
    setPage((p) => p + 1);
  };

  useEffect(() => {
    if (page > 0) {
      handleSearch(false);
    }
  }, [page]);

  // Highlight search term in text
  const highlightText = (text: string, term: string) => {
    if (!term.trim()) return text;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-500/30 text-yellow-200 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getGroupName = (groupId: string) => {
    const group = groups.find((g) => g.group_id === groupId);
    return group?.group_name || groupId;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Search Messages</h2>
        <p className="text-gray-400 text-sm mt-1">
          Search across all your WhatsApp groups
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-wa-panel rounded-lg border border-gray-800 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              size={20}
            />
            <input
              type="text"
              placeholder="Search for keywords, phrases, or mentions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-4 py-3 bg-wa-incoming border border-gray-700 rounded-lg focus:outline-none focus:border-wa-teal focus:ring-1 focus:ring-wa-teal text-gray-200 placeholder-gray-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-lg border transition-colors flex items-center gap-2 ${
              showFilters || selectedGroup
                ? 'bg-wa-teal/20 border-wa-teal text-wa-teal'
                : 'bg-wa-incoming border-gray-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            <Filter size={18} />
            Filters
            {selectedGroup && (
              <span className="bg-wa-teal text-white text-xs px-2 py-0.5 rounded-full">
                1
              </span>
            )}
          </button>
          <button
            onClick={() => handleSearch(true)}
            disabled={!query.trim() || loading}
            className="px-6 py-3 bg-wa-teal text-white rounded-lg hover:bg-wa-teal/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <SearchIcon size={18} />}
            Search
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-gray-500 mb-1">Filter by Group</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full px-3 py-2 bg-wa-incoming border border-gray-700 rounded-lg focus:outline-none focus:border-wa-teal text-gray-200"
                >
                  <option value="">All Groups</option>
                  {groups.map((g) => (
                    <option key={g.group_id} value={g.group_id}>
                      {g.group_name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedGroup && (
                <button
                  onClick={() => setSelectedGroup('')}
                  className="self-end px-3 py-2 text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <X size={14} />
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {searched && (
        <div className="space-y-4">
          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-gray-400">
              {loading ? (
                'Searching...'
              ) : (
                <>
                  Found <span className="text-wa-teal font-semibold">{total.toLocaleString()}</span>{' '}
                  {total === 1 ? 'message' : 'messages'}
                  {query && (
                    <>
                      {' '}matching "<span className="text-gray-200">{query}</span>"
                    </>
                  )}
                </>
              )}
            </p>
          </div>

          {/* Results List */}
          {results.length > 0 ? (
            <div className="space-y-3">
              {results.map((message, idx) => (
                <div
                  key={`${message.message_id}-${idx}`}
                  className="bg-wa-panel border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Sender */}
                      <div className="flex items-center gap-2 mb-2">
                        <User size={14} className="text-gray-500" />
                        <span className="font-medium text-wa-teal">
                          {getUserDisplayName(message)}
                        </span>
                        <span className="text-xs text-gray-600">
                          {getUserDisplayId(message)}
                        </span>
                      </div>

                      {/* Message Body */}
                      <p className="text-gray-200 leading-relaxed break-words">
                        {highlightText(message.body || '<Media>', query)}
                      </p>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <MessageSquare size={12} />
                          <Link
                            to={`/groups/${message.group_id}`}
                            className="hover:text-wa-teal transition-colors"
                          >
                            {getGroupName(message.group_id)}
                          </Link>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          {format(new Date(message.message_timestamp), 'MMM d, yyyy HH:mm')}
                        </div>
                        <span className="px-2 py-0.5 bg-gray-800 rounded text-gray-400">
                          {message.message_type || 'text'}
                        </span>
                      </div>
                    </div>

                    {/* View in context */}
                    <Link
                      to={`/groups/${message.group_id}`}
                      className="flex-shrink-0 p-2 text-gray-500 hover:text-wa-teal hover:bg-wa-incoming rounded-lg transition-colors"
                      title="View in context"
                    >
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              ))}

              {/* Load More */}
              {results.length < total && (
                <div className="text-center pt-4">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-3 bg-wa-incoming border border-gray-700 text-gray-300 rounded-lg hover:bg-wa-incoming/80 disabled:opacity-50 transition-colors"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="animate-spin" size={16} />
                        Loading...
                      </span>
                    ) : (
                      `Load more (${results.length} of ${total})`
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : !loading ? (
            <div className="bg-wa-panel border border-gray-800 rounded-lg p-12 text-center">
              <SearchIcon size={48} className="mx-auto text-gray-700 mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">No messages found</h3>
              <p className="text-gray-500 text-sm">
                Try different keywords or remove filters to broaden your search
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* Initial State */}
      {!searched && (
        <div className="bg-wa-panel border border-gray-800 rounded-lg p-12 text-center">
          <SearchIcon size={48} className="mx-auto text-gray-700 mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">Search your conversations</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Find specific messages, mentions, or keywords across all your WhatsApp groups.
            Use filters to narrow down your search.
          </p>
        </div>
      )}
    </div>
  );
};

export default Search;
