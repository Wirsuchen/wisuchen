import {NextRequest, NextResponse} from "next/server"
import {getMonitoringStats} from "@/lib/services/lingva-translate"

export async function GET(request: NextRequest) {
  // Get stats from translation service
  const translationStats = getMonitoringStats()

  // Calculate recent activity
  const now = Date.now()
  const last5min = translationStats.recentCalls.filter(
    (l: any) => new Date(l.timestamp).getTime() > now - 300000
  )
  const last1hour = translationStats.recentCalls.filter(
    (l: any) => new Date(l.timestamp).getTime() > now - 3600000
  )

  // Calculate success rate
  const successRate =
    translationStats.totalCalls > 0
      ? Math.round(
          (translationStats.successfulCalls / translationStats.totalCalls) * 100
        )
      : 100

  // Calculate average duration
  const logsWithDuration = translationStats.recentCalls.filter(
    (l: any) => l.duration_ms
  )
  const avgDuration =
    logsWithDuration.length > 0
      ? Math.round(
          logsWithDuration.reduce(
            (sum: number, l: any) => sum + (l.duration_ms || 0),
            0
          ) / logsWithDuration.length
        )
      : 0

  // Group errors
  const errorSummary: Record<string, number> = {}
  translationStats.recentCalls
    .filter((l: any) => l.status === "error" || l.status === "rate_limited")
    .forEach((l: any) => {
      const errorKey = l.error || l.status
      errorSummary[errorKey] = (errorSummary[errorKey] || 0) + 1
    })

  // Find last rate limit
  const lastRateLimitLog = translationStats.recentCalls.find(
    (l: any) => l.status === "rate_limited"
  )
  const lastRateLimitTime = lastRateLimitLog
    ? new Date(lastRateLimitLog.timestamp).getTime()
    : 0
  const timeSinceRateLimit = now - lastRateLimitTime
  const isCurrentlyRateLimited = timeSinceRateLimit < 60000 // Within last minute

  // Calculate calls per minute/hour
  const callsPerMinute = translationStats.recentCalls.filter(
    (l: any) => new Date(l.timestamp).getTime() > now - 60000
  ).length
  const callsPerHour = translationStats.recentCalls.filter(
    (l: any) => new Date(l.timestamp).getTime() > now - 3600000
  ).length

  return NextResponse.json({
    status: isCurrentlyRateLimited ? "rate_limited" : "healthy",
    current_time: new Date().toISOString(),

    overall_stats: {
      total_calls: translationStats.totalCalls,
      successful_calls: translationStats.successfulCalls,
      failed_calls: translationStats.failedCalls,
      rate_limited_calls: translationStats.rateLimitedCalls,
      success_rate: `${successRate}%`,
      average_duration_ms: avgDuration,
      time_since_last_rate_limit: lastRateLimitLog
        ? `${Math.round(timeSinceRateLimit / 1000)}s ago`
        : "never",
      calls_per_minute: callsPerMinute,
      calls_per_hour: callsPerHour,
    },

    recent_activity: {
      last_5_minutes: {
        total_calls: last5min.length,
        successful: last5min.filter((l: any) => l.status === "success").length,
        failed: last5min.filter((l: any) => l.status === "error").length,
        rate_limited: last5min.filter((l: any) => l.status === "rate_limited")
          .length,
      },
      last_hour: {
        total_calls: last1hour.length,
        successful: last1hour.filter((l: any) => l.status === "success").length,
        failed: last1hour.filter((l: any) => l.status === "error").length,
        rate_limited: last1hour.filter((l: any) => l.status === "rate_limited")
          .length,
      },
    },

    rate_limits: {
      is_currently_limited: isCurrentlyRateLimited,
      total_rate_limit_hits: translationStats.rateLimitedCalls,
      calls_per_minute: callsPerMinute,
      calls_per_hour: callsPerHour,
      free_api_limits: {
        note: "Using free APIs (MyMemory, Lingva, LibreTranslate)",
        recommended_max_per_minute: 15,
        recommended_max_per_day: 5000,
        mymemory_limit: "5000 words/day",
        lingva_limit: "No official limit (public instance)",
        libretranslate_limit: "No official limit (public instance)",
      },
      status:
        callsPerMinute > 15
          ? "⚠️ High load"
          : callsPerMinute > 10
          ? "⚡ Moderate"
          : "✅ Normal",
    },

    error_summary: errorSummary,

    recent_calls: translationStats.recentCalls.slice(0, 20).map((log: any) => ({
      ...log,
      time_ago: `${Math.round(
        (now - new Date(log.timestamp).getTime()) / 1000
      )}s ago`,
    })),

    health_indicators: {
      success_rate:
        successRate >= 90
          ? "✅ Excellent"
          : successRate >= 70
          ? "⚠️ Warning"
          : "❌ Critical",
      rate_limit_status:
        translationStats.rateLimitedCalls === 0
          ? "✅ No issues"
          : translationStats.rateLimitedCalls < 5
          ? "⚠️ Some limits hit"
          : "❌ Frequent rate limits",
      api_responsiveness:
        avgDuration < 2000
          ? "✅ Fast"
          : avgDuration < 5000
          ? "⚠️ Slow"
          : "❌ Very slow",
      cache_efficiency:
        translationStats.recentCalls.filter((l: any) => l.status === "success")
          .length > 0
          ? "✅ Active"
          : "⚠️ Low",
    },

    recommendations: [
      callsPerMinute > 15 &&
        "⚠️ High API load detected - consider adding delays between translations",
      translationStats.rateLimitedCalls > 5 &&
        "❌ Frequent rate limits - increase delays or reduce batch sizes",
      avgDuration > 5000 && "⚠️ Slow response times - APIs may be overloaded",
      successRate < 80 && "❌ Low success rate - check API availability",
    ].filter(Boolean),
  })
}
