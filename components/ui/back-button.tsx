"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface BackButtonProps {
  className?: string
}

export function BackButton({ className }: BackButtonProps) {
  const router = useRouter()

  const handleGoBack = () => {
    if (window.history.length > 1) {
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
      <span>Back</span>
    </Button>
  )
}
