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
        const newLoan = {
            item_id: '00000000-0000-0000-0000-000000000000', // Mock UUID
            item_name: 'Test',
            user_id: 'Test',
            user_name: 'Test',
            type: 'Empréstimo Temporário',
            quantity: 1,
            status: 'Ativo'
        };
        const { data, error } = await supabase.from('loans').insert(newLoan).select().single()

        if (error) {
            console.error('Insert Failed:', error.message, error.details, error.hint)
        } else {
            console.log('Insert Successful!', data)
            // Cleanup
            await supabase.from('loans').delete().eq('id', data.id);
        }
    } catch (err) {
        console.error('Unexpected error:', err)
    }
}
testConnection()
