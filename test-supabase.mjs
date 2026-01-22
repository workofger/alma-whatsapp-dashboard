import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || 'https://hofvsrcxnesddxmpqqmk.supabase.co';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('=== Supabase Connection Test ===');
console.log('URL:', url);
console.log('Key:', key ? `${key.substring(0, 20)}...${key.substring(key.length - 10)}` : 'NOT SET');
console.log('Key Length:', key.length);

if (!key) {
  console.log('\n❌ ERROR: VITE_SUPABASE_ANON_KEY is not set');
  console.log('Please set it in your environment or .env.local file');
  process.exit(1);
}

const supabase = createClient(url, key);

async function testConnection() {
  console.log('\n--- Testing Messages Table ---');
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('id, message_timestamp, sender_pushname')
    .limit(3);
  
  if (msgError) {
    console.log('❌ Messages Error:', msgError.message);
    console.log('   Code:', msgError.code);
    console.log('   Details:', msgError.details);
  } else {
    console.log('✅ Messages OK - Found', messages?.length, 'records');
    if (messages?.length > 0) {
      console.log('   Sample:', messages[0]);
    }
  }

  console.log('\n--- Testing Group Stats View ---');
  const { data: groups, error: grpError } = await supabase
    .from('v_group_stats')
    .select('*')
    .limit(3);
  
  if (grpError) {
    console.log('❌ Group Stats Error:', grpError.message);
    console.log('   Code:', grpError.code);
  } else {
    console.log('✅ Group Stats OK - Found', groups?.length, 'records');
  }

  console.log('\n--- Testing Ghost Users View ---');
  const { data: ghosts, error: ghostError } = await supabase
    .from('v_ghost_users')
    .select('*')
    .limit(3);
  
  if (ghostError) {
    console.log('❌ Ghost Users Error:', ghostError.message);
    console.log('   Code:', ghostError.code);
  } else {
    console.log('✅ Ghost Users OK - Found', ghosts?.length, 'records');
  }

  console.log('\n--- Testing Group Members Table ---');
  const { data: members, error: memError } = await supabase
    .from('group_members')
    .select('id, user_pushname, group_name')
    .limit(3);
  
  if (memError) {
    console.log('❌ Group Members Error:', memError.message);
    console.log('   Code:', memError.code);
  } else {
    console.log('✅ Group Members OK - Found', members?.length, 'records');
  }
}

testConnection().then(() => {
  console.log('\n=== Test Complete ===');
}).catch(err => {
  console.log('\n❌ Unexpected Error:', err);
});
