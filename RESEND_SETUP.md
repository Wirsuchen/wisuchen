# Resend Email Service Setup (Supabase Edge Functions)

## Overview

This project uses Resend for email sending through Supabase Edge Functions. The email service has been migrated from Mailjet to Resend.

## Architecture

- **Edge Function**: `supabase/functions/resend/index.ts` - Handles email sending via Resend API
- **Service Layer**: `lib/services/email/resend.ts` - Client-side service that calls the Edge Function
- **API Route**: `app/api/newsletter/subscribe/route.ts` - Newsletter subscription endpoint

## Prerequisites

1. **Resend API Key**: Get your API key from [Resend Dashboard](https://resend.com/api-keys)
2. **Supabase Project**: Ensure your Supabase project is set up and active
3. **Environment Variables**: Set the following in your `.env.local`:

```bash
# Supabase Configuration (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Resend Configuration (optional - defaults provided)
RESEND_FROM_EMAIL=onboarding@resend.dev  # Change to your verified domain
RESEND_FROM_NAME=WIRsuchen
```

## Setup Steps

### 1. Set Resend API Key in Supabase Edge Function Secrets

The `RESEND_API_KEY` must be set as a secret in your Supabase Edge Function. You can do this via:

**Option A: Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** → **Secrets**
3. Add a new secret:
   - Name: `RESEND_API_KEY`
   - Value: Your Resend API key

**Option B: Supabase CLI**
```bash
supabase secrets set RESEND_API_KEY=your-resend-api-key --project-ref your-project-ref
```

### 2. Verify Domain in Resend (Recommended)

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Add and verify your domain
3. Update `RESEND_FROM_EMAIL` in your `.env.local` to use your verified domain

### 3. Deploy Edge Function (Already Done)

The Edge Function has been deployed. If you need to redeploy:

```bash
supabase functions deploy resend --project-ref your-project-ref
```

## Features

### Newsletter Subscription
- **Endpoint**: `POST /api/newsletter/subscribe`
- **Usage**: Footer newsletter form automatically subscribes users
- **Features**:
  - Sends welcome email to new subscribers
  - Rate limited: 10 requests per minute per IP
  - Validates email format

### Email Sending
- **Service**: `resendService.sendEmail()`
- **Features**:
  - Send transactional emails
  - HTML and plain text support
  - Multiple recipients support
  - Custom from email and name

## API Usage Examples

### Subscribe to Newsletter
```typescript
import { resendService } from '@/lib/services/email/resend'

// Subscribe with email only
await resendService.subscribeToNewsletter({
  email: 'user@example.com'
})

// Subscribe with name
await resendService.subscribeToNewsletter({
  email: 'user@example.com',
  name: 'John Doe'
})
```

### Send Email
```typescript
await resendService.sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to WIRsuchen!',
  htmlContent: '<h1>Welcome!</h1><p>Thank you for joining us.</p>',
  textContent: 'Welcome! Thank you for joining us.',
  fromEmail: 'noreply@yourdomain.com', // Optional
  fromName: 'WIRsuchen' // Optional
})
```

### Unsubscribe from Newsletter
```typescript
await resendService.unsubscribeFromNewsletter('user@example.com')
```

## Testing

1. **Test Newsletter Subscription**:
   - Go to any page with footer
   - Enter an email in the newsletter form
   - Click "Subscribe"
   - Check your email for the welcome message

2. **Test Edge Function Directly**:
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/resend \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "to": "test@example.com",
       "subject": "Test Email",
       "htmlContent": "<h1>Test</h1>"
     }'
   ```

3. **Check Logs**:
   - Check browser console for any errors
   - Check Supabase Edge Function logs in dashboard
   - Check Resend dashboard for email delivery status

## Troubleshooting

- **"RESEND_API_KEY not configured"**: Set the secret in Supabase Edge Function secrets
- **"Supabase not configured"**: Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- **"Failed to send email"**: Check Resend API key is valid and domain is verified (if using custom domain)
- **Rate limit errors**: Wait 1 minute between multiple subscription attempts
- **CORS errors**: The Edge Function includes CORS headers, but ensure your Supabase project allows the requests

## Migration from Mailjet

The following changes were made:
- ✅ Replaced `mailjetService` with `resendService`
- ✅ Updated newsletter subscription API route
- ✅ Created Supabase Edge Function for email sending
- ✅ Removed `listId` parameter (Resend handles contacts differently)

**Note**: The old Mailjet service file (`lib/services/email/mailjet.ts`) is still present but no longer used. You can remove it and the `node-mailjet` package if desired.

## Resend Dashboard

- **API Keys**: https://resend.com/api-keys
- **Domains**: https://resend.com/domains
- **Logs**: https://resend.com/emails
- **Documentation**: https://resend.com/docs

## Supabase Edge Functions

- **Dashboard**: https://supabase.com/dashboard/project/_/functions
- **Documentation**: https://supabase.com/docs/guides/functions

