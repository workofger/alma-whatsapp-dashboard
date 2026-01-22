import { Message, GroupMember, GhostUser } from '../types';

export type ExportFormat = 'csv' | 'json';

interface ExportOptions {
  format: ExportFormat;
  filename: string;
}

// Helper to escape CSV values
const escapeCsv = (str: string | null | undefined): string => {
  if (!str) return '';
  // Escape quotes and wrap in quotes if contains comma, newline, or quote
  const escaped = str.replace(/"/g, '""');
  if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
    return `"${escaped}"`;
  }
  return escaped;
};

// Convert messages to CSV format
const messagesToCSV = (messages: Message[]): string => {
  const headers = [
    'ID',
    'Timestamp',
    'Group Name',
    'Sender Name',
    'Sender Number',
    'Sender LID',
    'Message Type',
    'Content',
    'Has Media',
    'Is Forwarded',
  ].join(',');

  const rows = messages.map((m) => {
    return [
      m.id,
      new Date(m.message_timestamp).toISOString(),
      escapeCsv(m.group_name),
      escapeCsv(m.sender_pushname || m.sender_name),
      escapeCsv(m.sender_number),
      escapeCsv(m.sender_lid),
      m.message_type,
      escapeCsv(m.body),
      m.has_media,
      m.is_forwarded,
    ].join(',');
  });

  return [headers, ...rows].join('\n');
};

// Convert members to CSV format
const membersToCSV = (members: GroupMember[]): string => {
  const headers = [
    'ID',
    'Group Name',
    'User Name',
    'User Number',
    'User LID',
    'Is Admin',
    'Message Count',
    'Last Message At',
    'Last Seen',
  ].join(',');

  const rows = members.map((m) => {
    return [
      m.id,
      escapeCsv(m.group_name),
      escapeCsv(m.user_pushname || m.user_name),
      escapeCsv(m.user_number),
      escapeCsv(m.user_lid),
      m.is_admin,
      m.message_count,
      m.last_message_at || '',
      m.last_seen || '',
    ].join(',');
  });

  return [headers, ...rows].join('\n');
};

// Convert ghost users to CSV format
const ghostsToCSV = (ghosts: GhostUser[]): string => {
  const headers = [
    'Group Name',
    'User Name',
    'User Number',
    'User LID',
    'Message Count',
    'Last Message At',
    'Days Inactive',
  ].join(',');

  const rows = ghosts.map((g) => {
    return [
      escapeCsv(g.group_name),
      escapeCsv(g.user_pushname),
      escapeCsv(g.user_number),
      escapeCsv(g.user_lid),
      g.message_count,
      g.last_message_at || '',
      g.days_inactive,
    ].join(',');
  });

  return [headers, ...rows].join('\n');
};

// Download helper
const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export messages
export const exportMessages = (messages: Message[], options: ExportOptions): void => {
  const { format, filename } = options;

  if (format === 'csv') {
    const csv = messagesToCSV(messages);
    downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
  } else {
    const json = JSON.stringify(messages, null, 2);
    downloadFile(json, `${filename}.json`, 'application/json');
  }
};

// Export members
export const exportMembers = (members: GroupMember[], options: ExportOptions): void => {
  const { format, filename } = options;

  if (format === 'csv') {
    const csv = membersToCSV(members);
    downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
  } else {
    const json = JSON.stringify(members, null, 2);
    downloadFile(json, `${filename}.json`, 'application/json');
  }
};

// Export ghost users
export const exportGhosts = (ghosts: GhostUser[], options: ExportOptions): void => {
  const { format, filename } = options;

  if (format === 'csv') {
    const csv = ghostsToCSV(ghosts);
    downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
  } else {
    const json = JSON.stringify(ghosts, null, 2);
    downloadFile(json, `${filename}.json`, 'application/json');
  }
};

// Generate filename with timestamp
export const generateFilename = (prefix: string, groupName?: string): string => {
  const timestamp = new Date().toISOString().slice(0, 10);
  const sanitizedGroup = groupName?.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30) || 'all';
  return `${prefix}_${sanitizedGroup}_${timestamp}`;
};
