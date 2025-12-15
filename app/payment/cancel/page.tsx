import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageLayout } from '@/components/layout/page-layout'
import { XCircle, ArrowLeft, CreditCard, Home } from 'lucide-react'
import Link from 'next/link'
import { getTranslation } from '@/i18n/utils'
import { Locale, defaultLocale, isValidLocale } from '@/i18n/config'

export default async function PaymentCancelPage() {
  const supabase = await createClient()

  // Get locale from cookie
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value
  const locale: Locale = localeCookie && isValidLocale(localeCookie) ? localeCookie as Locale : defaultLocale
  const t = (key: string) => getTranslation(locale, key)

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  return (
    <PageLayout showBackButton={true} containerClassName="max-w-4xl">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-red-600 mb-2">{t('payment.cancel.title')}</h1>
          <p className="text-muted-foreground">
            {t('payment.cancel.description')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('payment.cancel.whatHappened')}</CardTitle>
            <CardDescription>
              {t('payment.cancel.whatHappenedDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                {t('payment.cancel.noChargeAlert')}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h4 className="font-medium">{t('payment.cancel.commonReasons')}</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• {t('payment.cancel.reason1')}</li>
                <li>• {t('payment.cancel.reason2')}</li>
                <li>• {t('payment.cancel.reason3')}</li>
                <li>• {t('payment.cancel.reason4')}</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">{t('payment.cancel.whatToDo')}</h3>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <Link href="/payment">
                    <CreditCard className="w-4 h-4 mr-2" />
                    {t('payment.cancel.tryAgain')}
                  </Link>
                </Button>

                <Button variant="outline" asChild>
                  <Link href="/jobs">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('payment.cancel.browseJobs')}
                  </Link>
                </Button>

                <Button variant="outline" asChild>
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    {t('common.backToHome')}
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('payment.cancel.needHelp')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <p>{t('payment.cancel.helpIntro')}</p>
              <ul className="space-y-1 ml-4 text-muted-foreground">
                <li>• {t('payment.cancel.helpTip1')}</li>
                <li>• {t('payment.cancel.helpTip2')}</li>
                <li>• {t('payment.cancel.helpTip3')}</li>
                <li>• {t('payment.cancel.helpTip4')}</li>
                <li>• {t('payment.cancel.helpTip5')}</li>
              </ul>

              <div className="pt-3 border-t">
                <p className="font-medium">{t('payment.cancel.stillTrouble')}</p>
                <p className="text-muted-foreground">
                  {t('payment.cancel.contactSupport')}{' '}
                  <a href="mailto:support@wirsuchen.com" className="text-primary hover:underline">
                    support@wirsuchen.com
                  </a>
                  {' '}or call us at +49 (0) 30 12345678
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
