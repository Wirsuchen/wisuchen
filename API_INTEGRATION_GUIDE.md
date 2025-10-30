# 🚀 API Integration Complete Guide

## Overview

Your TalentPlus platform now has a **production-ready API integration system** that aggregates data from multiple sources with enterprise-grade features:

- ✅ **Security**: API keys stored in environment variables
- ✅ **Reliability**: Automatic retry with exponential backoff
- ✅ **Performance**: Multi-layer caching (memory + Redis)
- ✅ **Rate Limiting**: Prevents API quota exhaustion
- ✅ **Error Handling**: Comprehensive error tracking and logging
- ✅ **Monitoring**: Health checks and performance metrics
- ✅ **Type Safety**: Full TypeScript support

---

## 📋 Quick Start

### 1. Configure API Keys

Copy `.env.example` to `.env.local` and add your API credentials:

```bash
cp .env.example .env.local
```

**Required API Keys** (already provided):
```env
# Job APIs
ADZUNA_APP_ID=aac666ff
ADZUNA_API_KEY=ff40f608050f2e02e13fecce2442d155
RAPIDAPI_KEY=90b7091d96msh7d9172a7f3735c4p100a2bjsn9237d1dbc9f8

# Affiliate APIs
ADCELL_LOGIN=256618
ADCELL_PASSWORD=adsportal
AWIN_OAUTH_TOKEN=325BF8DF-39C7-4AAD-AF12-8304976B4D66

# PayPal (get from https://developer.paypal.com/dashboard/)
PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_CLIENT_SECRET=your_client_secret_here
PAYPAL_MODE=sandbox
```

### 2. Install Dependencies (if needed)

```bash
npm install
# or
pnpm install
```

### 3. Test the Integration

Check system status:
```bash
curl http://localhost:3000/api/v1/status
```

---

## 🔌 Available API Endpoints

### Jobs API

#### Search Jobs
```http
GET /api/v1/jobs/search
```

**Query Parameters:**
- `query` (string, optional): Job title or keywords
- `location` (string, optional): Location (city, country)
- `employmentType` (enum, optional): `full_time`, `part_time`, `contract`, `freelance`, `internship`, `temporary`
- `experienceLevel` (enum, optional): `junior`, `mid`, `senior`, `lead`, `executive`
- `salaryMin` (number, optional): Minimum salary
- `salaryMax` (number, optional): Maximum salary
- `page` (number, default: 1): Page number
- `limit` (number, default: 20, max: 100): Results per page
- `sources` (string, optional): Comma-separated sources (`adzuna,rapidapi`)
- `useCache` (boolean, default: true): Enable caching

**Example Request:**
```bash
curl "http://localhost:3000/api/v1/jobs/search?query=software+engineer&location=Berlin&limit=10"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "12345",
        "title": "Senior Software Engineer",
        "description": "...",
        "company": "Tech Corp",
        "location": "Berlin, Germany",
        "salary": {
          "min": 60000,
          "max": 90000,
          "currency": "EUR"
        },
        "employmentType": "full_time",
        "applicationUrl": "https://...",
        "source": "adzuna",
        "publishedAt": "2025-10-23T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "totalPages": 15
    },
    "meta": {
      "sources": {
        "adzuna": 75,
        "rapidapi": 75
      },
      "cached": false,
      "timestamp": "2025-10-23T18:35:00Z"
    }
  }
}
```

### Affiliate Offers API

#### Search Offers
```http
GET /api/v1/offers/search
```

**Query Parameters:**
- `query` (string, optional): Product/offer keywords
- `category` (string, optional): Category filter
- `minPrice` (number, optional): Minimum price
- `maxPrice` (number, optional): Maximum price
- `onSale` (boolean, optional): Only show discounted items
- `page` (number, default: 1): Page number
- `limit` (number, default: 20, max: 100): Results per page
- `sources` (string, optional): Comma-separated sources (`adcell,awin`)

**Example Request:**
```bash
curl "http://localhost:3000/api/v1/offers/search?query=laptop&onSale=true&limit=10"
```

### System Status

#### Health Check
```http
GET /api/v1/status
```

Returns API configuration status, cache statistics, and rate limits.

---

## 💻 Frontend Integration

### Using React Hooks

#### Fetch Jobs in Components

```tsx
import { useJobs } from '@/hooks/use-jobs'

export default function JobsPage() {
  const { jobs, loading, error, search, pagination, meta } = useJobs({
    query: 'developer',
    location: 'Germany',
    limit: 20
  })

  if (loading) return <div>Loading jobs...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h1>Jobs ({pagination?.total || 0})</h1>
      
      {/* Display sources */}
      <div>
        Sources: {meta && Object.entries(meta.sources).map(([source, count]) => (
          <span key={source}>{source}: {count} </span>
        ))}
        {meta?.cached && <span>✓ Cached</span>}
      </div>

      {/* Job listings */}
      {jobs.map(job => (
        <div key={job.id}>
          <h2>{job.title}</h2>
          <p>{job.company} - {job.location}</p>
          {job.salary && <p>€{job.salary.min} - €{job.salary.max}</p>}
          <a href={job.applicationUrl}>Apply Now</a>
        </div>
      ))}

      {/* Pagination */}
      {pagination && (
        <button 
          onClick={() => search({ page: pagination.page + 1 })}
          disabled={pagination.page >= pagination.totalPages}
        >
          Load More
        </button>
      )}
    </div>
  )
}
```

#### Fetch Affiliate Offers

```tsx
import { useOffers, useTrackAffiliateClick } from '@/hooks/use-offers'

export default function OffersPage() {
  const { offers, loading, error, search } = useOffers({
    onSale: true,
    limit: 20
  })
  const { trackClick } = useTrackAffiliateClick()

  if (loading) return <div>Loading offers...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h1>Affiliate Offers</h1>
      {offers.map(offer => (
        <div key={offer.id}>
          <img src={offer.imageUrl} alt={offer.title} />
          <h2>{offer.title}</h2>
          <p>{offer.company}</p>
          <p>
            {offer.discountPrice ? (
              <>
                <span style={{ textDecoration: 'line-through' }}>€{offer.price}</span>
                <strong> €{offer.discountPrice}</strong>
                <span> ({offer.discountPercentage}% off)</span>
              </>
            ) : (
              <strong>€{offer.price}</strong>
            )}
          </p>
          <p>Commission: {offer.commissionRate}%</p>
          <button onClick={() => trackClick(offer.id, offer.affiliateUrl)}>
            View Offer
          </button>
        </div>
      ))}
    </div>
  )
}
```

---

## 🏗️ Architecture

### Directory Structure

```
talentplus/
├── lib/
│   ├── config/
│   │   └── api-keys.ts          # Centralized API configuration
│   ├── services/
│   │   ├── aggregator.ts        # Main aggregation service
│   │   ├── job-apis/
│   │   │   ├── adzuna.ts        # Adzuna integration
│   │   │   └── rapidapi.ts      # RapidAPI integrations
│   │   └── affiliate-apis/
│   │       ├── adcell.ts        # Adcell integration
│   │       └── awin.ts          # Awin integration
│   └── utils/
│       ├── api-error.ts         # Error handling
│       ├── retry.ts             # Retry logic with backoff
│       ├── rate-limiter.ts      # Rate limiting
│       ├── cache.ts             # Caching layer
│       └── logger.ts            # Structured logging
├── app/
│   └── api/
│       └── v1/
│           ├── jobs/
│           │   └── search/route.ts
│           ├── offers/
│           │   └── search/route.ts
│           └── status/route.ts
└── hooks/
    ├── use-jobs.ts              # Job fetching hooks
    └── use-offers.ts            # Offer fetching hooks
```

### Key Features

#### 1. **Intelligent Aggregation**
- Fetches from multiple sources in parallel
- Automatic deduplication
- Graceful fallback if one source fails

#### 2. **Smart Caching**
- In-memory cache for development
- Redis support for production
- Configurable TTL per data type
- Tag-based invalidation

#### 3. **Rate Limiting**
- Token bucket algorithm
- Per-provider limits
- Request queuing
- Automatic backpressure

#### 4. **Error Handling**
- Typed error classes
- Automatic retry with exponential backoff
- Circuit breaker pattern
- Detailed error logging

#### 5. **Monitoring**
- Request/response logging
- Performance metrics
- Cache hit rates
- Rate limit statistics

---

## ⚙️ Configuration

### Environment Variables

All configuration is done via environment variables. See `.env.example` for the complete list.

#### Feature Flags

Enable/disable specific API sources:

```env
ENABLE_ADZUNA=true
ENABLE_RAPIDAPI=true
ENABLE_ADCELL=true
ENABLE_AWIN=true
```

#### Cache Configuration

```env
CACHE_TTL_JOBS=3600          # 1 hour
CACHE_TTL_AFFILIATE=7200     # 2 hours
CACHE_TTL_STATISTICS=86400   # 24 hours

# Redis (optional, for production)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
```

#### Rate Limiting

```env
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000   # 1 minute
```

---

## 🧪 Testing

### Test API Status

```bash
curl http://localhost:3000/api/v1/status
```

### Test Job Search

```bash
# Basic search
curl "http://localhost:3000/api/v1/jobs/search?query=developer"

# Advanced search
curl "http://localhost:3000/api/v1/jobs/search?query=senior+engineer&location=Berlin&employmentType=full_time&salaryMin=60000&limit=10"

# Test caching
curl "http://localhost:3000/api/v1/jobs/search?query=developer&useCache=false"
```

### Test Offer Search

```bash
# Basic search
curl "http://localhost:3000/api/v1/offers/search?query=laptop"

# On sale only
curl "http://localhost:3000/api/v1/offers/search?onSale=true&limit=20"

# Price range
curl "http://localhost:3000/api/v1/offers/search?minPrice=100&maxPrice=500"
```

---

## 🚨 Error Handling

All API endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error message here",
  "details": [
    // Optional validation errors
  ]
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Validation error
- `401` - Authentication error
- `429` - Rate limit exceeded
- `500` - Internal server error

---

## 📊 Performance Optimization

### Caching Strategy

1. **Jobs**: Cached for 1 hour (frequently changing data)
2. **Offers**: Cached for 2 hours (semi-static data)
3. **Statistics**: Cached for 24 hours (rarely changing)

### Rate Limits Per Provider

| Provider  | Requests/Min | Requests/Hour | Requests/Day |
|-----------|--------------|---------------|--------------|
| Adzuna    | 60           | 1,000         | 5,000        |
| RapidAPI  | 100          | 5,000         | 10,000       |
| Adcell    | 30           | 1,000         | 2,000        |
| Awin      | 60           | 2,000         | 5,000        |
| PayPal    | 300          | 10,000        | 50,000       |

---

## 🔒 Security Best Practices

✅ **Implemented:**
- API keys stored in environment variables
- Never exposed to client-side code
- Rate limiting on all endpoints
- Input validation with Zod schemas
- Sanitized error messages (no sensitive data exposed)

⚠️ **Recommendations:**
1. Enable HTTPS in production
2. Set up CORS properly
3. Implement request authentication
4. Monitor API usage
5. Set up alerts for rate limit violations

---

## 📝 API Source Documentation

### Job APIs

1. **Adzuna** - [https://developer.adzuna.com/](https://developer.adzuna.com/)
   - Coverage: Global job listings
   - Free tier: 5,000 calls/day

2. **RapidAPI** - [https://rapidapi.com/](https://rapidapi.com/)
   - Employment Agency API
   - Glassdoor Real-Time API
   - Upwork Jobs API
   - Active Jobs DB API
   - Job Postings API
   - Y Combinator Jobs API
   - Freelancer API

### Affiliate APIs

1. **Adcell** - [https://www.adcell.de/api/v2](https://www.adcell.de/api/v2)
   - Coverage: E-commerce products (Germany/Europe)

2. **Awin** - [https://developer.awin.com/](https://developer.awin.com/)
   - Coverage: Global affiliate network

### Payment API

1. **PayPal** - [https://developer.paypal.com/docs/api/overview/](https://developer.paypal.com/docs/api/overview/)
   - Sandbox: Testing environment
   - Live: Production payments

---

## 🐛 Troubleshooting

### Issue: API keys not working

**Solution:** 
1. Check `.env.local` file exists and contains correct keys
2. Restart dev server after changing environment variables
3. Verify keys at `/api/v1/status`

### Issue: Rate limit errors

**Solution:**
1. Check rate limit status at `/api/v1/status`
2. Enable caching to reduce API calls
3. Increase cache TTL in environment variables

### Issue: No results returned

**Solution:**
1. Check if API sources are enabled in `.env.local`
2. Verify API credentials are correct
3. Check network connectivity
4. Review logs for specific errors

### Issue: Slow response times

**Solution:**
1. Enable caching (`useCache=true`)
2. Reduce page size (`limit` parameter)
3. Use specific source filters
4. Set up Redis for production caching

---

## 📞 Support

For issues or questions:
1. Check the `/api/v1/status` endpoint
2. Review application logs
3. Consult provider API documentation
4. Contact API provider support if credentials issues

---

## 🎯 Next Steps

1. **Set up PayPal credentials** for payment processing
2. **Configure Redis** for production caching
3. **Implement analytics tracking** for affiliate clicks
4. **Add user authentication** to API routes
5. **Set up monitoring** (e.g., Sentry for errors)
6. **Create admin dashboard** for API statistics
7. **Implement webhook handlers** for real-time updates

---

## 📄 License

This integration follows the terms of service of each API provider. Ensure compliance with:
- Adzuna Terms of Service
- RapidAPI Terms of Service
- Adcell Publisher Agreement
- Awin Publisher Agreement
- PayPal Developer Agreement
