import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log("[ManageUser] Received payload:", JSON.stringify(body))

    // Handle both direct frontend calls and Database Webhook (Trigger) calls
    // Trigger payload has 'record', 'old_record', and 'type'
    let action = body.action
    let email = body.email
    let password = body.password
    let newEmail = body.newEmail

    if (body.record) {
      // It's a DB Trigger payload
      const type = body.type // INSERT, UPDATE, DELETE
      const record = body.record
      const oldRecord = body.old_record

      if (type === 'INSERT') {
        action = 'create'
        email = record.email
        password = record.password
      } else if (type === 'UPDATE') {
        const passwordChanged = record.password !== oldRecord.password
        const emailChanged = record.email !== oldRecord.email

        if (passwordChanged) {
          action = 'update_password'
          email = record.email
          password = record.password
        } else if (emailChanged) {
          action = 'update_email'
          email = oldRecord.email
          newEmail = record.email
        } else {
          // Nothing relevant changed for Auth
          return new Response(JSON.stringify({ success: true, message: 'No auth-relevant changes' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          })
        }
      } else if (type === 'DELETE') {
        action = 'delete'
        email = oldRecord.email
      }
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    if (action === 'create') {
      if (!email || !password) throw new Error('Email and password required for creation')
      
      console.log(`[ManageUser] Creating user: ${email}`)
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: email.trim(),
        password: password,
        email_confirm: true
      })

      if (error) {
        if (error.message?.includes('already been registered') || error.message?.includes('already exists')) {
          console.log(`[ManageUser] User ${email} already exists, updating password instead`)
          const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
          if (listError) throw listError
          const existingUser = users.users.find(u => u.email === email.trim())
          if (!existingUser) throw new Error('User exists but could not be found')
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password: password })
          if (updateError) throw updateError
          return new Response(JSON.stringify({ success: true, action: 'updated_existing' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
        }
        throw error
      }
      return new Response(JSON.stringify({ success: true, userId: data.user?.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

    } else if (action === 'update_password') {
      if (!email || !password) throw new Error('Email and password required for password update')
      console.log(`[ManageUser] Updating password for: ${email}`)
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      if (listError) throw listError
      const existingUser = users.users.find(u => u.email === email.trim())
      
      if (!existingUser) {
        console.log(`[ManageUser] User ${email} not found, creating...`)
        const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({ email: email.trim(), password: password, email_confirm: true })
        if (createError) throw createError
        return new Response(JSON.stringify({ success: true, action: 'created' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password: password })
      if (updateError) throw updateError
      return new Response(JSON.stringify({ success: true, action: 'password_updated' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

    } else if (action === 'update_email') {
      if (!email || !newEmail) throw new Error('Current email and new email required')
      console.log(`[ManageUser] Updating email from ${email} to ${newEmail}`)
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      if (listError) throw listError
      const existingUser = users.users.find(u => u.email === email.trim())
      if (!existingUser) throw new Error('User not found')
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { email: newEmail.trim() })
      if (updateError) throw updateError
      return new Response(JSON.stringify({ success: true, action: 'email_updated' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

    } else if (action === 'delete') {
      if (!email) throw new Error('Email required for deletion')
      console.log(`[ManageUser] Deleting user: ${email}`)
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      if (listError) throw listError
      const existingUser = users.users.find(u => u.email === email.trim())
      if (!existingUser) return new Response(JSON.stringify({ success: true, action: 'not_found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id)
      if (deleteError) throw deleteError
      return new Response(JSON.stringify({ success: true, action: 'deleted' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

    } else {
      throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error("[ManageUser Error]", error.message)
    return new Response(JSON.stringify({ error: true, message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
