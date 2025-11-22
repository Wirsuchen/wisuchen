import { PageLayout } from "@/components/layout/page-layout"
import { AboutContent } from "./about-client"
import { createClient } from "@/lib/supabase/server"

export default async function AboutPage() {
  const supabase = await createClient()
  const { data: page } = await supabase
    .from('content_pages')
    .select('content')
    .eq('slug', 'about')
    .eq('is_published', true)
    .single()

  return (
    <PageLayout containerClassName="">
      <AboutContent cmsContent={page?.content} />
    </PageLayout>
  )
}
