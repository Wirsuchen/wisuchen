# Mailjet Email Service Setup

## Environment Variables

Add the following variables to your `.env.local` file:

```bash
#
```

## Setup Steps

1. **Add Environment Variables**
   - Copy the variables above to your `.env.local` file
   - The API key and secret key are already provided

2. **Create a Contact List in Mailjet**
   - Log in to your Mailjet account: https://app.mailjet.com
   - Go to **Contacts** → **Contact Lists**
   - Create a new list (e.g., "Newsletter Subscribers")
   - Note the List ID (you can find it in the URL or list details)
   - The service will automatically use the first available list if no listId is specified

3. **Verify Domain (Optional but Recommended)**
   - In Mailjet dashboard, go to **Account Settings** → **Sender & Domains**
   - Add and verify your domain for better email deliverability

## Features Implemented

### Newsletter Subscription
- **Endpoint**: `POST /api/newsletter/subscribe`
- **Usage**: Footer newsletter form automatically subscribes users
- **Features**:
  - Creates contact in Mailjet if doesn't exist
  - Subscribes to default newsletter list
  - Handles duplicate subscriptions gracefully
  - Rate limited: 10 requests per minute per IP

### Email Sending
- **Service**: `mailjetService.sendEmail()`
- **Features**:
  - Send transactional emails
  - HTML and plain text support
  - Multiple recipients support

## API Usage Examples

### Subscribe to Newsletter
```typescript
import { mailjetService } from '@/lib/services/email/mailjet'

// Subscribe with email only
await mailjetService.subscribeToNewsletter({
  email: 'user@example.com'
})

// Subscribe with name and specific list
await mailjetService.subscribeToNewsletter({
  email: 'user@example.com',
  name: 'John Doe',
  listId: 12345 // Optional: specific list ID
})
```

### Send Email
```typescript
await mailjetService.sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to WIRsuchen!',
  htmlContent: '<h1>Welcome!</h1><p>Thank you for joining us.</p>',
  textContent: 'Welcome! Thank you for joining us.'
})
```

## Testing

1. **Test Newsletter Subscription**:
   - Go to any page with footer
   - Enter an email in the newsletter form
   - Click "Subscribe"
   - Check Mailjet dashboard to verify contact was added

2. **Check Logs**:
   - Check browser console for any errors
   - Check server logs for Mailjet API responses

## Troubleshooting

- **"No contact lists found"**: Create a list in Mailjet dashboard first
- **"Mailjet service not configured"**: Check that environment variables are set correctly
- **Rate limit errors**: Wait 1 minute between multiple subscription attempts

## Mailjet Dashboard

- **View Subscribers**: https://app.mailjet.com/contacts
- **View Lists**: https://app.mailjet.com/contacts/lists
- **API Documentation**: https://dev.mailjet.com/email/guides/

