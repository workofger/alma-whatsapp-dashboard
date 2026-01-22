import React, { useState, useEffect } from 'react';
import { fetchGroups, fetchMessages } from '../services/dataService';
import { generateGroupSummary, isOpenAIConfigured } from '../services/openaiService';
import { GroupStats } from '../types';
import { Bot, Sparkles, AlertCircle, Calendar, RefreshCw } from 'lucide-react';

type SummaryType = 'daily' | 'weekly';

const Summaries: React.FC = () => {
  const [groups, setGroups] = useState<GroupStats[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [summaryType, setSummaryType] = useState<SummaryType>('daily');
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiConfigured, setApiConfigured] = useState(false);

  useEffect(() => {
    setApiConfigured(isOpenAIConfigured());
    fetchGroups().then((data) => {
      setGroups(data);
      if (data.length > 0) setSelectedGroupId(data[0].group_id);
    });
  }, []);

  const handleGenerate = async () => {
    if (!selectedGroupId) return;

    setLoading(true);
    setError(null);
    setSummary('');

    try {
      const messages = await fetchMessages(selectedGroupId);
      if (messages.length === 0) {
        setError('No messages found to summarize.');
        setLoading(false);
        return;
      }

      const groupName = groups.find((g) => g.group_id === selectedGroupId)?.group_name || 'Unknown';
      const result = await generateGroupSummary(groupName, messages, summaryType);
      setSummary(result);
    } catch (err) {
      setError('Failed to generate summary. Please check your API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center space-x-3 mb-6">
        <Bot size={32} className="text-wa-teal" />
        <div>
          <h2 className="text-2xl font-bold">AI Summaries</h2>
          <p className="text-sm text-gray-400">Powered by OpenAI GPT-4</p>
        </div>
      </div>

      <div className="bg-wa-panel p-6 rounded-lg border border-gray-800 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Select Group
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full bg-wa-incoming border border-gray-700 text-white rounded-md px-4 py-2.5 focus:outline-none focus:border-wa-teal transition-colors"
            >
              {groups.map((g) => (
                <option key={g.group_id} value={g.group_id}>
                  {g.group_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Summary Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSummaryType('daily')}
                className={`flex-1 px-4 py-2.5 rounded-md flex items-center justify-center gap-2 transition-colors ${
                  summaryType === 'daily'
                    ? 'bg-wa-teal text-white'
                    : 'bg-wa-incoming text-gray-400 hover:bg-wa-incoming/70'
                }`}
              >
                <Calendar size={16} />
                Daily
              </button>
              <button
                onClick={() => setSummaryType('weekly')}
                className={`flex-1 px-4 py-2.5 rounded-md flex items-center justify-center gap-2 transition-colors ${
                  summaryType === 'weekly'
                    ? 'bg-wa-teal text-white'
                    : 'bg-wa-incoming text-gray-400 hover:bg-wa-incoming/70'
                }`}
              >
                <Calendar size={16} />
                Weekly
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !apiConfigured}
          className={`w-full px-6 py-3 rounded-md font-bold flex items-center justify-center space-x-2 transition-all ${
            loading || !apiConfigured
              ? 'bg-gray-700 cursor-not-allowed text-gray-400'
              : 'bg-wa-teal hover:bg-wa-teal/90 text-white'
          }`}
        >
          {loading ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              <span>Generating Summary...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Generate {summaryType === 'daily' ? 'Daily' : 'Weekly'} Summary</span>
            </>
          )}
        </button>

        {!apiConfigured && (
          <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-800 text-yellow-200 text-sm rounded flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">OpenAI API Key Required</p>
              <p className="text-yellow-300/80 mt-1">
                To use AI summaries, set the <code className="bg-yellow-900/50 px-1 rounded">VITE_OPENAI_API_KEY</code> environment variable.
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-900 text-red-200 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {summary && (
        <div className="bg-wa-panel p-8 rounded-lg border border-gray-800 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Bot size={150} />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xl font-bold text-wa-teal">
                {summaryType === 'daily' ? 'Daily' : 'Weekly'} Summary
              </h3>
              <span className="text-xs bg-wa-teal/20 text-wa-teal px-2 py-1 rounded">
                {groups.find((g) => g.group_id === selectedGroupId)?.group_name}
              </span>
            </div>
            <div className="prose prose-invert max-w-none whitespace-pre-line text-gray-300 leading-relaxed">
              {summary}
            </div>
            <div className="mt-8 pt-4 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
              <span>Generated by OpenAI GPT-4o-mini</span>
              <span>Alma Dashboard</span>
            </div>
          </div>
        </div>
      )}

      {/* Info card */}
      <div className="mt-8 bg-wa-incoming/30 p-6 rounded-lg border border-gray-800">
        <h4 className="font-bold text-gray-200 mb-2">About AI Summaries</h4>
        <p className="text-sm text-gray-400 leading-relaxed">
          AI Summaries analyze the last 100 messages from a group and provide
          key insights including main topics discussed, important decisions,
          action items, and participation patterns. Summaries are generated
          on-demand and are not stored.
        </p>
      </div>
    </div>
  );
};

export default Summaries;
