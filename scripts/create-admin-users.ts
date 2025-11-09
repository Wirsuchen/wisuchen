/**
 * Script to create admin users in Supabase
 * Run with: pnpm create-admins
 * 
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local file
const envPath = resolve(process.cwd(), '.env.local')
try {
  const envFile = readFileSync(envPath, 'utf-8')
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        process.env[key.trim()] = value
      }
    }
  })
  console.log('✅ Loaded .env.local\n')
} catch (error) {
  console.error('⚠️  Could not load .env.local file')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const adminAccounts = [
  { email: 'supervisor@wirsuchen.com', password: 'password123', role: 'supervisor', name: 'Supervisor Admin' },
  { email: 'admin@wirsuchen.com', password: 'password123', role: 'admin', name: 'Admin User' },
  { email: 'moderator@wirsuchen.com', password: 'password123', role: 'moderator', name: 'Moderator User' },
  { email: 'lister@wirsuchen.com', password: 'password123', role: 'lister', name: 'Lister User' },
  { email: 'publisher@wirsuchen.com', password: 'password123', role: 'publisher', name: 'Publisher User' },
  { email: 'blogger@wirsuchen.com', password: 'password123', role: 'blogger', name: 'Blogger User' },
  { email: 'editor@wirsuchen.com', password: 'password123', role: 'editor', name: 'Editor User' },
  { email: 'analyst@wirsuchen.com', password: 'password123', role: 'analyst', name: 'Analyst User' },
]

async function createAdminUsers() {
  console.log('🚀 Creating admin users in Supabase...\n')

  for (const account of adminAccounts) {
    try {
      console.log(`📝 Creating user: ${account.email} (${account.role})`)

      // Create auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: {
          full_name: account.name,
          role: account.role
        }
      })

      if (authError) {
        console.error(`   ❌ Auth creation failed: ${authError.message}`)
        continue
      }

      console.log(`   ✅ Auth user created: ${authUser.user.id}`)

      // Create/update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: authUser.user.id,
          email: account.email,
          full_name: account.name,
          role: account.role,
          is_active: true,
          email_verified: true
        }, {
          onConflict: 'email'
        })

      if (profileError) {
        console.error(`   ❌ Profile creation failed: ${profileError.message}`)
      } else {
        console.log(`   ✅ Profile created with role: ${account.role}`)
      }

      console.log('')
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}\n`)
    }
  }

  console.log('✨ Admin user creation complete!\n')
  console.log('📋 Login Credentials:')
  console.log('─'.repeat(60))
  adminAccounts.forEach(account => {
    console.log(`${account.role.padEnd(12)} | ${account.email.padEnd(30)} | password123`)
  })
  console.log('─'.repeat(60))
  console.log('\n⚠️  IMPORTANT: Change these passwords in production!')
}

createAdminUsers().catch(console.error)
