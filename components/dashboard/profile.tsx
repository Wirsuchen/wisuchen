"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Upload, Save, Camera } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useTranslation } from "@/contexts/i18n-context"

export function Profile() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    website_url: "",
    linkedin_url: "",
    github_url: "",
    avatar_url: "",
  })

  const [subscription, setSubscription] = useState<{ isSubscribed: boolean; plan: string }>({ isSubscribed: false, plan: 'free' })
  const [paypalSubId, setPaypalSubId] = useState("")
  const [unsubscribing, setUnsubscribing] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [showUnsubscribeDialog, setShowUnsubscribeDialog] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/profile', { cache: 'no-store' })
        if (!res.ok) return
        const { profile } = await res.json()
        setProfileData({
          full_name: profile.full_name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          location: profile.location || '',
          bio: profile.bio || '',
          website_url: profile.website_url || '',
          linkedin_url: profile.linkedin_url || '',
          github_url: profile.github_url || '',
          avatar_url: profile.avatar_url || '',
        })
      } catch {}
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/me', { cache: 'no-store' })
        if (res.ok) {
          const me = await res.json()
          setSubscription({ isSubscribed: !!me.is_subscribed, plan: me.plan || 'free' })
        }
      } catch {}
    })()
  }, [])

  // Load account settings from database
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/profile/settings', { cache: 'no-store' })
        if (res.ok) {
          const { settings } = await res.json()
          if (settings) {
            setAccountSettings({
              language: settings.language || 'en',
              timezone: settings.timezone || 'Europe/Berlin',
              emailNotifications: settings.emailNotifications ?? true,
              marketingEmails: settings.marketingEmails ?? false,
              jobAlerts: settings.jobAlerts ?? true,
              dealAlerts: settings.dealAlerts ?? true,
            })
          }
        }
      } catch {}
    })()
  }, [])

  const [accountSettings, setAccountSettings] = useState({
    language: "en",
    timezone: "Europe/Berlin",
    emailNotifications: true,
    marketingEmails: false,
    jobAlerts: true,
    dealAlerts: true,
  })
  

  const handleProfileUpdate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      })
      if (res.ok) {
        toast({ 
          title: t('profile.saveSuccess'), 
          description: t('profile.saveSuccessDesc') 
        })
      } else {
        const data = await res.json().catch(() => ({}))
        toast({ 
          title: t('common.error'), 
          description: (data as any)?.error || t('profile.updateFailed'), 
          variant: 'destructive' 
        })
      }
    } catch (error: any) {
      toast({ 
        title: t('common.error'), 
        description: error?.message || t('common.unexpectedError'), 
        variant: 'destructive' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAccountUpdate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/profile/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountSettings),
      })
      if (res.ok) {
        toast({ 
          title: t('profile.settingsSaved'), 
          description: t('profile.settingsSavedDesc') 
        })
      } else {
        const data = await res.json().catch(() => ({}))
        toast({ 
          title: t('common.error'), 
          description: (data as any)?.error || t('profile.settingsSaveFailed'), 
          variant: 'destructive' 
        })
      }
    } catch (error: any) {
      toast({ 
        title: t('common.error'), 
        description: error?.message || t('common.unexpectedError'), 
        variant: 'destructive' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUnsubscribe = async () => {
    setShowUnsubscribeDialog(false)
    setUnsubscribing(true)
    try {
      const res = await fetch('/api/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paypalSubscriptionId: paypalSubId || undefined }),
      })
      if (!res.ok) throw new Error(t('profile.unsubscribeFailed'))
      setSubscription({ isSubscribed: false, plan: 'free' })
      toast({ title: t('profile.unsubscribed'), description: t('profile.unsubscribedDesc') })
    } catch (e) {
      toast({ title: t('common.error'), description: t('profile.unsubscribeError'), variant: 'destructive' })
    } finally {
      setUnsubscribing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('dashboard.profile')}</h1>
        <p className="text-muted-foreground">{t('profile.manageAccountInfo')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture */}
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.profilePicture')}</CardTitle>
            <CardDescription>{t('profile.updateProfilePhoto')}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="relative inline-block">
              <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-4xl font-bold mx-auto mb-4 overflow-hidden">
                {profileData.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profileData.avatar_url} alt={t('profile.avatar')} className="w-full h-full object-cover" />
                ) : (
                  (profileData.full_name || 'U').substring(0,2).toUpperCase()
                )}
              </div>
              <Button size="sm" className="absolute bottom-0 right-0 rounded-full w-10 h-10 p-0" variant="secondary">
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" className="w-full bg-transparent" disabled={avatarUploading} onClick={async () => {
              if (typeof document === 'undefined') return
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'image/*'
              input.onchange = async () => {
                if (!input.files || input.files.length === 0) return
                setAvatarUploading(true)
                try {
                  const form = new FormData()
                  form.append('file', input.files[0])
                  const res = await fetch('/api/profile/avatar', { method: 'POST', body: form })
                  const data = await res.json().catch(() => ({} as any))
                  if (!res.ok || !(data as any)?.success) {
                    toast({ title: t('profile.uploadFailed'), description: (data as any)?.error || t('profile.avatarUploadError'), variant: 'destructive' })
                    return
                  }
                  setProfileData((prev) => ({ ...prev, avatar_url: (data as any)?.url || prev.avatar_url }))
                  toast({ title: t('profile.avatarUpdated'), description: t('profile.avatarUpdatedDesc') })
                } catch (e: any) {
                  toast({ title: t('common.error'), description: e?.message || t('common.unexpectedError'), variant: 'destructive' })
                } finally {
                  setAvatarUploading(false)
                }
              }
              input.click()
            }}>
              <Upload className="h-4 w-4 mr-2" />
              {t('profile.uploadNewPhoto')}
            </Button>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('profile.basicInfo')}</CardTitle>
            <CardDescription>{t('profile.updatePersonalDetails')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">{t('profile.fullName')}</Label>
                <Input
                  id="full_name"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                />
              </div>
              <div></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">{t('profile.emailAddress')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">{t('profile.phoneNumber')}</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company">{t('profile.company')}</Label>
                <Input
                  id="company"
                  value={profileData.website_url}
                  onChange={(e) => setProfileData({ ...profileData, website_url: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="linkedin">{t('profile.linkedin')}</Label>
                <Input
                  id="linkedin"
                  value={profileData.linkedin_url}
                  onChange={(e) => setProfileData({ ...profileData, linkedin_url: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">{t('profile.location')}</Label>
              <Input
                id="location"
                value={profileData.location}
                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="bio">{t('profile.bio')}</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                className="min-h-24"
              />
            </div>

            <Button onClick={handleProfileUpdate} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {t('profile.saveProfile')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle>{t('profile.socialLinks')}</CardTitle>
          <CardDescription>{t('profile.addSocialProfiles')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="website">{t('profile.website')}</Label>
              <Input
                id="website"
                value={profileData.website_url}
                onChange={(e) => setProfileData({ ...profileData, website_url: e.target.value })}
                placeholder={t('profile.websitePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="linkedin">{t('profile.linkedin')}</Label>
              <Input
                id="linkedin"
                value={profileData.linkedin_url}
                onChange={(e) => setProfileData({ ...profileData, linkedin_url: e.target.value })}
                placeholder={t('profile.linkedinPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="github">{t('profile.github')}</Label>
              <Input
                id="github"
                value={profileData.github_url}
                onChange={(e) => setProfileData({ ...profileData, github_url: e.target.value })}
                placeholder={t('profile.githubPlaceholder')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('profile.accountSettings')}</CardTitle>
          <CardDescription>{t('profile.manageAccountPreferences')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="timezone">{t('profile.timezone')}</Label>
              <Select
                value={accountSettings.timezone}
                onValueChange={(value) => setAccountSettings({ ...accountSettings, timezone: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Berlin">Europe/Berlin</SelectItem>
                  <SelectItem value="Europe/London">Europe/London</SelectItem>
                  <SelectItem value="America/New_York">America/New_York</SelectItem>
                  <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-4">{t('profile.notificationPreferences')}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('profile.emailNotifications')}</p>
                  <p className="text-sm text-muted-foreground">{t('profile.emailNotificationsDesc')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={accountSettings.emailNotifications}
                  onChange={(e) => setAccountSettings({ ...accountSettings, emailNotifications: e.target.checked })}
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('profile.marketingEmails')}</p>
                  <p className="text-sm text-muted-foreground">{t('profile.marketingEmailsDesc')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={accountSettings.marketingEmails}
                  onChange={(e) => setAccountSettings({ ...accountSettings, marketingEmails: e.target.checked })}
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('profile.jobAlerts')}</p>
                  <p className="text-sm text-muted-foreground">{t('profile.jobAlertsDesc')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={accountSettings.jobAlerts}
                  onChange={(e) => setAccountSettings({ ...accountSettings, jobAlerts: e.target.checked })}
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('profile.dealAlerts')}</p>
                  <p className="text-sm text-muted-foreground">{t('profile.dealAlertsDesc')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={accountSettings.dealAlerts}
                  onChange={(e) => setAccountSettings({ ...accountSettings, dealAlerts: e.target.checked })}
                  className="h-4 w-4"
                />
              </div>
            </div>
          </div>

          <Button onClick={handleAccountUpdate} className="w-full" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? t('profile.saving') : t('profile.saveSettings')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('profile.subscription')}</CardTitle>
          <CardDescription>{t('profile.manageSubscription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <p className="font-medium">{t('profile.currentPlan')}</p>
              <p className="text-sm text-muted-foreground">{subscription.isSubscribed ? (subscription.plan || 'pro') : 'free'}</p>
            </div>
            <div>
              <Label htmlFor="paypalSubId">{t('profile.paypalSubId')}</Label>
              <Input id="paypalSubId" value={paypalSubId} onChange={(e) => setPaypalSubId(e.target.value)} placeholder={t('profile.paypalSubIdPlaceholder')} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" className="bg-transparent" disabled={unsubscribing} onClick={() => setShowUnsubscribeDialog(true)}>
              {unsubscribing ? t('profile.unsubscribing') : t('profile.unsubscribe')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showUnsubscribeDialog} onOpenChange={setShowUnsubscribeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('profile.unsubscribeFromPlan')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('profile.unsubscribeConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unsubscribing}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnsubscribe}
              disabled={unsubscribing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {unsubscribing ? t('profile.unsubscribing') : t('profile.unsubscribe')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
