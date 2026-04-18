import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://bixsgzhsvxeivkpuyiro.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpeHNnemhzdnhlaXZrcHV5aXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NzMwMDIsImV4cCI6MjA4NjM0OTAwMn0.4vYZ70IhxKJB0IFjdI0IXS-U2417AqiA0S6a9wlRZPc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    const { data, error } = await supabase.from('events').select('*').limit(1);
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Events columns (sample):", data.length > 0 ? Object.keys(data[0]) : "No data to infer columns");
    }
}
checkTable();
