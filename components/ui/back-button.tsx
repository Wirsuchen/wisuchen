"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useTranslation } from '@/contexts/i18n-context'

interface BackButtonProps {
  className?: string
}

export function BackButton({ className }: BackButtonProps) {
  const { t } = useTranslation()
  const router = useRouter()

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push("/")
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleGoBack}
      className={`flex items-center space-x-2 text-muted-foreground hover:text-foreground ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      <span>{t('backButton.back')}</span>
    </Button>
  )
}
