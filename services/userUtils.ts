import { Message, GroupMember, GhostUser } from '../types';

/**
 * User identification utilities for handling WhatsApp's dual ID format:
 * - @c.us format: Traditional format where ID = phone number
 * - @lid format: Linked ID format where ID is internal reference (not phone number)
 * 
 * Priority order for identification:
 * 1. Real phone number (sender_number / user_number)
 * 2. Linked ID (sender_lid / user_lid)
 * 3. Full WhatsApp ID (sender_id / user_id)
 */

type UserRecord = Message | GroupMember | GhostUser;

/**
 * Check if a record is a Message type
 */
function isMessage(record: UserRecord): record is Message {
  return 'sender_id' in record;
}

/**
 * Check if a record is a GroupMember type
 */
function isGroupMember(record: UserRecord): record is GroupMember {
  return 'user_id' in record && 'is_admin' in record;
}

/**
 * Get the best available user identifier
 * Priority: phone number > LID > full ID
 */
export function getUserDisplayId(record: UserRecord): string {
  if (isMessage(record)) {
    return record.sender_number || record.sender_lid || record.sender_id;
  }
  
  if (isGroupMember(record)) {
    return record.user_number || record.user_lid || record.user_id;
  }
  
  // GhostUser
  return record.user_number || record.user_lid || 'Unknown';
}

/**
 * Get the best available display name for a user
 * Priority: pushname > name > identifier
 */
export function getUserDisplayName(record: UserRecord): string {
  if (isMessage(record)) {
    return record.sender_pushname || record.sender_name || getUserDisplayId(record);
  }
  
  if (isGroupMember(record)) {
    return record.user_pushname || record.user_name || getUserDisplayId(record);
  }
  
  // GhostUser
  return record.user_pushname || getUserDisplayId(record);
}

/**
 * Get a formatted identifier with type indicator
 * Useful for debugging or detailed views
 */
export function getFormattedUserId(record: UserRecord): { id: string; type: 'phone' | 'lid' | 'legacy' } {
  if (isMessage(record)) {
    if (record.sender_number) {
      return { id: record.sender_number, type: 'phone' };
    }
    if (record.sender_lid) {
      return { id: record.sender_lid, type: 'lid' };
    }
    return { id: record.sender_id, type: 'legacy' };
  }
  
  if (isGroupMember(record)) {
    if (record.user_number) {
      return { id: record.user_number, type: 'phone' };
    }
    if (record.user_lid) {
      return { id: record.user_lid, type: 'lid' };
    }
    return { id: record.user_id, type: 'legacy' };
  }
  
  // GhostUser
  if (record.user_number) {
    return { id: record.user_number, type: 'phone' };
  }
  if (record.user_lid) {
    return { id: record.user_lid, type: 'lid' };
  }
  return { id: 'unknown', type: 'legacy' };
}

/**
 * Format phone number for display (if available)
 */
export function formatPhoneNumber(number: string | null): string {
  if (!number) return '';
  
  // Basic formatting: add + prefix if numeric and long enough
  if (/^\d{10,}$/.test(number)) {
    return `+${number}`;
  }
  
  return number;
}

/**
 * Check if user has a real phone number
 */
export function hasPhoneNumber(record: UserRecord): boolean {
  if (isMessage(record)) {
    return !!record.sender_number;
  }
  
  if (isGroupMember(record)) {
    return !!record.user_number;
  }
  
  // GhostUser
  return !!record.user_number;
}

/**
 * Check if user is using LID format (no phone number available)
 */
export function isLidOnly(record: UserRecord): boolean {
  if (isMessage(record)) {
    return !record.sender_number && !!record.sender_lid;
  }
  
  if (isGroupMember(record)) {
    return !record.user_number && !!record.user_lid;
  }
  
  // GhostUser
  return !record.user_number && !!record.user_lid;
}

/**
 * Get unique key for a user (for React lists, Maps, etc.)
 */
export function getUserKey(record: UserRecord): string {
  if (isMessage(record)) {
    return record.sender_id;
  }
  
  if (isGroupMember(record)) {
    return record.user_id;
  }
  
  // GhostUser - use number or lid as key
  return record.user_number || record.user_lid || `ghost-${record.group_name}`;
}
