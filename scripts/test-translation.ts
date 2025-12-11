
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testTranslation() {
  const jobId = '53a8876a-d9a0-456e-bb7e-d13f2b13d3f6'
  const lang = 'de'
  
  console.log(`Testing translation for job ${jobId} to ${lang}...`)

  // 1. Fetch job from offers to check source
  const { data: job, error: jobError } = await supabase
    .from('offers')
    .select('*')
    .eq('id', jobId)
    .single()

  if (jobError) {
    console.error('Error fetching job:', jobError)
    return
  }
  
  console.log('Job fetched:', { id: job.id, title: job.title, source: job.source })

  // 2. Check translation directly
  const contentId = `job-${job.source || 'db'}-${job.id}`
  console.log('Constructed content_id:', contentId)

  const { data: translation, error: transError } = await supabase
    .from('translations')
    .select('*')
    .eq('content_id', contentId)
    .eq('language', lang)
    .eq('type', 'job')
    .single()

  if (transError) {
    console.error('Error fetching translation:', transError)
  } else {
    console.log('Translation found:', translation)
  }

  // 3. Simulate applyTranslations logic
  const items = [job]
  const type = 'job'
  
  // Re-implement simplified applyTranslations logic to verify
  const mappedContentId = `job-${job.source || 'db'}-${job.id}`
  
  if (translation && translation.content_id === mappedContentId) {
      console.log('Match confirmed!')
      const translatedJob = {
          ...job,
          title: translation.translations.title || job.title,
          description: translation.translations.description || job.description
      }
      console.log('Translated Title:', translatedJob.title)
  } else {
      console.log('Match FAILED!')
  }
}

testTranslation()

