# Quick Testing Checklist ✅

Use this checklist to quickly verify all features are working.

## 🚀 Before You Start
- [ ] Run `pnpm dev`
- [ ] Open http://localhost:3000
- [ ] Open Browser DevTools (F12)
- [ ] Check `.env.local` has all API keys

---

## ⚡ Quick Test (5 minutes)

### Authentication Flow
- [ ] Register new account → redirects to dashboard
- [ ] Logout → shows login/signup buttons
- [ ] Login → redirects to dashboard
- [ ] Header shows user menu (no login buttons)

### Navigation
- [ ] All header links work
- [ ] Mobile menu works
- [ ] Footer links work

### Core Features
- [ ] Jobs page loads with data
- [ ] Job details page works
- [ ] Deals page loads
- [ ] Dashboard loads (when logged in)
- [ ] Search works

---

## 🔍 Detailed Test (15 minutes)

### Pages
- [ ] Home - http://localhost:3000
- [ ] Jobs - http://localhost:3000/jobs
- [ ] Deals - http://localhost:3000/deals
- [ ] Blog - http://localhost:3000/blog
- [ ] Pricing - http://localhost:3000/pricing
- [ ] About - http://localhost:3000/about
- [ ] Support - http://localhost:3000/support
- [ ] Login - http://localhost:3000/login
- [ ] Register - http://localhost:3000/register
- [ ] Dashboard - http://localhost:3000/dashboard

### APIs (Run: `node test-api.js`)
- [ ] Categories API working
- [ ] Jobs API working
- [ ] Import APIs responding
- [ ] Payment API responding

### Database (Check Supabase)
- [ ] User created in `profiles` table
- [ ] Categories exist
- [ ] Jobs/offers exist
- [ ] Tables have proper structure

---

## 🎯 Full Test (30 minutes)

Use the comprehensive **TESTING_GUIDE.md** for:
- Detailed feature testing
- API endpoint testing
- Payment flow testing
- Admin features testing
- Error handling testing

---

## ⚠️ Common Issues

### "Supabase client error"
- Check `.env.local` has correct Supabase credentials
- Restart dev server after changing env vars

### "API key invalid"
- Verify API keys in `.env.local`
- Check if keys are expired
- Test keys individually

### "Cannot connect to database"
- Check Supabase project is active
- Verify internet connection
- Check RLS policies in Supabase

### "Payment not working"
- Ensure PayPal is in sandbox mode
- Check PayPal credentials
- Verify PayPal developer account is active

---

## 📊 Testing Tools

### Automated Testing
```bash
# Test all API endpoints
node test-api.js
```

### Manual API Testing
- **Thunder Client**: Import `thunder-tests/thunder-collection_TalentPlus-APIs.json`
- **Postman**: Create requests from TESTING_GUIDE.md
- **Browser**: Use DevTools Network tab

### Database Testing
- **Supabase Dashboard**: https://supabase.com/dashboard
- **SQL Editor**: Run queries to check data
- **Table Editor**: View table contents

---

## ✅ Pre-Deployment Checklist

- [ ] All quick tests pass
- [ ] No console errors
- [ ] All API tests pass (run `node test-api.js`)
- [ ] Payment flow works end-to-end
- [ ] Database has correct structure
- [ ] Environment variables configured
- [ ] Mobile responsive
- [ ] No broken links
- [ ] Images load correctly
- [ ] Forms validate properly

---

## 🎉 Success Criteria

Your app is ready when:
1. ✅ Users can register and login
2. ✅ Dashboard loads for authenticated users
3. ✅ Jobs page shows listings
4. ✅ Search and filters work
5. ✅ No critical errors in console
6. ✅ Payment flow completes (in sandbox)
7. ✅ All main pages load without errors

---

**Need help?** Check `TESTING_GUIDE.md` for detailed instructions.
