import { createClient } from '@/lib/supabase/server'
import { JobList } from '@/components/jobs/job-list'
import { PageLayout } from '@/components/layout/page-layout'

export default async function JobsPage() {
  const supabase = await createClient()

  // Fetch initial jobs
  const { data: jobs } = await supabase
    .from('offers')
    .select(`
      *,
      company:companies(*),
      category:categories(*)
    `)
    .eq('status', 'active')
    .eq('type', 'job')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
    .order('featured', { ascending: false })
    .order('urgent', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(20)

  // Fetch categories for search filters
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('type', 'job')
    .eq('is_active', true)
    .order('name')

  return (
    <PageLayout showBackButton={false} containerClassName="">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Find Your Dream Job</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover thousands of job opportunities from top companies across Germany
          </p>
        </div>

        <JobList 
          initialJobs={jobs || []}
          initialCategories={categories || []}
          showSearch={true}
          limit={20}
          variant="default"
        />
      </div>
    </PageLayout>
  )
}
