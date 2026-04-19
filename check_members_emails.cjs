
const { createClient } = require('@supabase/supabase-client');
require('dotenv').config();

const supabaseUrl = 'https://bixsgzhsvxeivkpuyiro.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''; // I might not have access to env here if I don't set it

async function check() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('members').select('name, email, role');
    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}
check();
