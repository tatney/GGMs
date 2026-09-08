require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://woficgrivliwuuqtbayi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

let initialized = false;

async function initDatabase() {
  if (initialized) return supabase;

  const { data: existing, error: checkError } = await supabase
    .from('users')
    .select('id')
    .eq('username', 'admin')
    .maybeSingle();
  if (checkError) throw new Error(`Supabase connection failed: ${checkError.message}`);

  if (!existing) {
    const { error } = await supabase.from('users').insert({
      username: 'admin',
      password_hash: '$2a$10$/NCaW.DzfRUTaIJkIA575OxZVoYCVutHTA3EnSIL6uYzyfLQNSdwi',
      role: 'admin'
    });
    if (error) throw new Error(`Failed to seed admin user: ${error.message}`);
    console.log('Default admin user ensured (admin / admin123)');
  }

  initialized = true;
  return supabase;
}

function table(name) {
  return supabase.from(name);
}

function query() {
  throw new Error('Raw SQL is not supported with Supabase. Use the table() helpers instead.');
}

function get() {
  throw new Error('Raw SQL is not supported with Supabase. Use the table() helpers instead.');
}

function run() {
  throw new Error('Raw SQL is not supported with Supabase. Use the table() helpers instead.');
}

module.exports = { initDatabase, supabase, table, query, get, run };