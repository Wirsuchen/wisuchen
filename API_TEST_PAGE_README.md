# API Testing Playground 🧪

A built-in frontend interface to test all API endpoints with dummy data and see live results.

---

## 🚀 How to Access

### Method 1: From Dashboard
1. Login to your account
2. Go to Dashboard
3. Click **"API Testing"** button in Quick Actions

### Method 2: Direct URL
```
http://localhost:3000/api-test
```

**Note**: You must be logged in to access this page.

---

## ✨ Features

### 📊 Live Testing Interface
- **Test any endpoint with one click**
- **See real-time results**
- **Visual success/error indicators**
- **JSON response preview**
- **Request/response details**

### 🎯 Organized by Categories
- **Categories** - Test category endpoints
- **Jobs** - Test job CRUD operations
- **Other** - Import APIs, Payment APIs, Health Check

### 🔍 What Gets Tested

#### Categories API
- ✅ Get all categories
- ✅ Get job categories
- ✅ Get affiliate categories
- ✅ Search categories

#### Jobs API
- ✅ Get all jobs
- ✅ Get jobs (paginated)
- ✅ Search jobs
- ✅ Filter by location
- ✅ Filter by employment type
- ✅ Create job (POST with dummy data)

#### Import APIs
- ✅ Get import job status
- ✅ Get affiliate programs

#### Payment API
- ✅ Get payment status
- ✅ Create PayPal order (with dummy data)

#### System
- ✅ Health check

---

## 📸 Interface Overview

### Top Section - Quick Actions
```
┌─────────────────────────────────────────────────┐
│  [Test Health] [Run All Tests] [Clear Results] │
└─────────────────────────────────────────────────┘
```

### Left Panel - Test Controls
```
┌──────────────────────┐
│  Categories          │
│  ├── Test All        │
│  ├── GET /categories │
│  └── ...             │
│                      │
│  Jobs                │
│  ├── Test All        │
│  ├── GET /jobs       │
│  ├── POST /jobs      │
│  └── ...             │
│                      │
│  Other               │
│  ├── Import APIs     │
│  ├── Payment         │
│  └── Health          │
└──────────────────────┘
```

### Right Panel - Live Results
```
┌────────────────────────────────┐
│  Test Results (5 tests)        │
│  ──────────────────────────    │
│  ✓ Get All Categories          │
│     GET | 200 | 10:23:45       │
│     { data: [...] }            │
│                                │
│  ✗ Create Job                  │
│     POST | 401 | 10:23:50      │
│     Error: Unauthorized        │
└────────────────────────────────┘
```

---

## 🎮 How to Use

### Test a Single Endpoint
1. Navigate to the appropriate tab (Categories/Jobs/Other)
2. Click any endpoint button
3. See result appear instantly in right panel

### Test All Endpoints in a Category
1. Click **"Test All"** button for that category
2. Watch as each endpoint is tested sequentially
3. Results appear one by one in real-time

### Run Complete Test Suite
1. Click **"Run All Tests"** at the top
2. All endpoints will be tested automatically
3. Review comprehensive results

### Clear Results
Click **"Clear Results"** button to start fresh

---

## 📋 Understanding Results

### Success (Green Border)
```
✓ Get All Jobs
  GET | 200 | 10:23:45
  {
    "data": [...],
    "total": 150
  }
```
- ✅ Green checkmark
- ✅ Status code 200-299
- ✅ Response data displayed

### Error (Red Border)
```
✗ Create Job
  POST | 401 | 10:23:50
  {
    "error": "Unauthorized"
  }
```
- ❌ Red X icon
- ❌ Status code 400+
- ❌ Error message displayed

### Result Details
Each result shows:
- **Endpoint name** - What was tested
- **HTTP method** - GET, POST, PUT, DELETE
- **Status code** - 200, 404, 500, etc.
- **Timestamp** - When the test ran
- **Response data** - Full JSON response

---

## 🧪 Dummy Data Used

### Job Creation (POST /api/jobs)
```json
{
  "title": "Test Senior Developer Position",
  "company": "Test Tech Company",
  "description": "This is a test job posting...",
  "location": "Berlin, Germany",
  "employment_type": "full-time",
  "salary_min": 60000,
  "salary_max": 90000,
  "offer_type": "job",
  "status": "pending"
}
```

### Payment Creation (POST /api/payment/paypal)
```json
{
  "amount": 29.99,
  "currency": "EUR",
  "description": "Test Premium Plan Payment",
  "item_type": "pricing_plan",
  "item_id": "test-plan-id"
}
```

---

## 🔒 Security

### Protected Route
- ✅ Requires authentication
- ✅ Redirects to login if not authenticated
- ✅ Shows user badge in header

### Safe Testing
- ✅ Uses dummy data
- ✅ No destructive operations on production data
- ✅ POST operations create test records (can be deleted later)
- ✅ No sensitive data exposed

---

## 💡 Use Cases

### For Developers
- **Debug API endpoints** without Postman
- **Test after code changes**
- **Verify API responses**
- **Check endpoint availability**

### For QA/Testing
- **Manual API testing**
- **Verify API contracts**
- **Test error handling**
- **Generate test reports**

### For Product Managers
- **Understand API capabilities**
- **See actual API responses**
- **Verify feature implementation**

### For Learning
- **See how APIs work**
- **Understand REST principles**
- **Learn about HTTP methods**
- **Explore response structures**

---

## 🎯 Quick Test Scenarios

### Scenario 1: Test if APIs are working
```
1. Click "Run All Tests"
2. Wait for completion
3. Check how many passed
4. ✅ If all pass, APIs are working!
```

### Scenario 2: Debug a specific endpoint
```
1. Navigate to relevant tab
2. Click specific endpoint button
3. Review response data
4. ✅ See exactly what the API returns
```

### Scenario 3: Test after deployment
```
1. Deploy your changes
2. Go to API Test page
3. Run all tests
4. ✅ Verify everything still works
```

---

## 🐛 Troubleshooting

### "Redirected to login"
- **Issue**: Not authenticated
- **Solution**: Login to your account first

### All tests show 401 errors
- **Issue**: Session expired
- **Solution**: Logout and login again

### Tests timing out
- **Issue**: Server not running or slow
- **Solution**: Check if `pnpm dev` is running

### No results showing
- **Issue**: API server error
- **Solution**: Check browser console for errors

---

## 📊 Comparison with Other Testing Tools

| Feature | API Test Page | Postman | cURL | test-api.js |
|---------|---------------|---------|------|-------------|
| **GUI Interface** | ✅ Built-in | ✅ Desktop app | ❌ | ❌ |
| **No Setup** | ✅ | ❌ | ✅ | ✅ |
| **Live Results** | ✅ | ✅ | ✅ | ✅ |
| **Auto Auth** | ✅ | ❌ Manual | ❌ Manual | ❌ |
| **Dummy Data** | ✅ | ❌ Manual | ❌ Manual | ✅ |
| **Visual Feedback** | ✅ | ✅ | ❌ | ⚠️ Terminal |
| **One Click Tests** | ✅ | ⚠️ Collections | ❌ | ✅ |

---

## 🚀 Advanced Features

### Batch Testing
Run multiple endpoints in sequence with "Test All" buttons

### Result History
All results are kept in session (until page refresh or cleared)

### Response Inspection
Full JSON responses shown with syntax formatting

### Real-time Updates
Results appear instantly as tests complete

### Error Details
Full error messages and stack traces when available

---

## 🎓 Best Practices

### 1. Test After Changes
Always run tests after modifying API code

### 2. Check Health First
Start with health check to verify everything is configured

### 3. Test One at a Time
When debugging, test individual endpoints

### 4. Clear Old Results
Clear results periodically to avoid confusion

### 5. Note Failed Tests
Pay attention to failed tests - they indicate issues

---

## 📝 Example Testing Workflow

### Daily Development
```
1. Start dev server: pnpm dev
2. Make code changes
3. Go to /api-test
4. Test affected endpoints
5. Fix any failures
6. ✅ Commit when all pass
```

### Before Deployment
```
1. Go to /api-test
2. Click "Run All Tests"
3. Review all results
4. ✅ Deploy if all pass
5. ❌ Fix failures first if any fail
```

### When Bugs Reported
```
1. Reproduce the bug
2. Go to /api-test
3. Test related endpoint
4. See the error response
5. ✅ Fix based on actual error
```

---

## 🎉 Benefits

### ✨ Convenience
- No need to leave the browser
- No external tools required
- Already authenticated

### 🚀 Speed
- One-click testing
- Instant feedback
- No configuration needed

### 🎯 Accuracy
- Tests real endpoints
- Uses actual API code
- Shows real responses

### 📚 Learning
- See how APIs work
- Understand request/response
- Learn by doing

---

## 📞 Support

If you encounter issues:
1. Check browser console (F12)
2. Verify you're logged in
3. Check dev server is running
4. Try refreshing the page
5. Clear browser cache

---

## 🎊 Summary

The API Testing Playground is your **all-in-one solution** for testing API endpoints directly in the browser. No external tools, no complex setup - just login and start testing!

**Access it now**: http://localhost:3000/api-test

---

**Happy Testing! 🚀**
