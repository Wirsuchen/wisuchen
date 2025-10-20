# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Core Development
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
# Runs Next.js dev server at http://localhost:3000

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

### Database & Types
```bash
# Regenerate TypeScript types from Supabase schema
npx supabase gen types typescript --project-id ngvuyarcqezvugfqfopg > lib/types/database.generated.ts

# Or use the npm script (if configured)
npm run db:types
```

### Testing
```bash
# API testing with the test-api.js script
node test-api.js

# Check health endpoint
curl http://localhost:3000/api/health
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI + shadcn/ui
- **Authentication**: Supabase Auth
- **Package Manager**: pnpm

### Core Application Structure

#### Authentication Architecture
- **Context**: `contexts/auth-context.tsx` - Global auth state management
- **Providers**: Supabase Auth with automatic profile creation via database triggers
- **Roles**: supervisor, admin, moderator, lister, blogger, analyst, job_seeker, employer
- **Middleware**: `middleware.ts` handles session refresh on all routes

#### Database Layer
- **Client Creation**: 
  - `lib/supabase/client.ts` - Browser client for client components
  - `lib/supabase/server.ts` - Server client for SSR/API routes
- **Types**: `lib/types/database.generated.ts` - Auto-generated from Supabase schema
- **Security**: All tables use Row Level Security (RLS) with role-based policies

#### API Structure
The application uses polymorphic data modeling where `offers` table stores both jobs and affiliate deals:

**Core API Routes:**
- `app/api/jobs/route.ts` - Job listing with filters/pagination
- `app/api/categories/route.ts` - Category management (hierarchical)
- `app/api/import/jobs/route.ts` - Job imports from external APIs (Adzuna, RapidAPI)
- `app/api/import/affiliates/route.ts` - Affiliate imports (Awin, Adcell)
- `app/api/payment/paypal/route.ts` - PayPal payment processing

#### Frontend Structure
- **Pages**: App router pages in `app/` directory
- **Components**: Organized by feature in `components/`
  - `components/jobs/` - Job listing and search
  - `components/admin/` - Import management UIs
  - `components/payment/` - PayPal checkout
  - `components/auth/` - Login/register forms
- **Layouts**: Page layout wrapper in `components/layout/`

### Key Business Logic

#### User Roles & Permissions
- **Anonymous**: Read active offers, create impressions for tracking
- **Authenticated**: CRUD on own resources, read active content
- **Employer+**: Create/manage jobs and companies
- **Moderator+**: Approve content, manage categories
- **Admin**: Full system access, manage imports and settings

#### Import System
- External job APIs (Adzuna, multiple RapidAPI sources)
- Affiliate networks (Awin, Adcell)
- Progress tracking via `import_runs` table
- Admin UI for managing imports with real-time status

#### Payment Processing
- PayPal integration for job posting packages
- Invoice generation with German e-invoice compliance
- Point-based pricing system support

## Environment Setup

### Required Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Job APIs
ADZUNA_APP_ID=your_app_id
ADZUNA_API_KEY=your_api_key
RAPIDAPI_KEY=your_rapidapi_key

# Affiliate APIs
AWIN_OAUTH_TOKEN=your_oauth_token
ADCELL_LOGIN=your_login
ADCELL_PASSWORD=your_password

# PayPal
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_MODE=sandbox # or 'live' for production

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Schema
The database has 19+ tables with comprehensive RLS policies. Key tables:
- `profiles` - User management with automatic creation trigger
- `offers` - Polymorphic jobs/affiliate deals table
- `companies` - Employer/merchant profiles
- `categories` - Hierarchical taxonomy
- `invoices` + `payments` - E-commerce functionality
- `import_runs` - External data import tracking
- Performance indexes for fast querying (especially full-text search on offers)

## Testing & Debugging

### Access Admin Features
1. Create user account via `/register`
2. In Supabase dashboard, update `profiles.role` to `admin`, `moderator`, or `supervisor`
3. Access admin imports at `/admin`

### Test Import Functionality
- Jobs: Use admin UI to import from Adzuna or RapidAPI sources
- Affiliates: Import from Awin or Adcell networks
- Check import progress via polling mechanism

### Common Debugging Points
- RLS policies may block operations if user role is insufficient
- Import APIs require valid external API keys
- PayPal sandbox mode for testing payments
- Check Supabase logs for database/auth issues

## Configuration Notes

### Next.js Config
- ESLint and TypeScript errors ignored during builds
- Images unoptimized for static export compatibility
- App router with TypeScript strict mode

### Supabase Integration
- SSR-compatible client/server setup
- Automatic session management via middleware
- Type-safe database operations with generated types
- Comprehensive RLS for data security

### UI Framework
- Tailwind CSS v4 with custom design system
- Radix UI primitives with shadcn/ui components
- Responsive design with mobile-first approach
- Custom animations and transitions