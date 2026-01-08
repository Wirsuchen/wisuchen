import {NextRequest, NextResponse} from "next/server"
import {
  translateText,
  translateBatch,
  translateJob,
  translateDeal,
  translateBlog,
  SupportedLanguage,
} from "@/lib/services/google-translate"
import {storeTranslation, ContentType} from "@/lib/services/translation-service"

/**
 * Translation API Route
 *
 * Uses Google Cloud Translate API with service account authentication
 * Stores translations in Supabase for future use
 *
 * Supports:
 * - Single text translation
 * - Batch text translation
 * - Job translation (title + description)
 * - Deal translation (title + description)
 * - Blog translation (title + description + content)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      content,
      texts,
      toLanguage,
      fromLanguage,
      contentType = "general",
      // For structured content
      title,
      description,
      blogContent,
      // Optional: content ID to store translation in database
      contentId,
    } = body

    // Support both 'content' and 'blogContent' for blog translation
    const blogContentToTranslate =
      blogContent || (contentType === "blog" ? body.content : undefined)

    // Validate target language
    const validLanguages: SupportedLanguage[] = ["en", "de", "fr", "it"]
    if (!toLanguage || !validLanguages.includes(toLanguage)) {
      return NextResponse.json(
        {error: "Valid toLanguage is required (en, de, fr, it)"},
        {status: 400}
      )
    }

    // Handle job translation
    if (contentType === "job" && title !== undefined) {
      const result = await translateJob(
        title || "",
        description || "",
        toLanguage as SupportedLanguage,
        fromLanguage as SupportedLanguage | undefined
      )

      // Store translation in database if contentId provided
      if (contentId && result.title) {
        storeTranslation(contentId, toLanguage, "job" as ContentType, {
          title: result.title,
          description: result.description,
        }).catch(err =>
          console.error("[Translate API] Failed to store job translation:", err)
        )
      }

      return NextResponse.json({
        success: true,
        title: result.title,
        description: result.description,
        stored: !!contentId,
      })
    }

    // Handle deal translation
    if (contentType === "deal" && title !== undefined) {
      const result = await translateDeal(
        title || "",
        description || "",
        toLanguage as SupportedLanguage,
        fromLanguage as SupportedLanguage | undefined
      )

      // Store translation in database if contentId provided
      if (contentId && result.title) {
        storeTranslation(contentId, toLanguage, "deal" as ContentType, {
          title: result.title,
          description: result.description,
        }).catch(err =>
          console.error(
            "[Translate API] Failed to store deal translation:",
            err
          )
        )
      }

      return NextResponse.json({
        success: true,
        title: result.title,
        description: result.description,
        stored: !!contentId,
      })
    }

    // Handle blog translation
    if (contentType === "blog" && title !== undefined) {
      const result = await translateBlog(
        title || "",
        description || "",
        blogContentToTranslate || "",
        toLanguage as SupportedLanguage,
        fromLanguage as SupportedLanguage | undefined
      )

      // Store translation in database if contentId provided
      if (contentId && result.title) {
        storeTranslation(contentId, toLanguage, "blog" as ContentType, {
          title: result.title,
          description: result.description,
          content: result.content,
        }).catch(err =>
          console.error(
            "[Translate API] Failed to store blog translation:",
            err
          )
        )
      }

      return NextResponse.json({
        success: true,
        title: result.title,
        description: result.description,
        content: result.content,
        stored: !!contentId,
      })
    }

    // Handle batch translation
    if (texts && Array.isArray(texts)) {
      const result = await translateBatch(
        texts,
        toLanguage as SupportedLanguage,
        fromLanguage as SupportedLanguage | undefined
      )

      if (!result.success) {
        return NextResponse.json({error: result.error}, {status: 500})
      }

      return NextResponse.json({translations: result.translations})
    }

    // Handle single text translation
    if (!content) {
      return NextResponse.json(
        {error: "Content or texts array is required"},
        {status: 400}
      )
    }

    const result = await translateText(
      content,
      toLanguage as SupportedLanguage,
      fromLanguage as SupportedLanguage | undefined
    )

    if (!result.success) {
      return NextResponse.json({error: result.error}, {status: 500})
    }

    return NextResponse.json({
      translation: result.translation,
      fromCache: result.fromCache,
      source: "google-translate",
    })
  } catch (error: any) {
    console.error("Error in translate API:", error)
    return NextResponse.json(
      {error: error.message || "Internal server error"},
      {status: 500}
    )
  }
}

// Health check endpoint
export async function GET() {
  try {
    // Test actual translation with Google Translate
    const result = await translateText("Hello", "de", "en")

    return NextResponse.json({
      status: result.success ? "ok" : "degraded",
      services: {
        googleTranslate: result.success ? "available" : "unavailable",
      },
      test: result.success ? "passed" : "failed",
      testResult: result.translation,
      testSource: "google-translate",
      info: "Using Google Cloud Translate API with service account",
    })
  } catch (error: any) {
    console.error("Health check error:", error)
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
        suggestion: "Check Google Cloud service account credentials",
      },
      {status: 500}
    )
  }
}
