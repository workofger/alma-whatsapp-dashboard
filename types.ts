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
  sender_lid: string | null; // WhatsApp internal Linked ID (if @lid format)
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
  user_lid: string | null; // WhatsApp internal Linked ID (if @lid format)
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
  members_with_phone: number; // Count of members with real phone numbers
  members_with_lid: number; // Count of members using LID format only
}

export interface GhostUser {
  group_name: string | null;
  user_number: string | null;
  user_lid: string | null; // WhatsApp internal Linked ID
  user_pushname: string | null;
  message_count: number;
  last_message_at: string | null;
  days_inactive: number;
}
