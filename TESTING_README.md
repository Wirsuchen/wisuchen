# Testing Your TalentPlus Application 🧪

Complete guide to test all features and APIs in your application.

---

## 📚 Testing Resources Created

I've created several testing resources for you:

1. **TESTING_GUIDE.md** - Comprehensive testing documentation
2. **TEST_CHECKLIST.md** - Quick checklist for rapid testing
3. **test-api.js** - Automated API testing script
4. **thunder-tests/** - Thunder Client collection for VS Code
5. **/api/health** - Health check endpoint

---

## 🚀 Quick Start (Choose One)

### Option 1: Automated API Testing (Fastest)
```bash
# Make sure dev server is running
pnpm dev

# In another terminal, run:
node test-api.js
```
✅ Tests all API endpoints automatically  
✅ Provides detailed pass/fail report  
✅ Takes ~30 seconds

### Option 2: Health Check (Quickest)
```bash
# Visit in browser or curl:
http://localhost:3000/api/health
```
✅ Checks all environment variables  
✅ Verifies Supabase connection  
✅ Shows API configuration status  
✅ Takes 2 seconds

### Option 3: Manual Checklist
Open `TEST_CHECKLIST.md` and follow the step-by-step guide.
✅ Tests UI and user flows  
✅ Verifies authentication  
✅ Checks all pages load  
✅ Takes 5-15 minutes

### Option 4: Full Testing
Open `TESTING_GUIDE.md` for comprehensive testing instructions.
✅ Complete feature testing  
✅ Database verification  
✅ Payment flow testing  
✅ Takes 30-60 minutes

---

## 🛠️ Testing Tools Setup

### For VS Code Users (Thunder Client)

1. Install Thunder Client extension
2. Open Thunder Client tab
3. Click "Collections" → "Import"
4. Select `thunder-tests/thunder-collection_TalentPlus-APIs.json`
5. Start testing APIs with one click!

### For Postman Users

Use the API examples in `TESTING_GUIDE.md` to create your Postman collection.

---

## 📊 What to Test

### Critical (Must Work) ⚠️
- ✅ User registration and login
- ✅ Dashboard access
- ✅ Jobs listing and details
- ✅ Supabase connection
- ✅ Protected routes redirect

### Important (Should Work) 
- ✅ Job import from APIs
- ✅ Affiliate import
- ✅ Search and filters
- ✅ Payment processing
- ✅ Profile management

### Nice to Have
- ✅ Blog functionality
- ✅ Analytics
- ✅ Email notifications
- ✅ Social sharing

---

## 🎯 Testing Workflow

### Daily Development Testing
```bash
# 1. Start dev server
pnpm dev

# 2. Quick health check
curl http://localhost:3000/api/health

# 3. Run automated tests
node test-api.js
```

### Before Committing Code
- [ ] Run `node test-api.js` - all tests pass
- [ ] Check browser console - no errors
- [ ] Test the feature you changed manually
- [ ] Quick checklist from `TEST_CHECKLIST.md`

### Before Deployment
- [ ] Complete full testing from `TESTING_GUIDE.md`
- [ ] All API tests pass
- [ ] Payment flow works end-to-end
- [ ] Test on mobile device
- [ ] No console errors
- [ ] Database properly seeded

---

## 🔍 Testing Each Feature

### Authentication
```bash
# Manual test flow:
1. Go to /register → Create account
2. Should redirect to /dashboard
3. Logout → Go to /login
4. Login → Should redirect to /dashboard
5. Try accessing /dashboard logged out → Should redirect to /login

# Check database:
Supabase → profiles table → Your user should exist
```

### Jobs Feature
```bash
# API test:
curl http://localhost:3000/api/jobs

# Manual test:
1. Go to /jobs
2. Jobs should load
3. Click a job → Details should show
4. Search should work
5. Filters should work

# Check database:
Supabase → offers table → Jobs should exist with offer_type='job'
```

### Import Feature
```bash
# Test job import (requires admin):
curl -X POST http://localhost:3000/api/import/jobs \
  -H "Content-Type: application/json" \
  -d '{"source":"adzuna","query":"developer","location":"germany","limit":10}'

# Check logs:
Supabase → import_runs table → Import should be logged
Supabase → offers table → New jobs should appear
```

### Payment Feature
```bash
# Manual test flow:
1. Login to app
2. Go to /pricing
3. Select a plan
4. Click "Purchase"
5. PayPal popup should open
6. Complete payment (use sandbox account)
7. Should redirect back with success

# Check database:
Supabase → payments table → Payment should be recorded
Supabase → invoices table → Invoice should be created
```

---

## 🐛 Troubleshooting

### Tests Failing?

**"Cannot connect to server"**
```bash
# Make sure dev server is running:
pnpm dev
```

**"Supabase error"**
```bash
# Check environment variables:
# Open .env.local and verify:
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

**"API key invalid"**
```bash
# Verify API keys in .env.local
# Check if they're not expired
# Test health endpoint:
curl http://localhost:3000/api/health
```

**"Database connection failed"**
```bash
# Check Supabase project is active
# Go to: https://supabase.com/dashboard
# Verify project is running
```

---

## 📈 Test Results Interpretation

### Automated Test Results (`node test-api.js`)

```
✓ Green = Pass = Feature working correctly
✗ Red = Fail = Something is broken, check error message
ℹ Blue = Info = Additional information or skipped test
```

**100% Pass Rate** = Your app is in great shape! 🎉  
**80-99% Pass Rate** = Minor issues, check failed tests  
**Below 80%** = Major issues, review errors carefully  

### Health Check Results (`/api/health`)

```json
{
  "status": "healthy"  // ✅ All good!
  "status": "degraded" // ⚠️ Some env vars missing but working
  "status": "unhealthy" // ❌ Critical issues (e.g., DB down)
}
```

---

## 📝 Test Documentation

### For Each Feature, Document:
1. **What to test** - Specific functionality
2. **How to test** - Step-by-step instructions
3. **Expected result** - What should happen
4. **Actual result** - What actually happened
5. **Status** - Pass/Fail/Skip

### Example Test Case:
```
Feature: User Registration
Test: Register new user with email/password
Steps:
  1. Navigate to /register
  2. Enter email: test@example.com
  3. Enter password: SecurePass123!
  4. Click "Sign Up"
Expected: Redirect to /dashboard, user created in DB
Actual: ✅ Redirected to dashboard, user found in profiles table
Status: PASS
```

---

## 🎓 Best Practices

1. **Test after every major change**
2. **Run automated tests before committing**
3. **Check browser console for errors**
4. **Verify database changes in Supabase**
5. **Test on different browsers**
6. **Test responsive design on mobile**
7. **Use sandbox/test mode for payments**
8. **Keep test credentials separate**

---

## 🚀 Next Steps

1. **Start with health check**: `http://localhost:3000/api/health`
2. **Run automated tests**: `node test-api.js`
3. **Follow quick checklist**: `TEST_CHECKLIST.md`
4. **Deep dive if needed**: `TESTING_GUIDE.md`

---

## 📞 Need Help?

If tests are failing:
1. Check error messages carefully
2. Review `TESTING_GUIDE.md` troubleshooting section
3. Verify environment variables in `.env.local`
4. Check Supabase dashboard for database issues
5. Look at browser console for frontend errors
6. Check terminal for backend errors

---

**Happy Testing! 🎉**

Your TalentPlus application is built with best practices. These testing tools ensure everything works perfectly before deployment.
