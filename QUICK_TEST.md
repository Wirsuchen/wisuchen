# ⚡ Quick Testing Commands

## 🚀 Start Testing in 3 Steps

### 1. Start Your App
```bash
pnpm dev
```

### 2. Health Check (2 seconds)
Open in browser:
```
http://localhost:3000/api/health
```

### 3. Run All Tests (30 seconds)
```bash
node test-api.js
```

---

## 🎯 One-Command Tests

### Check if server is running
```bash
curl http://localhost:3000
```

### Test all API endpoints
```bash
node test-api.js
```

### Health check (JSON response)
```bash
curl http://localhost:3000/api/health
```

### Test specific endpoints
```bash
# Categories
curl http://localhost:3000/api/categories

# Jobs
curl http://localhost:3000/api/jobs

# Search jobs
curl "http://localhost:3000/api/jobs?search=developer"
```

---

## ✅ Quick Manual Tests

### Authentication (2 minutes)
1. Go to: http://localhost:3000/register
2. Create account → Should redirect to dashboard
3. Logout → Should show login button
4. Login → Should redirect to dashboard ✅

### Jobs (1 minute)
1. Go to: http://localhost:3000/jobs
2. Jobs should load ✅
3. Click a job → Details show ✅

### APIs (30 seconds)
```bash
node test-api.js
```
All tests should pass ✅

---

## 🐛 If Something Breaks

### Check Environment
```bash
# Open .env.local and verify all variables are set
cat .env.local
```

### Check Health
```bash
curl http://localhost:3000/api/health | json_pp
```

### Check Console
- Open browser DevTools (F12)
- Look for red errors in Console tab
- Check Network tab for failed requests

### Check Database
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Open Table Editor
4. Check if tables have data

---

## 📋 5-Minute Test Checklist

- [ ] Health check shows "healthy"
- [ ] `node test-api.js` passes all tests
- [ ] Home page loads
- [ ] Register works
- [ ] Login works
- [ ] Dashboard loads (logged in)
- [ ] Jobs page shows listings
- [ ] No console errors

**All checked?** Your app is working! 🎉

---

## 📚 More Detailed Testing

- **Quick Guide**: `TEST_CHECKLIST.md`
- **Full Guide**: `TESTING_GUIDE.md`
- **Setup Info**: `TESTING_README.md`

---

**Happy Testing!** 🚀
