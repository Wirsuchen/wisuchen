# TalentPlus Testing Guide

This guide will help you test all features and APIs in your application to ensure everything works correctly.

## 🚀 Quick Start Testing

### 1. Start the Application
```bash
pnpm dev
```
Open: http://localhost:3000

---

## 📋 Manual Testing Checklist

### ✅ Authentication & User Management

#### Registration
- [ ] Navigate to `/register`
- [ ] Try registering with a new email
- [ ] Check if you're redirected to dashboard after successful registration
- [ ] Verify user profile is created in Supabase
- [ ] Try registering with same email (should fail)
- [ ] Test Google OAuth registration (if enabled)

#### Login
- [ ] Navigate to `/login`
- [ ] Login with correct credentials
- [ ] Should redirect to `/dashboard`
- [ ] Header should show user menu (no Login/Signup buttons)
- [ ] Try login with wrong password (should fail)
- [ ] Try "Forgot Password" feature
- [ ] Test Google OAuth login (if enabled)

#### Protected Routes
- [ ] Try accessing `/dashboard` without login → should redirect to `/login`
- [ ] Try accessing `/login` while logged in → should redirect to `/dashboard`
- [ ] Try accessing `/register` while logged in → should redirect to `/dashboard`

#### Logout
- [ ] Click logout from header
- [ ] Should redirect to home page
- [ ] Header should show Login/Signup buttons
- [ ] Cannot access `/dashboard` after logout

---

### ✅ Navigation & Layout

#### Header
- [ ] Logo links to home page
- [ ] All navigation links work (Jobs, Deals, Blog, Pricing, About, Support)
- [ ] Search bar works (both desktop and mobile)
- [ ] Mobile menu opens and closes properly
- [ ] User dropdown menu works (when logged in)
- [ ] Saved items link works

#### Footer
- [ ] All footer links are clickable
- [ ] Social media links work
- [ ] Newsletter subscription works

---

### ✅ Jobs Features

#### Job Listing
- [ ] Navigate to `/jobs`
- [ ] Jobs load properly
- [ ] Pagination works
- [ ] Filter by category works
- [ ] Filter by location works
- [ ] Filter by employment type works
- [ ] Search functionality works
- [ ] Job cards display correctly

#### Job Details
- [ ] Click on a job
- [ ] Job details page loads
- [ ] All job information displays correctly
- [ ] Apply button works
- [ ] Save/favorite button works
- [ ] Share functionality works

#### Job Import (Admin)
- [ ] Navigate to `/admin` (requires admin access)
- [ ] Test Adzuna API import
- [ ] Test RapidAPI import
- [ ] Check if jobs are imported to database
- [ ] Verify import logs

---

### ✅ Deals/Affiliates Features

#### Deals Listing
- [ ] Navigate to `/deals`
- [ ] Deals load properly
- [ ] Filter by category works
- [ ] Search works
- [ ] Deal cards display correctly

#### Affiliate Import (Admin)
- [ ] Navigate to `/admin`
- [ ] Test Awin API import
- [ ] Test Adcell API import
- [ ] Check if offers are imported
- [ ] Verify import logs

---

### ✅ Blog Features

- [ ] Navigate to `/blog`
- [ ] Blog posts load
- [ ] Click on a post
- [ ] Post content displays correctly
- [ ] Categories work
- [ ] Search works

---

### ✅ Dashboard Features

#### Overview
- [ ] Dashboard loads properly
- [ ] Stats cards show correct data
- [ ] Charts render correctly
- [ ] Recent activity displays

#### My Ads/Jobs
- [ ] View posted jobs
- [ ] Edit a job
- [ ] Delete a job
- [ ] Post new job

#### My Deals
- [ ] View saved deals
- [ ] Remove deals
- [ ] Track clicks

#### Profile
- [ ] View profile
- [ ] Edit profile information
- [ ] Upload avatar
- [ ] Change password

#### Invoices
- [ ] View invoices
- [ ] Download invoice PDF
- [ ] Filter invoices

---

### ✅ Payment Features

#### PayPal Integration
- [ ] Navigate to pricing page
- [ ] Select a plan
- [ ] Click purchase
- [ ] PayPal popup opens
- [ ] Complete payment (use sandbox)
- [ ] Check if payment is recorded
- [ ] Verify invoice is created

---

### ✅ Admin Features

- [ ] Access admin panel (requires admin role)
- [ ] View all users
- [ ] View all jobs/offers
- [ ] Approve/reject pending items
- [ ] Manage categories
- [ ] View analytics
- [ ] Import jobs
- [ ] Import affiliates

---

## 🔧 API Testing

### Test API Endpoints

You can use the provided API test script or test manually with tools like:
- **Postman**
- **Thunder Client** (VS Code extension)
- **cURL**
- **Browser DevTools**

### API Endpoints to Test

#### 1. Categories API
```bash
# Get all categories
GET http://localhost:3000/api/categories

# Get job categories only
GET http://localhost:3000/api/categories?type=job

# Get affiliate categories
GET http://localhost:3000/api/categories?type=affiliate

# Search categories
GET http://localhost:3000/api/categories?search=tech&limit=10
```

#### 2. Jobs API
```bash
# Get all jobs
GET http://localhost:3000/api/jobs

# Get jobs with filters
GET http://localhost:3000/api/jobs?category=tech&location=Berlin&limit=20

# Get specific job
GET http://localhost:3000/api/jobs/[job-id]

# Create new job (requires auth)
POST http://localhost:3000/api/jobs
Content-Type: application/json

{
  "title": "Test Job",
  "company": "Test Company",
  "description": "Test description",
  "location": "Berlin",
  "employment_type": "full-time"
}

# Update job (requires auth)
PUT http://localhost:3000/api/jobs/[job-id]
Content-Type: application/json

{
  "title": "Updated Title"
}

# Delete job (requires auth)
DELETE http://localhost:3000/api/jobs/[job-id]
```

#### 3. Job Import API (Admin)
```bash
# Import jobs from Adzuna
POST http://localhost:3000/api/import/jobs
Content-Type: application/json

{
  "source": "adzuna",
  "query": "developer",
  "location": "germany",
  "limit": 50
}

# Check import status
GET http://localhost:3000/api/import/jobs?run_id=[import-run-id]
```

#### 4. Affiliate Import API (Admin)
```bash
# Import from Awin
POST http://localhost:3000/api/import/affiliates
Content-Type: application/json

{
  "source": "awin",
  "category": "electronics",
  "limit": 100
}

# Import from Adcell
POST http://localhost:3000/api/import/affiliates
Content-Type: application/json

{
  "source": "adcell",
  "program_id": "12345"
}

# Check import status
GET http://localhost:3000/api/import/affiliates?run_id=[import-run-id]
```

#### 5. Payment API
```bash
# Create PayPal order
POST http://localhost:3000/api/payment/paypal
Content-Type: application/json

{
  "amount": 29.99,
  "currency": "EUR",
  "description": "Premium Plan"
}

# Capture payment
PUT http://localhost:3000/api/payment/paypal
Content-Type: application/json

{
  "orderId": "paypal-order-id"
}

# Get payment status
GET http://localhost:3000/api/payment/paypal?payment_id=[payment-id]
```

---

## 🧪 Automated Testing

### Run Test Script

I've created an API test script for you. Run it with:

```bash
node test-api.js
```

This will test all your API endpoints automatically.

---

## 🔍 Database Testing

### Check Supabase Data

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Navigate to Table Editor

#### Tables to Verify:
- **profiles** - User data after registration
- **offers** - Jobs and affiliate offers
- **categories** - Categories data
- **payments** - Payment records
- **invoices** - Generated invoices
- **import_runs** - Import logs
- **impressions** - Analytics tracking

### Run SQL Queries

In Supabase SQL Editor:

```sql
-- Check total users
SELECT COUNT(*) FROM profiles;

-- Check active jobs
SELECT COUNT(*) FROM offers WHERE status = 'active' AND offer_type = 'job';

-- Check recent imports
SELECT * FROM import_runs ORDER BY created_at DESC LIMIT 10;

-- Check payments
SELECT * FROM payments ORDER BY created_at DESC LIMIT 10;

-- Check categories
SELECT * FROM categories ORDER BY offers_count DESC;
```

---

## 🐛 Common Issues to Check

### Environment Variables
- [ ] `.env.local` exists and has all required variables
- [ ] Supabase credentials are correct
- [ ] API keys are valid (Adzuna, RapidAPI, Awin, Adcell, PayPal)
- [ ] PayPal is in sandbox mode for testing

### Authentication
- [ ] Supabase Auth is configured
- [ ] Redirect URLs are set correctly
- [ ] Email verification works (check spam folder)

### APIs
- [ ] External API keys are not expired
- [ ] API rate limits not exceeded
- [ ] Network requests succeed (check browser console)

### Database
- [ ] RLS policies are enabled
- [ ] User has correct permissions
- [ ] Tables exist and have correct schema

---

## 📊 Testing Checklist Summary

### Critical Features (Must Work)
- ✅ User Registration & Login
- ✅ Protected Routes
- ✅ Job Listing & Details
- ✅ Dashboard Access
- ✅ Payment Processing
- ✅ API Endpoints

### Important Features (Should Work)
- ✅ Job Import
- ✅ Affiliate Import
- ✅ Search & Filters
- ✅ Profile Management
- ✅ Admin Panel

### Nice to Have (Good if Working)
- ✅ Blog
- ✅ Analytics
- ✅ Email Notifications
- ✅ Social Sharing

---

## 🚨 Error Monitoring

### Check Browser Console
- Press F12 → Console tab
- Look for red errors
- Check Network tab for failed requests

### Check Server Logs
- Look at terminal where `pnpm dev` is running
- Check for error messages
- Look for failed API calls

### Check Supabase Logs
- Go to Supabase Dashboard
- Click "Logs" tab
- Filter by Error level

---

## ✅ Final Checklist

Before deploying to production:

- [ ] All manual tests pass
- [ ] All API tests pass
- [ ] Database is populated correctly
- [ ] Payment flow works end-to-end
- [ ] No console errors
- [ ] No broken links
- [ ] Responsive on mobile
- [ ] SEO meta tags present
- [ ] Images load correctly
- [ ] Forms validate properly
- [ ] Error messages are user-friendly

---

## 📞 Getting Help

If something doesn't work:
1. Check the error message
2. Look at browser console
3. Check server logs
4. Verify environment variables
5. Check Supabase logs
6. Review this testing guide

---

Happy Testing! 🎉
