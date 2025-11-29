'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from '@/contexts/i18n-context'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useTranslation()

  useEffect(() => {
    // Log error to console for debugging
    console.error('Application error:', error)

    // Optionally log to error tracking service (e.g., Sentry)
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error)
    // }
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>
              {t('notifications.somethingWentWrong', 'Something went wrong!')}
            </CardTitle>
          </div>
          <CardDescription>
            {t(
              'common.unexpectedErrorDescription',
              'An unexpected error occurred. Please try again or contact support if the problem persists.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-mono text-muted-foreground break-all">
              {error.message}
              {error.digest && <span className="block mt-1 text-xs">Digest: {error.digest}</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={reset} variant="default">
              {t('common.tryAgain')}
            </Button>
            <Button asChild variant="outline">
              <Link href="/">{t('common.backToHome')}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

