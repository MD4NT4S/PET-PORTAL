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
    const { action, email, password, newEmail } = await req.json()

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables')
    }

    // Create admin client with service role key (has full admin access)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    if (action === 'create') {
      // Create a new user in Supabase Auth
      if (!email || !password) {
        throw new Error('Email and password are required for creating a user')
      }

      console.log(`[ManageUser] Creating user: ${email}`)

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: email.trim(),
        password: password,
        email_confirm: true // Auto-confirm email so user can login immediately
      })

      if (error) {
        // If user already exists, try to update the password instead
        if (error.message?.includes('already been registered') || error.message?.includes('already exists')) {
          console.log(`[ManageUser] User ${email} already exists, updating password instead`)
          
          // Find the user by email
          const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
          if (listError) throw listError

          const existingUser = users.users.find(u => u.email === email.trim())
          if (!existingUser) throw new Error('User exists but could not be found')

          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            existingUser.id,
            { password: password }
          )

          if (updateError) throw updateError

          return new Response(JSON.stringify({ success: true, action: 'updated_existing' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          })
        }
        throw error
      }

      return new Response(JSON.stringify({ success: true, userId: data.user?.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })

    } else if (action === 'update_password') {
      // Update password for an existing user
      if (!email || !password) {
        throw new Error('Email and password are required for updating password')
      }

      console.log(`[ManageUser] Updating password for: ${email}`)

      // Find the user by email
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      if (listError) throw listError

      const existingUser = users.users.find(u => u.email === email.trim())
      
      if (!existingUser) {
        // User doesn't exist in Auth yet — create them
        console.log(`[ManageUser] User ${email} not found in Auth, creating...`)
        const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: email.trim(),
          password: password,
          email_confirm: true
        })
        
        if (createError) throw createError

        return new Response(JSON.stringify({ success: true, action: 'created', userId: data.user?.id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password: password }
      )

      if (updateError) throw updateError

      return new Response(JSON.stringify({ success: true, action: 'password_updated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })

    } else if (action === 'update_email') {
      // Update email for an existing user
      if (!email || !newEmail) {
        throw new Error('Current email and new email are required')
      }

      console.log(`[ManageUser] Updating email from ${email} to ${newEmail}`)

      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      if (listError) throw listError

      const existingUser = users.users.find(u => u.email === email.trim())
      if (!existingUser) throw new Error('User not found')

      const updateData: any = { email: newEmail.trim() }
      
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        updateData
      )

      if (updateError) throw updateError

      return new Response(JSON.stringify({ success: true, action: 'email_updated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })

    } else if (action === 'delete') {
      // Delete a user from Auth
      if (!email) {
        throw new Error('Email is required for deleting a user')
      }

      console.log(`[ManageUser] Deleting user: ${email}`)

      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      if (listError) throw listError

      const existingUser = users.users.find(u => u.email === email.trim())
      if (!existingUser) {
        // User doesn't exist in Auth, nothing to delete
        return new Response(JSON.stringify({ success: true, action: 'not_found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id)
      if (deleteError) throw deleteError

      return new Response(JSON.stringify({ success: true, action: 'deleted' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })

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
