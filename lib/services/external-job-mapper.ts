import { createHash } from 'crypto'

import type { AggregatedJob } from '@/lib/services/aggregator'
import type { OfferWithRelations, Offer, Company } from '@/lib/types/database'
import { REMOTE_LOCATION_KEYWORDS } from '@/lib/config/geo'

const slugify = (input: string) =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const truncate = (value: string | undefined | null, max = 500) => {
  if (!value) return null
  return value.length > max ? `${value.slice(0, max).trim()}…` : value
}

const detectRemote = (location?: string | null): boolean => {
  if (!location) return false
  const normalized = location.toLowerCase()
  return REMOTE_LOCATION_KEYWORDS.some((keyword) => normalized.includes(keyword))
}

const employmentTypeMap: Record<string, Offer['employment_type']> = {
  full_time: 'full_time',
  part_time: 'part_time',
  contract: 'contract',
  freelance: 'freelance',
  internship: 'internship',
  temporary: 'temporary',
  permanent: 'full_time',
}

const experienceLevelMap: Record<string, Offer['experience_level']> = {
  entry: 'entry',
  junior: 'junior',
  mid: 'mid',
  senior: 'senior',
  lead: 'lead',
  executive: 'executive',
}

export const mapAggregatedJobToOffer = (job: AggregatedJob): OfferWithRelations => {
  const publishedAt = job.publishedAt || new Date().toISOString()
  const hashSource = job.externalId || `${job.title}-${job.company}-${job.location}`
  const hashedId = createHash('md5').update(hashSource).digest('hex')
  const id = `external-${job.source}-${hashedId}`
  const slug = `${slugify(job.title)}-${hashedId}`

  const employmentType = job.employmentType
    ? employmentTypeMap[job.employmentType.toLowerCase()] || null
    : null

  const experienceLevel = job.experienceLevel
    ? experienceLevelMap[job.experienceLevel.toLowerCase()] || null
    : null

  const salaryCurrency = job.salary?.currency || 'EUR'
  const isRemote = detectRemote(job.location)

  const shortDescription = truncate(job.description, 280)

  const companyName = job.company || 'Unknown company'
  const companySlug = slugify(companyName) || `company-${hashedId}`

  const company: Company = {
    id: `external-company-${hashedId}`,
    name: companyName,
    slug: companySlug,
    description: null,
    website_url: null,
    logo_url: null,
    cover_image_url: null,
    industry: null,
    company_size: null,
    founded_year: null,
    location: job.location || null,
    email: null,
    phone: null,
    linkedin_url: null,
    twitter_url: null,
    facebook_url: null,
    is_verified: false,
    is_active: true,
    created_by: null,
    created_at: publishedAt,
    updated_at: publishedAt,
  }

  const offer: OfferWithRelations = {
    id,
    title: job.title,
    slug,
    description: job.description || null,
    short_description: shortDescription,
    type: 'job',
    status: 'active',
    employment_type: employmentType,
    experience_level: experienceLevel,
    salary_min: job.salary?.min ?? null,
    salary_max: job.salary?.max ?? null,
    salary_currency: salaryCurrency,
    salary_period: 'yearly',
    location: job.location || null,
    is_remote: isRemote,
    is_hybrid: false,
    skills: job.skills && job.skills.length > 0 ? job.skills : null,
    requirements: null,
    benefits: null,
    application_url: job.applicationUrl || null,
    application_email: null,
    application_deadline: null,
    affiliate_url: null,
    commission_rate: null,
    price: null,
    discount_code: null,
    company_id: null,
    category_id: null,
    source: job.source,
    external_id: job.externalId,
    source_id: job.source,
    featured: false,
    urgent: false,
    views_count: 0,
    applications_count: 0,
    clicks_count: 0,
    seo_title: job.title,
    seo_description: shortDescription,
    seo_keywords: null,
    featured_image_url: null,
    gallery_urls: null,
    published_at: publishedAt,
    expires_at: null,
    created_by: null,
    created_at: publishedAt,
    updated_at: publishedAt,
    company,
  }

  return offer
}

export const dedupeOffersByTitleAndCompany = (jobs: OfferWithRelations[]): OfferWithRelations[] => {
  const seen = new Set<string>()
  const result: OfferWithRelations[] = []

  for (const job of jobs) {
    const companyName = job.company?.name || 'unknown'
    const key = `${job.title.toLowerCase().trim()}::${companyName.toLowerCase().trim()}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push(job)
  }

  return result
}

