// Mock fetch for node environment if needed, or rely on Node 18+
if (!global.fetch) {
    console.error("This script requires Node.js 18+ or a fetch polyfill.");
    process.exit(1);
}
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bixsgzhsvxeivkpuyiro.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpeHNnemhzdnhlaXZrcHV5aXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NzMwMDIsImV4cCI6MjA4NjM0OTAwMn0.4vYZ70IhxKJB0IFjdI0IXS-U2417AqiA0S6a9wlRZPc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
    console.log('Testing Supabase Connection...')
    console.log('URL:', supabaseUrl)

    try {
        const { data, error } = await supabase.from('members').select('count', { count: 'exact', head: true })

        if (error) {
            console.error('Connection Failed:', error.message, error.details, error.hint)
        } else {
            console.log('Connection Successful! Members count (header):', data)

            const { data: members, error: memberError } = await supabase.from('members').select('name').limit(5)
            if (memberError) console.error('Member fetch failed:', memberError.message)
            else console.log('Successfully fetched members:', members)
        }
    } catch (err) {
        console.error('Unexpected error:', err)
    }
}

testConnection()
