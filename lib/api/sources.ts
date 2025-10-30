import { API_CONFIG } from '@/lib/config/api-keys'

export type JobSourceId = 'adzuna' | 'rapidapi'
export type DealSourceId = 'adcell' | 'awin' | 'rapidapi-deals'

const DEFAULT_JOB_SOURCES: JobSourceId[] = ['adzuna', 'rapidapi']
const DEFAULT_DEAL_SOURCES: DealSourceId[] = ['adcell', 'awin', 'rapidapi-deals']

export const VERIFICATION_JOB_QUERIES = ['developer', 'sales', 'nurse', 'fahrer', 'remote'] as const

export function getEnabledJobSources(preferred?: string[]): JobSourceId[] {
  const requested = (preferred && preferred.length > 0 ? preferred : DEFAULT_JOB_SOURCES) as JobSourceId[]

  return requested.filter((source) => {
    switch (source) {
      case 'adzuna':
        return API_CONFIG.adzuna.enabled
      case 'rapidapi':
        return API_CONFIG.rapidApi.enabled
      default:
        return false
    }
  })
}

export function getEnabledDealSources(preferred?: string[]): DealSourceId[] {
  const requested = (preferred && preferred.length > 0 ? preferred : DEFAULT_DEAL_SOURCES) as DealSourceId[]

  return requested.filter((source) => {
    switch (source) {
      case 'adcell':
        return API_CONFIG.adcell.enabled
      case 'awin':
        return API_CONFIG.awin.enabled
      case 'rapidapi-deals':
        return API_CONFIG.rapidApi.enabled
      default:
        return false
    }
  })
}

export const buildVerificationQueries = () =>
  VERIFICATION_JOB_QUERIES.map((query) => ({
    query,
    isTest: true,
  }))

