import { GroupStats, Message, GhostUser, GroupMember } from '../types';
import { subMinutes, subDays, subHours } from 'date-fns';

export const mockGroups: GroupStats[] = [
  {
    group_id: '1203630405060708@g.us',
    group_name: 'Alma Devs 🚀',
    member_count: 12,
    admin_count: 3,
    total_messages: 15430,
    last_activity: new Date().toISOString(),
    members_with_phone: 10,
    members_with_lid: 2,
  },
  {
    group_id: '1203630409999999@g.us',
    group_name: 'Family Chat ❤️',
    member_count: 8,
    admin_count: 2,
    total_messages: 452,
    last_activity: subHours(new Date(), 2).toISOString(),
    members_with_phone: 8,
    members_with_lid: 0,
  },
  {
    group_id: '1203630401231231@g.us',
    group_name: 'Gaming Night 🎮',
    member_count: 25,
    admin_count: 1,
    total_messages: 8900,
    last_activity: subDays(new Date(), 1).toISOString(),
    members_with_phone: 20,
    members_with_lid: 5,
  }
];

export const mockGhosts: GhostUser[] = [
  {
    group_name: 'Alma Devs 🚀',
    user_number: '521555555555',
    user_lid: null,
    user_pushname: 'Sleepy Dev',
    message_count: 12,
    last_message_at: subDays(new Date(), 45).toISOString(),
    days_inactive: 45,
  },
  {
    group_name: 'Gaming Night 🎮',
    user_number: null,
    user_lid: '53313529737452',
    user_pushname: 'NoobMaster69',
    message_count: 5,
    last_message_at: subDays(new Date(), 60).toISOString(),
    days_inactive: 60,
  },
  {
    group_name: 'Alma Devs 🚀',
    user_number: null,
    user_lid: '12345678901234',
    user_pushname: null,
    message_count: 2,
    last_message_at: subDays(new Date(), 90).toISOString(),
    days_inactive: 90,
  }
];

const generateMessages = (groupId: string): Message[] => {
  const messages: Message[] = [];
  const senders = [
    { id: '521111111111@c.us', pushname: 'Gerardo', number: '521111111111', lid: null },
    { id: '521222222222@c.us', pushname: 'Alma', number: '521222222222', lid: null },
    { id: '53313529737452@lid', pushname: 'User 3', number: null, lid: '53313529737452' }
  ];

  for (let i = 0; i < 20; i++) {
    const sender = senders[i % 3];
    messages.push({
      id: i,
      created_at: subMinutes(new Date(), 20 - i).toISOString(),
      message_timestamp: subMinutes(new Date(), 20 - i).toISOString(),
      message_id: `MSG-${i}-${Date.now()}`,
      chat_id: groupId,
      group_name: mockGroups.find(g => g.group_id === groupId)?.group_name || 'Group',
      group_id: groupId,
      sender_id: sender.id,
      sender_name: sender.pushname,
      sender_pushname: sender.pushname,
      sender_number: sender.number,
      sender_lid: sender.lid,
      is_from_me: sender.pushname === 'Alma',
      body: `This is message number ${i + 1} in the sequence. It simulates a conversation flow.`,
      message_type: 'chat',
      mentioned_ids: [],
      quoted_message_id: null,
      is_forwarded: false,
      forwarding_score: 0,
      is_starred: false,
      has_media: false,
      media_type: null,
      media_mimetype: null,
      media_filename: null,
      media_filesize: null,
      media_content: null,
      raw_data: {},
    });
  }
  return messages;
};

export const getMockMessages = (groupId: string) => generateMessages(groupId);

export const mockMembers: GroupMember[] = [
  {
    id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_seen: new Date().toISOString(),
    group_id: '1203630405060708@g.us',
    group_name: 'Alma Devs 🚀',
    user_id: '521111111111@c.us',
    user_number: '521111111111',
    user_lid: null,
    user_name: 'Gerardo',
    user_pushname: 'Gerardo',
    is_admin: true,
    is_super_admin: true,
    message_count: 500,
    last_message_at: new Date().toISOString()
  },
  {
    id: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_seen: new Date().toISOString(),
    group_id: '1203630405060708@g.us',
    group_name: 'Alma Devs 🚀',
    user_id: '521222222222@c.us',
    user_number: '521222222222',
    user_lid: null,
    user_name: 'Alma',
    user_pushname: 'Alma Bot',
    is_admin: true,
    is_super_admin: false,
    message_count: 12000,
    last_message_at: new Date().toISOString()
  },
  {
    id: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_seen: new Date().toISOString(),
    group_id: '1203630405060708@g.us',
    group_name: 'Alma Devs 🚀',
    user_id: '53313529737452@lid',
    user_number: null,
    user_lid: '53313529737452',
    user_name: null,
    user_pushname: 'LID User',
    is_admin: false,
    is_super_admin: false,
    message_count: 150,
    last_message_at: subDays(new Date(), 2).toISOString()
  }
];
