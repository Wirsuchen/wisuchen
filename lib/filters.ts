// Reusable filter/sort utilities for Jobs and Deals
// These helpers are intentionally lightweight and work with the data shapes
// currently used in the app pages.

export type Range = { min: number; max: number | null }

function toNumber(n: string): number {
  const cleaned = n.replace(/[^0-9.,]/g, "").replace(/,/g, "")
  const parsed = parseFloat(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

// Parse salary strings like "€70,000 - €90,000" or "€70,000"
export function parseSalaryRange(str: string): Range {
  if (!str) return { min: 0, max: null }
  const parts = str.split("-")
  if (parts.length === 1) {
    const n = toNumber(parts[0])
    return { min: n, max: n }
  }
  const min = toNumber(parts[0])
  const max = toNumber(parts[1])
  return { min, max }
}

// Parse UI range strings like "0-30k", "50k-70k", "70k-100k", "100k+"
export function parseHumanRange(str?: string | null): Range | null {
  if (!str) return null
  const s = str.trim().toLowerCase()
  // Replace k with three zeros to support both jobs (k) and deals (plain numbers)
  const normalized = s.replace(/k/g, "000")

  if (normalized.endsWith("+")) {
    const min = toNumber(normalized.slice(0, -1))
    return { min, max: null }
  }
  const [a, b] = normalized.split("-")
  if (!a || !b) return null
  return { min: toNumber(a), max: toNumber(b) }
}

// Check if two ranges overlap (inclusive)
function rangesOverlap(a: Range, b: Range): boolean {
  const aMax = a.max ?? Number.POSITIVE_INFINITY
  const bMax = b.max ?? Number.POSITIVE_INFINITY
  return a.min <= bMax && b.min <= aMax
}

// ----------------- JOBS -----------------
export type JobItem = {
  id: number
  title: string
  company: string
  location: string
  salary: string
  type: string
  category?: string
  // Optional fields used in UI rendering
  description?: string
  postedDate?: string
  featured?: boolean
  logo?: string
  applicants?: number
}

export type JobFilterOptions = {
  searchQuery?: string
  location?: string
  categories?: string[]
  jobTypes?: string[]
  salaryRange?: string | null
}

export function filterJobs<T extends JobItem>(jobs: T[], opts: JobFilterOptions): T[] {
  const { searchQuery = "", location = "", categories = [], jobTypes = [], salaryRange } = opts
  const query = searchQuery.trim().toLowerCase()
  const loc = location.trim().toLowerCase()
  const uiRange = parseHumanRange(salaryRange)

  return jobs.filter((job) => {
    // Search (title/company/location)
    const hay = `${job.title} ${job.company} ${job.location}`.toLowerCase()
    if (query && !hay.includes(query)) return false

    // Location contains
    if (loc && !job.location.toLowerCase().includes(loc)) return false

    // Category selection
    if (categories.length > 0 && job.category && !categories.includes(job.category)) return false

    // Job type selection
    if (jobTypes.length > 0 && !jobTypes.includes(job.type)) return false

    // Salary range
    if (uiRange) {
      const sRange = parseSalaryRange(job.salary)
      if (!rangesOverlap(sRange, uiRange)) return false
    }

    return true
  })
}

export function sortJobs<T extends JobItem>(jobs: T[], sortBy: string, searchQuery = ""): T[] {
  const q = searchQuery.trim().toLowerCase()
  const score = (j: T) => {
    if (!q) return 0
    const title = j.title.toLowerCase()
    const company = j.company.toLowerCase()
    const location = j.location.toLowerCase()
    let s = 0
    if (title.includes(q)) s += 3
    if (company.includes(q)) s += 2
    if (location.includes(q)) s += 1
    return s
  }
  const salMin = (j: T) => parseSalaryRange(j.salary).min
  const salMax = (j: T) => (parseSalaryRange(j.salary).max ?? salMin(j))

  const arr = [...jobs]
  switch (sortBy) {
    case "salary-low":
      return arr.sort((a, b) => salMin(a) - salMin(b))
    case "salary-high":
      return arr.sort((a, b) => salMax(b) - salMax(a))
    case "oldest":
      return arr.sort((a, b) => a.id - b.id)
    case "relevance":
      return arr.sort((a, b) => score(b) - score(a))
    case "newest":
    default:
      return arr.sort((a, b) => b.id - a.id)
  }
}

// ----------------- DEALS -----------------
export type DealItem = {
  id: number
  title: string
  brand: string
  category: string
  currentPrice: number
  originalPrice: number
  discount: number
  rating: number
}

export type DealFilterOptions = {
  searchQuery?: string
  categories?: string[]
  brands?: string[]
  priceRange?: string | null
}

export function filterDeals<T extends DealItem>(deals: T[], opts: DealFilterOptions): T[] {
  const { searchQuery = "", categories = [], brands = [], priceRange } = opts
  const q = searchQuery.trim().toLowerCase()
  const uiRange = parseHumanRange(priceRange)

  return deals.filter((d) => {
    // Search against title/brand/category
    const hay = `${d.title} ${d.brand} ${d.category}`.toLowerCase()
    if (q && !hay.includes(q)) return false

    // Category filter
    if (categories.length > 0 && !categories.includes(d.category)) return false

    // Brand filter
    if (brands.length > 0 && !brands.includes(d.brand)) return false

    // Price range filter
    if (uiRange) {
      const priceRangeItem: Range = { min: d.currentPrice, max: d.currentPrice }
      if (!rangesOverlap(priceRangeItem, uiRange)) return false
    }

    return true
  })
}

export function sortDeals<T extends DealItem>(deals: T[], sortBy: string): T[] {
  const arr = [...deals]
  switch (sortBy) {
    case "price-low":
      return arr.sort((a, b) => a.currentPrice - b.currentPrice)
    case "price-high":
      return arr.sort((a, b) => b.currentPrice - a.currentPrice)
    case "discount":
    case "best-deal":
      return arr.sort((a, b) => b.discount - a.discount)
    case "rating":
      return arr.sort((a, b) => b.rating - a.rating)
    case "newest":
      return arr.sort((a, b) => b.id - a.id)
    default:
      return arr
  }
}
