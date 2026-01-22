import React, { useState, useEffect, useRef } from 'react';
import { fetchGroups, fetchMessages, fetchGhosts, fetchMembers } from '../services/dataService';
import { fetchTopUsers } from '../services/analyticsService';
import {
  exportMessages,
  exportMembers,
  exportGhosts,
  generateFilename,
  ExportFormat,
} from '../services/exportService';
import { generatePdfReport } from '../services/pdfService';
import { GroupStats, Message, GroupMember, GhostUser } from '../types';
import {
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  MessageSquare,
  Users,
  Ghost,
  Calendar,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { format, subDays } from 'date-fns';

type DataType = 'messages' | 'members' | 'ghosts' | 'report';

const Export: React.FC = () => {
  const [groups, setGroups] = useState<GroupStats[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [dataType, setDataType] = useState<DataType>('messages');
  const [exportFormat, setExportFormat] = useState<ExportFormat | 'pdf'>('csv');
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchGroups().then(setGroups);
  }, []);

  // Auto-select PDF format for report type
  useEffect(() => {
    if (dataType === 'report') {
      setExportFormat('pdf');
    }
  }, [dataType]);

  const handleExport = async () => {
    setLoading(true);
    setSuccess(false);

    try {
      const groupName = groups.find((g) => g.group_id === selectedGroupId)?.group_name;

      if (dataType === 'report') {
        // Generate PDF report
        const [ghosts, topUsers] = await Promise.all([
          fetchGhosts(),
          fetchTopUsers(10),
        ]);

        const totalMessages = groups.reduce((sum, g) => sum + (g.total_messages || 0), 0);
        const totalMembers = groups.reduce((sum, g) => sum + (g.member_count || 0), 0);

        await generatePdfReport(
          {
            stats: {
              totalMessages,
              totalGroups: groups.length,
              totalMembers,
              ghostUsers: ghosts.length,
            },
            groups,
            topUsers,
          },
          {
            title: 'Alma Dashboard Report',
            includeCharts: false,
            includeUsers: true,
            includeGroups: true,
            dateRange: `${dateRange.start} to ${dateRange.end}`,
          }
        );
      } else if (dataType === 'messages') {
        let messages: Message[] = [];

        if (selectedGroupId === 'all') {
          // Fetch messages from all groups
          const allMessages = await Promise.all(
            groups.map((g) => fetchMessages(g.group_id))
          );
          messages = allMessages.flat();
        } else {
          messages = await fetchMessages(selectedGroupId);
        }

        // Filter by date range
        messages = messages.filter((m) => {
          const msgDate = new Date(m.message_timestamp);
          return (
            msgDate >= new Date(dateRange.start) &&
            msgDate <= new Date(dateRange.end + 'T23:59:59')
          );
        });

        const filename = generateFilename('messages', groupName);
        exportMessages(messages, { format: exportFormat as ExportFormat, filename });
      } else if (dataType === 'members') {
        let members: GroupMember[] = [];

        if (selectedGroupId === 'all') {
          const allMembers = await Promise.all(
            groups.map((g) => fetchMembers(g.group_id))
          );
          members = allMembers.flat();
        } else {
          members = await fetchMembers(selectedGroupId);
        }

        const filename = generateFilename('members', groupName);
        exportMembers(members, { format: exportFormat as ExportFormat, filename });
      } else {
        const ghosts: GhostUser[] = await fetchGhosts();
        const filename = generateFilename('ghost_users', undefined);
        exportGhosts(ghosts, { format: exportFormat as ExportFormat, filename });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setLoading(false);
    }
  };

  const dataTypeOptions = [
    { value: 'report', label: 'PDF Report', icon: FileText, description: 'Full dashboard report' },
    { value: 'messages', label: 'Messages', icon: MessageSquare, description: 'Export chat messages' },
    { value: 'members', label: 'Group Members', icon: Users, description: 'Export member data' },
    { value: 'ghosts', label: 'Ghost Users', icon: Ghost, description: 'Export inactive users' },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center space-x-3 mb-6">
        <Database size={32} className="text-wa-teal" />
        <div>
          <h2 className="text-2xl font-bold">Export Data</h2>
          <p className="text-sm text-gray-400">Download your data in CSV or JSON format</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Data Type Selection */}
        <div className="card">
          <h3 className="font-semibold text-gray-200 mb-4">Select Data Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dataTypeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setDataType(option.value)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  dataType === option.value
                    ? 'border-wa-teal bg-wa-teal/10'
                    : 'border-gray-700 hover:border-gray-600 bg-wa-incoming'
                }`}
              >
                <option.icon
                  size={24}
                  className={dataType === option.value ? 'text-wa-teal' : 'text-gray-400'}
                />
                <div className="mt-2 font-medium text-white">{option.label}</div>
                <div className="text-xs text-gray-400 mt-1">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Group Selection */}
        {dataType !== 'ghosts' && (
          <div className="card">
            <h3 className="font-semibold text-gray-200 mb-4">Select Group</h3>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="input w-full"
            >
              <option value="all">All Groups</option>
              {groups.map((g) => (
                <option key={g.group_id} value={g.group_id}>
                  {g.group_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date Range (for messages only) */}
        {dataType === 'messages' && (
          <div className="card">
            <h3 className="font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <Calendar size={18} />
              Date Range
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="input w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Format Selection */}
        {dataType !== 'report' && (
          <div className="card">
            <h3 className="font-semibold text-gray-200 mb-4">Export Format</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setExportFormat('csv')}
                className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                  exportFormat === 'csv'
                    ? 'border-wa-teal bg-wa-teal/10'
                    : 'border-gray-700 hover:border-gray-600 bg-wa-incoming'
                }`}
              >
                <FileSpreadsheet
                  size={24}
                  className={exportFormat === 'csv' ? 'text-wa-teal' : 'text-gray-400'}
                />
                <div className="text-left">
                  <div className="font-medium text-white">CSV</div>
                  <div className="text-xs text-gray-400">Spreadsheet compatible</div>
                </div>
              </button>
              <button
                onClick={() => setExportFormat('json')}
                className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                  exportFormat === 'json'
                    ? 'border-wa-teal bg-wa-teal/10'
                    : 'border-gray-700 hover:border-gray-600 bg-wa-incoming'
                }`}
              >
                <FileJson
                  size={24}
                  className={exportFormat === 'json' ? 'text-wa-teal' : 'text-gray-400'}
                />
                <div className="text-left">
                  <div className="font-medium text-white">JSON</div>
                  <div className="text-xs text-gray-400">Developer friendly</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* PDF Report Info */}
        {dataType === 'report' && (
          <div className="card bg-wa-teal/10 border-wa-teal">
            <div className="flex items-start gap-3">
              <FileText size={24} className="text-wa-teal flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white mb-1">PDF Report</h3>
                <p className="text-sm text-gray-300">
                  Generates a formatted PDF report including executive summary, 
                  top contributors, and all monitored groups with their statistics.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={loading}
          className={`w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
            loading
              ? 'bg-gray-700 cursor-not-allowed'
              : success
              ? 'bg-green-600'
              : 'bg-wa-teal hover:bg-wa-teal-dark'
          }`}
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Exporting...</span>
            </>
          ) : success ? (
            <>
              <CheckCircle size={20} />
              <span>Downloaded Successfully!</span>
            </>
          ) : (
            <>
              <Download size={20} />
              <span>Export {dataType === 'report' ? 'PDF Report' : dataType === 'messages' ? 'Messages' : dataType === 'members' ? 'Members' : 'Ghost Users'}</span>
            </>
          )}
        </button>

        {/* Info */}
        <div className="bg-wa-incoming/30 p-4 rounded-lg border border-gray-800">
          <p className="text-sm text-gray-400">
            <strong className="text-gray-300">Note:</strong> Exported files will be downloaded
            directly to your device. Large exports may take a moment to prepare.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Export;
