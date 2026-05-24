const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .select(`
        *,
        transaction:transactions(*),
        profile:profiles(full_name, phone, email)
      `)
      .limit(5);

    if (error) {
      console.error('QUERY ERROR:', error);
    } else {
      console.log('SUCCESS! QUERY RESULT:', data);
    }
  } catch (e) {
    console.error('CRITICAL ERROR:', e);
  }
}

run();
