import {NextResponse} from "next/server"
import {translateText, translateBatch} from "@/lib/services/google-translate"

/**
 * Simple test endpoint for Google Cloud Translate API
 * GET /api/test-translate
 */
export async function GET() {
  const results: {
    singleText: {
      success: boolean
      input: string
      output?: string
      error?: string
    }
    batchText: {
      success: boolean
      inputs: string[]
      outputs?: string[]
      error?: string
    }
    credentials: {hasServiceAccount: boolean; hasApiKey: boolean}
  } = {
    singleText: {success: false, input: "Hello, how are you?"},
    batchText: {
      success: false,
      inputs: ["Good morning", "Thank you", "Goodbye"],
    },
    credentials: {
      hasServiceAccount: false,
      hasApiKey: false,
    },
  }

  // Check credentials
  const fs = await import("fs")
  const path = await import("path")

  try {
    const credPath = path.join(
      process.cwd(),
      "credentials",
      "google-translate-service-account.json"
    )
    if (fs.existsSync(credPath)) {
      const content = fs.readFileSync(credPath, "utf-8")
      const parsed = JSON.parse(content)
      results.credentials.hasServiceAccount = !!(
        parsed.client_email && parsed.private_key
      )
    }
  } catch {
    results.credentials.hasServiceAccount = false
  }

  results.credentials.hasApiKey = !!process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY

  // Test 1: Single text translation (English -> German)
  try {
    const singleResult = await translateText("Hello, how are you?", "de", "en")
    results.singleText = {
      success: singleResult.success,
      input: "Hello, how are you?",
      output: singleResult.translation,
      error: singleResult.error,
    }
  } catch (error: any) {
    results.singleText.error = error.message
  }

  // Test 2: Batch translation (English -> French)
  try {
    const batchResult = await translateBatch(
      ["Good morning", "Thank you", "Goodbye"],
      "fr",
      "en"
    )
    results.batchText = {
      success: batchResult.success,
      inputs: ["Good morning", "Thank you", "Goodbye"],
      outputs: batchResult.translations,
      error: batchResult.error,
    }
  } catch (error: any) {
    results.batchText.error = error.message
  }

  // Determine overall status
  const allPassed = results.singleText.success && results.batchText.success
  const hasCredentials =
    results.credentials.hasServiceAccount || results.credentials.hasApiKey

  return NextResponse.json(
    {
      status: allPassed
        ? "✅ Google Translate API is working!"
        : "❌ Translation failed",
      credentialsFound: hasCredentials,
      tests: results,
      help: !hasCredentials
        ? "No credentials found. Please add your service account JSON to credentials/google-translate-service-account.json or set GOOGLE_CLOUD_TRANSLATE_API_KEY environment variable."
        : undefined,
    },
    {status: allPassed ? 200 : 500}
  )
}
