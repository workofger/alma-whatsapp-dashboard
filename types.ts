export interface Message {
  id: number;
  created_at: string;
  message_timestamp: string;
  message_id: string;
  chat_id: string;
  group_name: string | null;
  group_id: string | null;
  sender_id: string;
  sender_name: string | null;
  sender_pushname: string | null;
  sender_number: string | null;
  is_from_me: boolean;
  body: string | null;
  message_type: 'chat' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'e2e_notification' | 'protocol';
  mentioned_ids: string[];
  quoted_message_id: string | null;
  is_forwarded: boolean;
  forwarding_score: number;
  is_starred: boolean;
  has_media: boolean;
  media_type: string | null;
  media_mimetype: string | null;
  media_filename: string | null;
  media_filesize: number | null;
  media_content: string | null; // Base64
  raw_data: Record<string, unknown>;
}

export interface GroupMember {
  id: number;
  created_at: string;
  updated_at: string;
  last_seen: string | null;
  group_id: string;
  group_name: string | null;
  user_id: string;
  user_number: string | null;
  user_name: string | null;
  user_pushname: string | null;
  is_admin: boolean;
  is_super_admin: boolean;
  message_count: number;
  last_message_at: string | null;
}

export interface GroupStats {
  group_id: string;
  group_name: string | null;
  member_count: number;
  admin_count: number;
  total_messages: number;
  last_activity: string | null;
}

export interface GhostUser {
  group_name: string | null;
  user_number: string | null;
  user_pushname: string | null;
  message_count: number;
  last_message_at: string | null;
  days_inactive: number;
}
