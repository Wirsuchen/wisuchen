# TalentPlus - Product Requirements Document (PRD)

## Product Overview

**Product Name:** TalentPlus (WirSuchen)  
**Version:** 1.0  
**Platform:** Web Application (Next.js 15)  
**Target Market:** DACH Region (Germany, Austria, Switzerland)  
**Product Type:** Job Portal + Price Comparison Platform

## Executive Summary

TalentPlus is a comprehensive web platform that combines job search capabilities with product deal comparisons. It aggregates job listings from multiple sources (RapidAPI, Adzuna) and provides price comparison for products across various online retailers.

## Core Features

### 1. Job Search & Listing

#### 1.1 Job Discovery
- **Multi-source aggregation**: Jobs from RapidAPI, Adzuna, Glassdoor, Upwork, Y Combinator
- **Search functionality**: Search by job title, keywords, location
- **Filtering**: Employment type, experience level, salary range
- **Real-time data**: Jobs cached for 1 hour, fresh data on search
- **Pagination**: Load more jobs with infinite scroll
- **Job details**: Full description, company info, salary, location, employment type

#### 1.2 Job Detail Page
- **Full job description**: Complete job posting with formatting
- **AI-enhanced description**: Use Gemini AI to improve job descriptions
- **Company information**: Company size, industry, website
- **Application**: Direct apply links to external job boards
- **Save jobs**: Save jobs to user account for later viewing
- **Share jobs**: Share job postings via social media

### 2. Deals & Price Comparison

#### 2.1 Deal Discovery
- **Multi-retailer aggregation**: Products from RapidAPI Real-Time Product Search
- **Search products**: Search by product name, category, brand
- **Filter deals**: Price range, category, brand, discount percentage
- **Sort options**: Best deal, price (low/high), highest discount, rating
- **Grid/List view**: Toggle between card and list layouts

#### 2.2 Deal Detail Page
- **Product images**: Multiple product photos, video demos
- **Price comparison**: Current price, original price, discount percentage
- **Product variants**: Size and color options where available
- **Retailer information**: Store name, rating, reviews, shipping info
- **Product attributes**: Technical specifications, features
- **Related deals**: Similar products from other retailers

### 3. User Authentication & Profiles

#### 3.1 Authentication
- **Sign up**: Email/password registration via Supabase Auth
- **Sign in**: Email/password login
- **Password reset**: Email-based password recovery
- **Session management**: Persistent sessions with automatic refresh

#### 3.2 User Roles & Permissions
- **Supervisor**: Full system access, manage all users and settings
- **Admin**: Manage content, users, approve submissions
- **Moderator**: Content moderation, view analytics
- **Lister**: Create and manage job listings
- **Publisher**: Post job listings, manage company profile
- **Blogger**: Create and edit blog posts
- **Editor**: Edit all blog posts
- **Analyst**: View analytics and reports
- **Employer**: Company account, post jobs, view applications
- **Job Seeker**: Standard user, search jobs, save jobs, apply

#### 3.3 User Dashboard
- **My Jobs**: Saved jobs, application history
- **My Deals**: Saved deals, price alerts
- **Profile**: Edit profile, upload resume, manage settings
- **Activity**: Recent searches, viewed jobs/deals

### 4. Admin Panel

#### 4.1 Dashboard
- **Overview**: Stats (jobs, deals, users, revenue)
- **Charts**: Monthly trends, category distribution, source performance
- **Recent activity**: Latest imports, user registrations

#### 4.2 User Management
- **User list**: View all users with search and filters
- **Role assignment**: Change user roles
- **User details**: View profile, activity, saved items

#### 4.3 Role Permissions Matrix
- **Permission overview**: Visual matrix showing what each role can do
- **Feature access**: Granular permissions for different features

#### 4.4 Job Import Manager
- **Import jobs**: Import from external APIs
- **Source management**: Enable/disable job sources
- **Import history**: View past imports, success/failure rates

#### 4.5 Affiliate Import Manager
- **Import deals**: Import from affiliate networks
- **Category mapping**: Map external categories to internal
- **Performance tracking**: Track clicks, conversions

#### 4.6 Analytics
- **Traffic stats**: Page views, unique visitors
- **Conversion metrics**: Applications submitted, deals clicked
- **Revenue tracking**: Affiliate commissions, ad revenue

### 5. Blog & Content

#### 5.1 Blog Listing
- **Category filtering**: Filter by topic (Career Tips, Market Insights, Deals)
- **Search**: Search blog posts by title/content
- **Pagination**: Browse older posts

#### 5.2 Blog Post Detail
- **Rich content**: Markdown rendering with images
- **Related posts**: Similar articles
- **Share buttons**: Social media sharing

#### 5.3 Content Management (Admin)
- **Create posts**: WYSIWYG editor for blog posts
- **Edit posts**: Modify existing content
- **Publish/Draft**: Control post visibility
- **SEO settings**: Meta tags, slugs, featured images

### 6. Landing Page

#### 6.1 Hero Section
- **Search bar**: Quick job/deal search
- **Location links**: Popular job locations (Germany, Austria, Switzerland)
- **Live stats**: Active jobs count, daily deals, happy users

#### 6.2 Featured Jobs
- **Top 4 jobs**: Real jobs from API (no dummy data)
- **Quick view**: Title, company, location, salary, job type
- **View details**: Link to full job posting

#### 6.3 Top Deals
- **Top 3 deals**: Real deals from API (no dummy data)
- **Deal cards**: Image, price, discount, store, rating
- **View deal**: Link to full deal page

#### 6.4 Latest Insights
- **Blog posts**: Featured articles
- **Categories**: Career tips, market insights, deals

## Technical Requirements

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.x
- **UI Components**: Radix UI + custom components
- **State Management**: React hooks, URL state
- **Forms**: React Hook Form + Zod validation

### Backend
- **API Routes**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **External APIs**: 
  - RapidAPI (jobs, deals)
  - Adzuna Jobs API
- **Caching**: In-memory cache with TTL (1 hour default)

### Database Schema
- **profiles**: User profiles with roles
- **saved_jobs**: User's saved jobs
- **saved_deals**: User's saved deals
- **blog_posts**: Blog content
- **job_sources**: External job API configurations
- **deal_sources**: External deal API configurations

### Security
- **RLS Policies**: Row-Level Security on all tables
- **Role-based access**: Granular permissions per role
- **API rate limiting**: Rate limits on external API calls
- **Input validation**: Zod schemas for all forms

## User Flows

### Job Seeker Flow
1. **Land on homepage** → See featured jobs and deals
2. **Search for jobs** → Enter keywords, location
3. **Browse results** → Filter by type, salary, etc.
4. **View job details** → Read full description, company info
5. **Apply or save** → Click apply (external) or save to profile
6. **Manage saved jobs** → View in dashboard, get notifications

### Deal Hunter Flow
1. **Visit deals page** → Browse all deals
2. **Search product** → Enter product name or category
3. **Filter results** → By price, brand, discount
4. **View deal details** → See all offers, specs, reviews
5. **Compare prices** → Check multiple retailers
6. **Buy** → Redirect to retailer site

### Admin Flow
1. **Login as admin** → Access admin panel
2. **View dashboard** → Check stats, recent activity
3. **Manage users** → Assign roles, view profiles
4. **Import jobs/deals** → Run import from external sources
5. **Monitor performance** → Check analytics, source health

## Performance Requirements

- **Page load**: < 2 seconds for cached content
- **API response**: < 3 seconds for external API calls
- **Search results**: < 1 second for database queries
- **Caching**: 1 hour TTL for jobs/deals, configurable
- **Concurrent users**: Support 1000+ simultaneous users

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Localization

- **Primary**: German (Deutschland)
- **Secondary**: English
- **Currency**: EUR (€) for Germany/Austria, CHF for Switzerland
- **Date format**: DD.MM.YYYY (European)

## Deployment

- **Platform**: Vercel (Next.js optimized)
- **Database**: Supabase Cloud
- **CDN**: Vercel Edge Network
- **Environment**: Production, Staging, Development

## Success Metrics

- **Daily active users**: Track user engagement
- **Job applications**: Number of external applications initiated
- **Deal clicks**: Clicks to retailer sites (affiliate tracking)
- **User retention**: Return visitors, saved items
- **Search success rate**: Searches resulting in job views/applications

## Future Enhancements

- **Mobile app**: iOS/Android native apps
- **Email alerts**: Job alerts, price drop notifications
- **Company profiles**: Employer branding pages
- **Resume builder**: Built-in resume creator
- **Interview prep**: AI-powered interview practice
- **Salary insights**: Salary comparison tools
- **Job matching**: AI-based job recommendations
