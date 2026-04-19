
const { createClient } = require('@supabase/supabase-client');
require('dotenv').config();

const supabaseUrl = 'https://bixsgzhsvxeivkpuyiro.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

async function check() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log("Checking table structures...");
    
    // We can't easily check actual schema via anon key for some systems, 
    // but we can try to fetch one row and see the types if data exists.
    const tables = ['loans', 'events', 'members', 'inventory_items'];
    
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.error(`Error on ${table}:`, error.message);
        } else {
            console.log(`Table ${table} sample row:`, data[0] ? Object.keys(data[0]) : "Empty");
        }
    }
}
check();
