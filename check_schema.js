import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://bixsgzhsvxeivkpuyiro.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpeHNnemhzdnhlaXZrcHV5aXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NzMwMDIsImV4cCI6MjA4NjM0OTAwMn0.4vYZ70IhxKJB0IFjdI0IXS-U2417AqiA0S6a9wlRZPc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase.rpc('get_schema');
    console.log("RPC get_schema:", error?.message || data);

    // Try a direct query to events again with a failing insert to get the error message
    const { error: insErr } = await supabase.from('events').insert({ dummy_col: 1 });
    console.log("Insert unknown col error:", insErr?.message);
}
checkSchema();
