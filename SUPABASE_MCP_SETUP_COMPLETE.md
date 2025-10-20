# Supabase MCP Integration - Complete Setup ✅

## 🎉 What's Been Done

Your Supabase backend is now fully connected and secured with best practices:

### ✅ Database Security (RLS Policies)

**Comprehensive Row-Level Security policies applied to all tables:**

- **Offers**: Public can read active/published; role-based write permissions
- **Categories**: Public read for active; moderator+ can manage
- **Companies**: Public read for active; employer/moderator can manage
- **Profiles**: Users can read/update their own profile only
- **Blog Posts**: Public read for published; blogger/editor can create/update
- **Invoices & Payments**: Users can read their own; system manages via service role
- **Media Files**: Public read for public files; authenticated upload
- **Admin Tables**: job_sources, import_runs, affiliate_programs - admin-only access
- **Analytics**: impressions - insert allowed, admin/analyst read
- **Audit Logs**: Read-only for admins, system insert

### ✅ Performance Optimization

**Strategic indexes added:**
- Composite indexes on offers(status, type, published_at) for fast job/deal listing
- Full-text search indexes on offers(title, description, location)
- Unique constraints on offers(source, external_id) to prevent duplicates
- Foreign key indexes on all relationship columns
- Partial indexes for active records only

### ✅ TypeScript Types Generated

Fresh types exported to: `lib/types/database.generated.ts`

Usage:
```typescript
import { Database, Tables, TablesInsert, TablesUpdate } from '@/lib/types/database.generated'

// Use in your code
type Offer = Tables<'offers'>
type OfferInsert = TablesInsert<'offers'>
type OfferUpdate = TablesUpdate<'offers'>
```

### ✅ Auto-Create Profile Trigger

When a user signs up via Supabase Auth, a profile is automatically created with:
- `user_id` linked to auth.users
- `email` from auth metadata
- `full_name` from OAuth data if available
- `role` defaults to `'job_seeker'`

### ✅ Security Functions Fixed

All helper functions now have `SECURITY DEFINER` and `SET search_path = public`:
- `get_user_role()` - Returns current user's role
- `is_admin()` - Check if user is admin/supervisor
- `is_moderator_or_above()` - Check if user has moderator+ role
- `handle_new_user()` - Auto-creates profile on signup
- All trigger functions are secured

---

## 🔧 Environment Setup

### Required Environment Variables

Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ngvuyarcqezvugfqfopg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ndnV5YXJjcWV6dnVnZnFmb3BnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4NDM4MTEsImV4cCI6MjA3MzQxOTgxMX0.Lez0u7JeCBD0oyIYkYL2yAa4G6Kn5W2jV7jMyd5lX10

# Service Role Key (server-only - DO NOT expose to client!)
# Get from: Supabase Dashboard → Settings → API → service_role
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# === External API Keys (for job/affiliate imports) ===

# Adzuna Job Search API
ADZUNA_APP_ID=your_app_id
ADZUNA_APP_KEY=your_app_key

# RapidAPI
RAPIDAPI_KEY=your_key

# Awin Affiliate Network
AWIN_API_KEY=your_key
AWIN_PUBLISHER_ID=your_id

# Adcell Affiliate Network
ADCELL_API_KEY=your_key
ADCELL_PROGRAM_ID=your_id

# PayPal Payments
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_secret
PAYPAL_MODE=sandbox  # or 'live' for production
```

---

## 📐 Architecture & Data Flow

### Frontend → Backend Flow

```
┌─────────────────┐
│ Next.js Client  │  (uses anon key)
│ Components      │
└────────┬────────┘
         │
         ├─→ Server Components    ─→  createClient() + RLS
         │   (app/*/page.tsx)         (public read policies)
         │
         ├─→ API Routes            ─→  createClient() + RLS
         │   (app/api/*/route.ts)      (role-based policies)
         │
         └─→ Server Actions        ─→  createClient()
             (future)                  (owner/role checks)
```

### Best Practices Implemented

1. **Client-Side (Browser)**
   - Always uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - RLS policies enforce data access
   - No sensitive operations

2. **Server-Side (API Routes / Server Components)**
   - Uses anon key + user cookies for RLS context
   - Service role key ONLY for admin operations (imports, system tasks)
   - Never expose service role to client

3. **Database Functions**
   - `auth.uid()` identifies current user in RLS policies
   - Helper functions check roles: `is_admin()`, `is_moderator_or_above()`

---

## 🔐 Security Checklist

### ✅ Completed

- [x] RLS enabled on all tables
- [x] Policies defined for all CRUD operations
- [x] Functions use `SECURITY DEFINER` with `search_path`
- [x] Auto-profile creation on signup
- [x] Unique constraints on external IDs
- [x] Role-based access control

### ⚠️ Recommended Next Steps

1. **Get Service Role Key**
   - Go to Supabase Dashboard → Project Settings → API
   - Copy `service_role` key
   - Add to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ NEVER commit this key or expose it to the client!

2. **Enable Auth Features** (in Supabase Dashboard → Authentication)
   - ✅ Enable "Password Strength" and "Leaked Password Protection"
   - ✅ Enable Multi-Factor Authentication (MFA) options
   - Configure email templates

3. **Storage Buckets** (if using media uploads)
   - Create bucket: `public-media` for public files
   - Create bucket: `private-media` for user-specific files
   - Set appropriate RLS policies on storage.objects

4. **API Keys for Imports**
   - Sign up for Adzuna, RapidAPI, Awin, Adcell
   - Add keys to `.env.local`
   - Test imports via admin dashboard

---

## 🚀 Usage Examples

### Server Component (Direct DB Access)

```typescript
// app/jobs/page.tsx
import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/types/database.generated'

export default async function JobsPage() {
  const supabase = await createClient()

  // RLS automatically filters to active jobs
  const { data: jobs } = await supabase
    .from('offers')
    .select(`
      *,
      company:companies(*),
      category:categories(*)
    `)
    .eq('type', 'job')
    .eq('status', 'active')
    .order('published_at', { ascending: false })
    .limit(20)

  return <JobsList jobs={jobs} />
}
```

### API Route (with Auth Check)

```typescript
// app/api/jobs/route.ts
import { createClient } from '@/lib/supabase/server'
import { TablesInsert } from '@/lib/types/database.generated'

export async function POST(request: Request) {
  const supabase = await createClient()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get profile (RLS ensures user can only read their own)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  // Check role
  if (!['employer', 'admin', 'moderator'].includes(profile?.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body: TablesInsert<'offers'> = await request.json()

  // RLS policy will check permissions
  const { data: offer, error } = await supabase
    .from('offers')
    .insert({
      ...body,
      created_by: profile.id,
      type: 'job',
      status: 'pending'
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ offer }, { status: 201 })
}
```

### Client Component (React Query)

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { Tables } from '@/lib/types/database.generated'
import { useEffect, useState } from 'react'

export function JobCard({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<Tables<'offers'> | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('offers')
      .select('*, company:companies(*)')
      .eq('id', jobId)
      .single()
      .then(({ data }) => setJob(data))
  }, [jobId])

  if (!job) return <div>Loading...</div>

  return (
    <div>
      <h2>{job.title}</h2>
      <p>{job.company?.name}</p>
      <p>{job.description}</p>
    </div>
  )
}
```

---

## 📊 Database Schema Overview

### Core Tables

- **profiles** - User accounts (auto-created on signup)
- **offers** - Jobs + Affiliate deals (polymorphic)
- **companies** - Employer/merchant entities
- **categories** - Hierarchical taxonomy (job/affiliate/blog)
- **blog_posts** - Content marketing
- **invoices** + **invoice_items** - Billing
- **payments** - Payment tracking (PayPal, etc.)
- **impressions** - Analytics/tracking

### Admin Tables

- **job_sources** - External job API configs
- **affiliate_programs** - Affiliate network configs
- **import_runs** - Import job history/status
- **audit_logs** - Change tracking
- **settings** - Site-wide config

### Supporting Tables

- **media_files** - Uploaded images/docs
- **cookie_consents** - GDPR compliance
- **pricing_plans** + **point_packages** - Monetization

---

## 🎯 Role-Based Access Matrix

| Table               | Anonymous | job_seeker | employer | moderator | admin |
|---------------------|-----------|------------|----------|-----------|-------|
| **offers** (read)   | ✅ active | ✅ active  | ✅ active | ✅ all    | ✅ all |
| **offers** (create) | ❌        | ❌         | ✅       | ✅        | ✅    |
| **offers** (update) | ❌        | ❌         | own      | ✅        | ✅    |
| **offers** (delete) | ❌        | ❌         | ❌       | ❌        | ✅    |
| **companies**       | ✅ read   | ✅ read    | ✅ CRUD  | ✅ CRUD   | ✅ CRUD |
| **blog_posts**      | ✅ pub    | ✅ pub     | ✅ pub   | ✅ CRUD   | ✅ CRUD |
| **invoices**        | ❌        | own        | own      | ✅        | ✅    |
| **import_runs**     | ❌        | ❌         | ❌       | ✅ read   | ✅ CRUD |

---

## 🛠️ Maintenance & Monitoring

### Regenerate Types (after schema changes)

```bash
# Using Supabase MCP
mcp_supabase_generate_typescript_types

# Or via Supabase CLI
npx supabase gen types typescript --project-id ngvuyarcqezvugfqfopg > lib/types/database.generated.ts
```

### Check Security Advisors

```bash
# Via MCP
mcp_supabase_get_advisors --type security
mcp_supabase_get_advisors --type performance

# Or in Supabase Dashboard → Database → Advisors
```

### Monitor Logs

```bash
# API logs
mcp_supabase_get_logs --service api

# Auth logs
mcp_supabase_get_logs --service auth

# Postgres logs
mcp_supabase_get_logs --service postgres
```

---

## 📚 Next Steps

### 1. Test Auth Flow
```bash
npm run dev
# Visit /register → create account → check profiles table
```

### 2. Test Job Creation
- Login as admin (set role in profiles table)
- Visit /admin → create job
- Check RLS policies working

### 3. Add Service Role for Imports
- Get service_role key from dashboard
- Add to `.env.local`
- Test job import from admin panel

### 4. Deploy
```bash
# Build and check types
npm run build

# Deploy to Vercel/etc
# Add env vars in deployment platform
```

---

## 🐛 Troubleshooting

### "new row violates row-level security policy"
- User doesn't have permission
- Check if user is authenticated: `supabase.auth.getUser()`
- Check user's role in profiles table
- Review RLS policies for that table

### "permission denied for table X"
- Using client key trying to bypass RLS
- Use service role key ONLY in server-side code
- Never use service role in client components

### Types out of sync
```bash
# Regenerate types
mcp_supabase_generate_typescript_types
```

### Import fails
- Check API keys in `.env.local`
- Check import_runs table for error_log
- Review console logs in admin panel

---

## 📞 Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security
- **Database Linter**: https://supabase.com/docs/guides/database/database-linter
- **Project Dashboard**: https://supabase.com/dashboard/project/ngvuyarcqezvugfqfopg

---

**✅ Your Supabase backend is production-ready with security, performance, and type safety!**


