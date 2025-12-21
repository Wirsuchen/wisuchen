import {NextRequest, NextResponse} from "next/server"
import {createClient} from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {searchParams} = new URL(request.url)
    const contentType = searchParams.get("type") // 'job', 'deal', 'blog'
    const contentId = searchParams.get("content_id")
    const detailed = searchParams.get("detailed") === "true"

    // Get specific content translation status
    if (contentId) {
      const {data: translations, error} = await (supabase as any)
        .from("translations")
        .select("language, type, translations, created_at, updated_at")
        .eq("content_id", contentId)
        .order("language")

      if (error) {
        return NextResponse.json({error: error.message}, {status: 500})
      }

      return NextResponse.json({
        content_id: contentId,
        translations: translations || [],
        coverage: {
          total_languages: 4,
          translated: translations?.length || 0,
          missing: 4 - (translations?.length || 0),
          languages: {
            en: translations?.some((t: any) => t.language === "en") || false,
            de: translations?.some((t: any) => t.language === "de") || false,
            fr: translations?.some((t: any) => t.language === "fr") || false,
            it: translations?.some((t: any) => t.language === "it") || false,
          },
        },
      })
    }

    // Get overall translation statistics
    const {data: stats, error: statsError} = await (supabase as any)
      .from("translations")
      .select("type, language")

    if (statsError) {
      return NextResponse.json({error: statsError.message}, {status: 500})
    }

    // Calculate statistics
    const byType: Record<string, any> = {}
    const byLanguage: Record<string, number> = {
      en: 0,
      de: 0,
      fr: 0,
      it: 0,
    }

    stats?.forEach((row: any) => {
      // Count by type
      if (!byType[row.type]) {
        byType[row.type] = {en: 0, de: 0, fr: 0, it: 0, total: 0}
      }
      byType[row.type][row.language]++
      byType[row.type].total++

      // Count by language
      byLanguage[row.language]++
    })

    // Get content counts from offers table
    const {count: jobCount} = await supabase
      .from("offers")
      .select("*", {count: "exact", head: true})
      .eq("type", "job")
      .in("status", ["active", "pending"])

    // Get recent translations
    let recentTranslations = null
    if (detailed) {
      const {data: recent} = await (supabase as any)
        .from("translations")
        .select("content_id, type, language, created_at")
        .order("created_at", {ascending: false})
        .limit(20)

      recentTranslations = recent
    }

    return NextResponse.json({
      statistics: {
        total_translations: stats?.length || 0,
        by_type: byType,
        by_language: byLanguage,
        content_counts: {
          jobs_in_db: jobCount || 0,
          expected_job_translations: (jobCount || 0) * 4, // 4 languages per job
          actual_job_translations: byType.job?.total || 0,
          coverage_percentage: jobCount
            ? Math.round(
                ((byType.job?.total || 0) / ((jobCount || 0) * 4)) * 100
              )
            : 0,
        },
      },
      recent_translations: recentTranslations,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Translation status API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {status: 500}
    )
  }
}
