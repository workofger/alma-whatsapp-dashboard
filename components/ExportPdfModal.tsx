import React, { useState } from 'react';
import { X, FileDown, Loader2, Check, BarChart3, Users, MessageSquare, LucideIcon } from 'lucide-react';
import { generatePdfReport, ReportData, ReportOptions } from '../services/pdfService';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: ReportData;
  chartElement?: HTMLElement | null;
  dateRange?: string;
}

const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  reportData,
  chartElement,
  dateRange = 'Last 30 days',
}) => {
  const [options, setOptions] = useState<ReportOptions>({
    title: 'Alma Dashboard Report',
    includeCharts: true,
    includeUsers: true,
    includeGroups: true,
    dateRange,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    setSuccess(false);

    try {
      await generatePdfReport(
        { ...reportData, chartElement },
        options
      );
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-wa-panel border border-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-wa-teal/20 rounded-lg">
              <FileDown className="text-wa-teal" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white">Export PDF Report</h3>
              <p className="text-xs text-gray-500">Customize your report</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-wa-incoming rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Title Input */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Report Title</label>
            <input
              type="text"
              value={options.title}
              onChange={(e) => setOptions({ ...options, title: e.target.value })}
              className="w-full px-3 py-2 bg-wa-incoming border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-wa-teal"
              placeholder="Enter report title..."
            />
          </div>

          {/* Include Options */}
          <div>
            <label className="block text-sm text-gray-400 mb-3">Include in Report</label>
            <div className="space-y-2">
              <ToggleOption
                label="Activity Chart"
                description="Message activity over time"
                icon={BarChart3}
                checked={options.includeCharts || false}
                onChange={(checked) => setOptions({ ...options, includeCharts: checked })}
              />
              <ToggleOption
                label="Top Contributors"
                description="List of most active users"
                icon={Users}
                checked={options.includeUsers || false}
                onChange={(checked) => setOptions({ ...options, includeUsers: checked })}
              />
              <ToggleOption
                label="Groups Overview"
                description="All monitored groups with stats"
                icon={MessageSquare}
                checked={options.includeGroups || false}
                onChange={(checked) => setOptions({ ...options, includeGroups: checked })}
              />
            </div>
          </div>

          {/* Date Range Display */}
          <div className="p-3 bg-wa-incoming/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Date Range</span>
              <span className="text-gray-200">{options.dateRange}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleExport}
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              success
                ? 'bg-green-600 text-white'
                : loading
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-wa-teal text-white hover:bg-wa-teal/90'
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating PDF...
              </>
            ) : success ? (
              <>
                <Check size={18} />
                Downloaded!
              </>
            ) : (
              <>
                <FileDown size={18} />
                Generate & Download PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Toggle Option Component
interface ToggleOptionProps {
  label: string;
  description: string;
  icon: LucideIcon;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleOption: React.FC<ToggleOptionProps> = ({
  label,
  description,
  icon: Icon,
  checked,
  onChange,
}) => (
  <button
    onClick={() => onChange(!checked)}
    className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 text-left ${
      checked
        ? 'border-wa-teal bg-wa-teal/10'
        : 'border-gray-700 bg-wa-incoming hover:border-gray-600'
    }`}
  >
    <div className={`p-2 rounded-lg ${checked ? 'bg-wa-teal/20' : 'bg-gray-800'}`}>
      <Icon size={18} className={checked ? 'text-wa-teal' : 'text-gray-500'} />
    </div>
    <div className="flex-1">
      <div className={`font-medium ${checked ? 'text-white' : 'text-gray-300'}`}>{label}</div>
      <div className="text-xs text-gray-500">{description}</div>
    </div>
    <div
      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
        checked ? 'border-wa-teal bg-wa-teal' : 'border-gray-600'
      }`}
    >
      {checked && <Check size={12} className="text-white" />}
    </div>
  </button>
);

export default ExportPdfModal;
