import React from 'react';
import { Message } from '../../types';
import { format } from 'date-fns';
import {
  CheckCheck,
  Image,
  Video,
  FileAudio,
  File,
  Sticker,
  Forward,
} from 'lucide-react';
import { getUserDisplayName, getUserDisplayId } from '../../services/userUtils';

interface MessageBubbleProps {
  message: Message;
  allMessages?: Message[];
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, allMessages = [] }) => {
  const isMe = message.is_from_me;

  // Find quoted message if exists
  const quotedMessage = message.quoted_message_id
    ? allMessages.find((m) => m.message_id === message.quoted_message_id)
    : null;

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2 animate-fade-in`}>
      <div
        className={`relative max-w-[70%] rounded-lg px-3 py-2 text-sm shadow-md ${
          isMe
            ? 'bg-wa-outgoing text-gray-100 rounded-tr-none'
            : 'bg-wa-incoming text-gray-100 rounded-tl-none'
        }`}
      >
        {/* Sender Name (for group chats, non-self messages) */}
        {!isMe && (
          <div className="font-semibold text-xs mb-1">
            <span style={{ color: getTagColor(message.sender_id) }}>
              {getUserDisplayName(message)}
            </span>
          </div>
        )}

        {/* Forwarded Indicator */}
        {message.is_forwarded && (
          <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-1 italic">
            <Forward size={10} />
            <span>Forwarded{message.forwarding_score > 1 ? ` (${message.forwarding_score}x)` : ''}</span>
          </div>
        )}

        {/* Quoted Message Preview */}
        {quotedMessage && (
          <div className="bg-black/20 border-l-2 border-wa-teal rounded px-2 py-1.5 mb-2 text-xs">
            <div className="font-semibold text-wa-teal text-[10px]">
              {getUserDisplayName(quotedMessage)}
            </div>
            <div className="text-gray-400 truncate">
              {quotedMessage.body || (quotedMessage.has_media ? `[${quotedMessage.media_type || 'Media'}]` : '[Message]')}
            </div>
          </div>
        )}

        {/* Media Content */}
        {message.has_media && <MediaPreview message={message} />}

        {/* Message Body */}
        {message.body && (
          <div className="whitespace-pre-wrap break-words leading-relaxed">
            {formatMessageBody(message.body)}
          </div>
        )}

        {/* Timestamp and Status */}
        <div className="flex justify-end items-center gap-1 mt-1">
          <span className="text-[10px] text-gray-400">
            {format(new Date(message.message_timestamp), 'HH:mm')}
          </span>
          {isMe && (
            <span className="text-wa-blue">
              <CheckCheck size={14} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Media Preview Component
const MediaPreview: React.FC<{ message: Message }> = ({ message }) => {
  const mediaType = message.media_type || message.message_type;

  const getMediaIcon = () => {
    switch (mediaType) {
      case 'image':
        return <Image size={24} />;
      case 'video':
        return <Video size={24} />;
      case 'audio':
      case 'ptt':
        return <FileAudio size={24} />;
      case 'sticker':
        return <Sticker size={24} />;
      default:
        return <File size={24} />;
    }
  };

  const getMediaLabel = () => {
    switch (mediaType) {
      case 'image':
        return 'Photo';
      case 'video':
        return 'Video';
      case 'audio':
        return 'Audio';
      case 'ptt':
        return 'Voice Message';
      case 'sticker':
        return 'Sticker';
      case 'document':
        return message.media_filename || 'Document';
      default:
        return 'Media';
    }
  };

  // If we have base64 image content, show it
  if (message.media_content && mediaType === 'image') {
    return (
      <div className="mb-2 rounded overflow-hidden">
        <img
          src={`data:${message.media_mimetype || 'image/jpeg'};base64,${message.media_content}`}
          alt="Media"
          className="max-w-full max-h-64 object-contain rounded"
        />
      </div>
    );
  }

  // Show placeholder for other media
  return (
    <div className="mb-2 p-4 bg-black/20 rounded flex items-center gap-3 min-w-[200px]">
      <div className="p-2 bg-wa-teal/20 rounded-full text-wa-teal">{getMediaIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-200 truncate">{getMediaLabel()}</div>
        {message.media_filesize && (
          <div className="text-xs text-gray-400">
            {formatFileSize(message.media_filesize)}
          </div>
        )}
        {message.media_filename && mediaType === 'document' && (
          <div className="text-xs text-gray-400 truncate">{message.media_filename}</div>
        )}
      </div>
    </div>
  );
};

// Helper: Generate consistent colors for usernames
const getTagColor = (id: string): string => {
  const colors = [
    '#53bdeb', // Blue
    '#a6c638', // Green
    '#d673ad', // Pink
    '#e56450', // Red
    '#a288f5', // Purple
    '#f5a623', // Orange
    '#7bc8a4', // Teal
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Helper: Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Helper: Format message body (detect URLs, mentions, etc.)
const formatMessageBody = (body: string): React.ReactNode => {
  // Simple URL detection
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = body.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-wa-blue hover:underline break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export default MessageBubble;
