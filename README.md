# TalentPlus — API Integration & Frontend Testing Guide

This guide explains how the API integrations (Jobs, Affiliates, Payments) are wired into the frontend, and how to test them end‑to‑end in your local environment.

## Overview

Implemented services and UIs:

- Jobs
  - Backend: `app/api/jobs/route.ts`
  - Frontend: `app/jobs/page.tsx` using `components/jobs/job-list.tsx`
  - Categories API used by search: `app/api/categories/route.ts`
- Affiliate Imports
  - Backend: `app/api/import/affiliates/route.ts`
  - Frontend Admin UI: `components/admin/affiliate-import.tsx` surfacing in `app/admin/page.tsx`
- Job Imports
  - Backend: `app/api/import/jobs/route.ts`
  - Frontend Admin UI: `components/admin/job-import.tsx` surfacing in `app/admin/page.tsx`
- Payments (PayPal)
  - Backend: `app/api/payment/paypal/route.ts`
  - Frontend: `app/payment/page.tsx` with `components/payment/paypal-checkout.tsx`
  - Result pages: `app/payment/success/page.tsx`, `app/payment/cancel/page.tsx`

All endpoints are protected by Supabase Auth where appropriate, and admin-only actions require elevated roles.

## Prerequisites

- Node.js 18+
- A Supabase project (URL + anon key)
- API keys for external providers (Adzuna, RapidAPI, Awin, Adcell, PayPal)

## Environment Variables

Copy `.env.example` to `.env.local` and fill the values:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Job APIs
ADZUNA_APP_ID=...
ADZUNA_API_KEY=...
RAPIDAPI_KEY=...

# Affiliate APIs
AWIN_OAUTH_TOKEN=...
ADCELL_LOGIN=...
ADCELL_PASSWORD=...

# PayPal
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=sandbox

# Optional
# NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Notes:
- When `NEXT_PUBLIC_APP_URL` is not set, some return links default to `window.location.origin` at runtime.
- Keep real keys out of version control.

## Install & Run

```
# Install deps
pnpm install
# or: npm install / yarn

# Start dev
pnpm dev
# or: npm run dev / yarn dev
```

Visit http://localhost:3000

## Seed and Auth

- Ensure your Supabase schema and RLS are applied (already prepared in `supabase/schema.sql` and `supabase/rls-policies.sql`).
- Log in or register via your app’s auth UI.
- To access admin features (`/admin`), the logged-in user must have one of the roles: `supervisor`, `admin`, `moderator`.
  - Update the `profiles.role` column in Supabase for your user to one of these roles.

## What’s Wired Up

- Jobs UI calls `GET /api/jobs` with filters and pagination and uses `GET /api/categories` to populate category filters.
- Admin Import UIs call:
  - `POST /api/import/jobs` with `source` = `adzuna` | `rapidapi-employment-agency` | `rapidapi-glassdoor` | `rapidapi-aggregate`
  - `POST /api/import/affiliates` with `source` = `awin` | `adcell`
  - Both pages poll `GET` on their respective endpoints with `import_run_id` to show progress.
- Payments UI calls:
  - `POST /api/payment/paypal` to create an order and invoice
  - `PUT /api/payment/paypal` to capture (optionally)
  - `GET /api/payment/paypal?order_id=...` to poll status

## End-to-End Testing

1. Login
   - Navigate to `/login` and authenticate.

2. Jobs Page
   - Open `/jobs`
   - Use search and filters; the list should update using `GET /api/jobs`.
   - Confirm categories are shown (fetched from `GET /api/categories?type=job`).

3. Admin Import (Jobs)
   - Navigate to `/admin`
   - Open the “Job Import” tab.
   - Select a source (e.g., `adzuna`) and set parameters (query/location).
   - Click “Start Import”.
   - A new import run will start; progress is polled via `GET /api/import/jobs?import_run_id=...`.
   - When complete, the summary (created/updated/failed) is shown.

4. Admin Import (Affiliates)
   - On `/admin`, open the “Affiliates” tab.
   - Select `awin` or `adcell`, set keywords/min commission, and import.
   - Progress similarly appears, and `affiliate_programs` list updates.

5. Payments (PayPal)
   - Navigate to `/payment`
   - Pick a package (or enter a custom amount) and create an order.
   - You’ll be redirected to PayPal (approval URL opens in a new tab).
   - After approval, you can poll the status automatically, and the success page is at `/payment/success`.

## API Smoke Tests (optional)

Use curl or Postman with your session cookie if needed.

- Jobs
  ```bash
  curl "http://localhost:3000/api/jobs?page=1&limit=10"
  ```
- Categories
  ```bash
  curl "http://localhost:3000/api/categories?type=job"
  ```
- Job Import (auth + role required)
  ```bash
  curl -X POST http://localhost:3000/api/import/jobs \
    -H 'Content-Type: application/json' \
    -d '{
      "source": "adzuna",
      "params": { "what": "developer", "where": "berlin" },
      "limit": 20
    }'
  ```
- Affiliate Import (auth + role required)
  ```bash
  curl -X POST http://localhost:3000/api/import/affiliates \
    -H 'Content-Type: application/json' \
    -d '{
      "source": "awin",
      "params": { "keywords": "technology" },
      "limit": 20
    }'
  ```
- Payments (auth required)
  ```bash
  curl -X POST http://localhost:3000/api/payment/paypal \
    -H 'Content-Type: application/json' \
    -d '{
      "amount": "29.99",
      "currency": "EUR",
      "description": "Premium Job Posting",
      "items": [{ "name": "Premium Job Posting", "quantity": 1, "unit_amount": "29.99" }]
    }'
  ```

## Troubleshooting

- 401 Unauthorized
  - Ensure you’re logged in.
  - Admin routes require `profiles.role` in (`supervisor`, `admin`, `moderator`).
- Missing API keys
  - Verify `.env.local` values.
  - Check `lib/config/api-keys.ts` and its `validateApiKeys()` helper if needed.
- PayPal errors
  - Ensure `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE` are set.
  - Sandbox mode uses `https://api.sandbox.paypal.com`.
- No categories
  - Ensure `categories` table has rows with `is_active=true` and correct `type`.
- Imports create pending jobs
  - This is by design: imported jobs default to `status=pending` for manual review in some cases. Adjust in `app/api/import/jobs/route.ts` if you want auto-approve.

## Production Notes

- Switch PayPal to `PAYPAL_MODE=live` and set live credentials.
- Add CRON or scheduled jobs for periodic imports.
- Ensure RLS policies are correct and least-privilege.
- Never expose service role keys to the browser.

## File Map (Key Paths)

- Jobs UI: `app/jobs/page.tsx`, `components/jobs/job-list.tsx`
- Categories API: `app/api/categories/route.ts`
- Jobs API: `app/api/jobs/route.ts`
- Admin UI: `app/admin/page.tsx`, `components/admin/job-import.tsx`, `components/admin/affiliate-import.tsx`
- Affiliate Import API: `app/api/import/affiliates/route.ts`
- Job Import API: `app/api/import/jobs/route.ts`
- Payments UI: `app/payment/page.tsx`, `app/payment/success/page.tsx`, `app/payment/cancel/page.tsx`
- PayPal API: `app/api/payment/paypal/route.ts`

---

If you need me to add navigation links or a sidebar entry to reach `/admin` and `/payment` from the main layout, let me know and I’ll wire that up as well.
