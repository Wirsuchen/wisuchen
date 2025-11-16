"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, ArrowLeft } from "lucide-react"
import { useTranslation } from "@/contexts/i18n-context"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const { t, tr } = useTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Mock password reset - in real app, this would call an API
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setSuccess(true)
    } catch (err) {
      setError(t("notifications.somethingWentWrong"))
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-green-600">{t("auth.forgotPasswordPage.successTitle")}</CardTitle>
              <CardDescription>{t("auth.forgotPasswordPage.successDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                {tr("auth.forgotPasswordPage.successInfo", { email })}
              </p>
              <p className="text-sm text-gray-600">{t("auth.forgotPasswordPage.notReceived")}</p>
              <div className="space-y-2">
                <Button onClick={() => setSuccess(false)} variant="outline" className="w-full">
                  {t("auth.forgotPasswordPage.tryDifferentEmail")}
                </Button>
                <Link href="/login">
                  <Button className="w-full">{t("auth.backToLogin")}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Back Button */}
        <div className="text-left">
          <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.backToHome")}
          </Link>
        </div>
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">{t("auth.forgotPasswordPage.pageTitle")}</h2>
          <p className="mt-2 text-sm text-gray-600">
            {t("auth.forgotPasswordPage.pageDescription")}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("auth.forgotPasswordPage.formTitle")}</CardTitle>
            <CardDescription>{t("auth.forgotPasswordPage.formDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("auth.enterEmail")}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>
                {isLoading ? t("auth.forgotPasswordPage.sending") : t("auth.forgotPasswordPage.sendResetLink")}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("auth.backToLogin")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
