'use client'

import { useTranslation } from '@/contexts/i18n-context'

export function PublisherContent() {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">{t('publisher.panel.title')}</h1>
    </div>
  )
}
