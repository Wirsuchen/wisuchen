# Job Sync System

## Overview

The job sync system saves all fetched jobs from external APIs (RapidAPI, Adzuna) to Supabase database and serves jobs from the database instead of calling external APIs directly. This provides:

- **Incremental growth**: Job count increases over time as more jobs are synced
- **Faster responses**: Database queries are faster than external API calls
- **Persistence**: Jobs remain available even if external APIs are down
- **Reduced API costs**: Fewer external API calls
- **Better control**: Full ownership of job data

## Architecture

```
External APIs (RapidAPI, Adzuna)
          ↓
     Job Sync Service
          ↓
   Supabase Database (offers table)
          ↓
    Jobs Search API (/api/v1/jobs/search)
          ↓
   Frontend (Jobs Page, Landing Page)
```

## Database Schema

Jobs are stored in the `offers` table with `type = 'job'`:

- `id`: UUID primary key
- `title`: Job title
- `description`: Full job description
- `external_id`: Original job ID from source
- `source`: Source name (e.g., 'rapidapi-jsearch', 'adzuna')
- `employment_type`: full_time, part_time, contract, etc.
- `experience_level`: junior, mid, senior, etc.
- `location`: Job location
- `salary_min`, `salary_max`: Salary range
- `skills`: Array of required skills
- `application_url`: Apply link
- `status`: 'active', 'expired', etc.
- `published_at`: When job was published

## API Endpoints

### 1. Sync Jobs (POST /api/v1/jobs/sync)

Triggers sync of jobs from external APIs to database.

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/jobs/sync \
  -H "Content-Type: application/json" \
  -d '{"query": "developer", "limit": 100}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 239,
      "new": 180,
      "updated": 50,
      "skipped": 9,
      "errors": 0
    },
    "totalInDatabase": 1245
  }
}
```

### 2. Search Jobs (GET /api/v1/jobs/search)

Searches jobs from database (default) or external APIs.

**From Database (default):**
```bash
curl "http://localhost:3000/api/v1/jobs/search?query=developer&limit=20"
```

**From External APIs (legacy):**
```bash
curl "http://localhost:3000/api/v1/jobs/search?query=developer&useDatabase=false"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1245,
      "totalPages": 63
    },
    "meta": {
      "sources": { "database": 1245 },
      "fromDatabase": true,
      "timestamp": "2025-11-11T..."
    }
  }
}
```

## Usage

### Initial Sync

Run an initial sync to populate the database:

```bash
# Sync developer jobs
curl -X POST http://localhost:3000/api/v1/jobs/sync \
  -H "Content-Type: application/json" \
  -d '{"query": "developer", "limit": 100}'

# Sync multiple job types
curl -X POST http://localhost:3000/api/v1/jobs/sync \
  -H "Content-Type: application/json" \
  -d '{"query": "designer", "limit": 100}'

curl -X POST http://localhost:3000/api/v1/jobs/sync \
  -H "Content-Type: application/json" \
  -d '{"query": "marketing", "limit": 100}'
```

### Automated Sync (Recommended)

Set up a cron job or scheduled task to sync jobs regularly:

**Option 1: Vercel Cron (if deploying to Vercel)**

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/v1/jobs/sync",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**Option 2: External Cron Service (e.g., cron-job.org)**

1. Go to https://cron-job.org
2. Create a job that calls:
   - URL: `https://your-domain.com/api/v1/jobs/sync`
   - Method: POST
   - Schedule: Every 6 hours
   - Body: `{"limit": 100}`

**Option 3: Node.js Scheduled Task**

Create `scripts/sync-jobs.ts`:
```typescript
import { jobSyncService } from '@/lib/services/job-sync'

async function sync() {
  const stats = await jobSyncService.syncAllJobs({ limit: 100 })
  console.log('Sync complete:', stats)
}

sync()
```

Run with node-cron:
```bash
# Every 6 hours
0 */6 * * * cd /path/to/project && npm run sync-jobs
```

## Monitoring

### Check Database Stats

```bash
curl http://localhost:3000/api/v1/jobs/sync
```

Returns:
```json
{
  "success": true,
  "data": {
    "totalJobs": 1245,
    "message": "Use POST to trigger sync"
  }
}
```

### Check Job Count in Database

```sql
SELECT COUNT(*) FROM offers WHERE type = 'job' AND status = 'active';
```

### View Recent Jobs

```sql
SELECT title, source, published_at, created_at 
FROM offers 
WHERE type = 'job' AND status = 'active'
ORDER BY created_at DESC 
LIMIT 10;
```

## Deduplication

Jobs are deduplicated using:
- `external_id` + `source` (unique index)
- If a job with the same external_id and source exists, it's updated instead of creating a duplicate

## Data Retention

Consider setting up automatic cleanup for old/expired jobs:

```sql
-- Archive jobs older than 90 days
UPDATE offers 
SET status = 'archived'
WHERE type = 'job' 
  AND status = 'active'
  AND published_at < NOW() - INTERVAL '90 days';
```

## Testing

1. **Trigger initial sync:**
   ```bash
   npm run dev
   curl -X POST http://localhost:3000/api/v1/jobs/sync
   ```

2. **Check database:**
   ```bash
   curl http://localhost:3000/api/v1/jobs/sync
   ```

3. **Search jobs:**
   ```bash
   curl "http://localhost:3000/api/v1/jobs/search?limit=10"
   ```

4. **Verify on frontend:**
   - Visit http://localhost:3000
   - Check hero stats (should show database count)
   - Visit http://localhost:3000/jobs
   - Jobs should load from database

## Troubleshooting

### No jobs in database
- Run sync manually: `curl -X POST http://localhost:3000/api/v1/jobs/sync`
- Check Supabase env vars are set

### Sync failing
- Check API keys in `.env.local`
- Check external API rate limits
- Review error logs in console

### Jobs not showing on frontend
- Verify jobs have `status = 'active'`
- Check `type = 'job'`
- Ensure `published_at` is set

## Environment Variables

Required in `.env.local`:

```env
# Supabase (for job storage)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# RapidAPI (for external job sources)
RAPIDAPI_KEY=xxx

# Adzuna (for external job sources)
ADZUNA_APP_ID=xxx
ADZUNA_APP_KEY=xxx
```

## Benefits Over Direct API Calls

| Feature | Direct API | Database Sync |
|---------|-----------|---------------|
| Response time | 2-5s | <100ms |
| API costs | High | Low |
| Job count | Limited | Grows over time |
| Offline access | No | Yes |
| Data ownership | No | Yes |
| Custom filtering | Limited | Full SQL |
| Rate limits | Yes | No |

## Next Steps

1. Run initial sync
2. Set up automated sync schedule
3. Monitor database growth
4. Optimize queries as needed
5. Add more job sources
6. Implement data retention policy
