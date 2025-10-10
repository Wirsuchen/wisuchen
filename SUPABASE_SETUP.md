# TalentPlus Supabase Backend Setup Guide

This guide will help you set up the complete Supabase backend for TalentPlus, a comprehensive job portal with affiliate feeds, CMS, payments, and analytics.

## 🚀 Quick Start

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose your organization and project name
3. Select a region close to your users
4. Wait for the project to be provisioned

### 2. Environment Variables

Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database URL (for direct database connections)
DATABASE_URL=your_database_url
```

Get these values from your Supabase project dashboard:
- Go to Settings → API
- Copy the Project URL and anon/public key

### 3. Install Dependencies

```bash
# Using npm
npm install @supabase/supabase-js @supabase/ssr

# Using yarn
yarn add @supabase/supabase-js @supabase/ssr

# Using pnpm
pnpm add @supabase/supabase-js @supabase/ssr

# Using bun
bun add @supabase/supabase-js @supabase/ssr
```

### 4. Run Database Schema

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/schema.sql`
4. Run the script to create all tables, functions, and triggers

### 5. Set Up Row Level Security

1. In the SQL Editor, copy and paste the contents of `supabase/rls-policies.sql`
2. Run the script to enable RLS and create all security policies

### 6. Configure Authentication

1. Go to Authentication → Settings in your Supabase dashboard
2. Configure your site URL: `http://localhost:3000` (for development)
3. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback` (for production)

#### Optional: Enable Social Authentication

For Google OAuth:
1. Go to Authentication → Providers
2. Enable Google provider
3. Add your Google OAuth credentials (Client ID and Secret)

## 📊 Database Schema Overview

### Core Tables

#### Users & Authentication
- `profiles` - User profiles with role-based access control
- `companies` - Company profiles for employers
- `audit_logs` - System audit trail

#### Content Management
- `categories` - Hierarchical categories (jobs, affiliates, blog)
- `offers` - Main table for job ads and affiliate offers
- `blog_posts` - CMS for blog content
- `media_files` - File uploads and media management

#### Business Logic
- `job_sources` - External API configurations for job imports
- `import_runs` - Track import operations
- `affiliate_programs` - Affiliate network configurations
- `pricing_plans` - Pricing tiers for job postings
- `point_packages` - Point-based pricing system

#### E-Commerce & Compliance
- `invoices` - E-invoice compliant billing (German law)
- `invoice_items` - Invoice line items
- `payments` - Payment tracking and processing
- `cookie_consents` - GDPR compliance

#### Analytics & Tracking
- `impressions` - Track views, clicks, and interactions
- `settings` - Site-wide configuration

### User Roles & Permissions

The system supports role-based access control with the following roles:

- **Supervisor** - Full system access
- **Admin** - Manage system, categories, API keys
- **Moderator** - Approve/decline jobs and blog posts
- **Lister/Publisher** - Create and edit job ads
- **Blogger/Editor** - Create and manage blog content
- **Analyst** - Read-only analytics access
- **Job Seeker** - Browse jobs, apply, manage profile
- **Employer** - Post jobs, manage company profile

## 🔧 Configuration

### Storage Buckets

Create the following storage buckets in Supabase:

1. **public-media** (Public)
   - Job images, logos, avatars
   - Company logos and covers
   - Blog post images

2. **invoices** (Private)
   - PDF invoices
   - E-invoice XML files

3. **system** (Private)
   - Site logos, favicons
   - System assets

### Environment-Specific Settings

#### Development
```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
```

#### Production
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_AUTH_SITE_URL=https://yourdomain.com
SUPABASE_AUTH_ADDITIONAL_REDIRECT_URLS=https://yourdomain.com/**
```

## 🔄 Data Flow Examples

### Job Import Workflow
1. Cron job triggers import from external API (Awin, Adzuna, etc.)
2. Data is processed and upserted into `offers` table
3. Triggers automatically update `categories.offers_count`
4. RLS policies ensure proper access control

### User Registration Flow
1. User signs up via Supabase Auth
2. Profile is automatically created in `profiles` table
3. Default role is assigned based on registration type
4. Email verification is handled by Supabase

### Job Posting Flow
1. Employer creates job posting
2. Status is set to 'pending' (unless user is moderator+)
3. Moderator reviews and approves
4. Job becomes 'active' and visible to job seekers
5. Analytics track views and applications

## 🛡️ Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Policies enforce role-based access
- Users can only see/edit their own data (unless privileged)

### Data Validation
- Database constraints ensure data integrity
- Triggers validate business rules
- Audit logging tracks all changes

### GDPR Compliance
- Cookie consent tracking
- Data retention policies
- User data export/deletion capabilities

## 📈 Analytics & Monitoring

### Built-in Analytics
- Job view tracking
- Application conversion rates
- User engagement metrics
- Revenue tracking

### Performance Monitoring
- Database query performance
- API response times
- Error tracking and logging

## 🔧 Maintenance Tasks

### Regular Maintenance
1. **Clean up expired jobs**
   ```sql
   UPDATE offers 
   SET status = 'expired' 
   WHERE expires_at < NOW() AND status = 'active';
   ```

2. **Update category counts**
   ```sql
   SELECT update_category_offers_count();
   ```

3. **Archive old audit logs**
   ```sql
   DELETE FROM audit_logs 
   WHERE created_at < NOW() - INTERVAL '1 year';
   ```

### Backup Strategy
- Supabase automatically backs up your database
- Consider additional backups for critical data
- Test restore procedures regularly

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] RLS policies enabled
- [ ] Storage buckets created
- [ ] Authentication providers configured

### Post-Deployment
- [ ] Test user registration/login
- [ ] Verify job posting workflow
- [ ] Check email notifications
- [ ] Test payment processing
- [ ] Validate analytics tracking

## 🆘 Troubleshooting

### Common Issues

#### Authentication Issues
- Check redirect URLs in Supabase dashboard
- Verify environment variables
- Ensure middleware is properly configured

#### Database Connection Issues
- Verify connection string format
- Check firewall settings
- Ensure SSL is enabled for production

#### RLS Policy Issues
- Test policies with different user roles
- Check function permissions
- Verify policy logic with SQL queries

### Getting Help
- Check Supabase documentation
- Review error logs in dashboard
- Test with Supabase CLI locally

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js with Supabase Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase CLI](https://supabase.com/docs/reference/cli)

---

## 🎯 Next Steps

After completing the setup:

1. **Test the system** with different user roles
2. **Import sample data** to test functionality
3. **Configure external APIs** for job imports
4. **Set up monitoring** and alerting
5. **Plan your content strategy** for the blog/CMS
6. **Configure payment processing** for job postings
7. **Set up email templates** for notifications

Your TalentPlus job portal backend is now ready for development and testing!
