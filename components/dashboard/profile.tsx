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

export function Profile() {
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
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAccountUpdate = () => {
    // Simulate account settings update
    console.log("Updating account settings:", accountSettings)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Update your profile photo</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="relative inline-block">
              <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-4xl font-bold mx-auto mb-4 overflow-hidden">
                {profileData.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profileData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  (profileData.full_name || 'U').substring(0,2).toUpperCase()
                )}
              </div>
              <Button size="sm" className="absolute bottom-0 right-0 rounded-full w-10 h-10 p-0" variant="secondary">
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" className="w-full bg-transparent" onClick={async () => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'image/*'
              input.onchange = async () => {
                if (!input.files || input.files.length === 0) return
                const form = new FormData()
                form.append('file', input.files[0])
                await fetch('/api/profile/avatar', { method: 'POST', body: form })
                location.reload()
              }
              input.click()
            }}>
              <Upload className="h-4 w-4 mr-2" />
              Upload New Photo
            </Button>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
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
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={profileData.website_url}
                  onChange={(e) => setProfileData({ ...profileData, website_url: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={profileData.linkedin_url}
                  onChange={(e) => setProfileData({ ...profileData, linkedin_url: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={profileData.location}
                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                className="min-h-24"
              />
            </div>

            <Button onClick={handleProfileUpdate} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Profile
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
          <CardDescription>Add your professional social media profiles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={profileData.website_url}
                onChange={(e) => setProfileData({ ...profileData, website_url: e.target.value })}
                placeholder="https://yourwebsite.com"
              />
            </div>
            <div>
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={profileData.linkedin_url}
                onChange={(e) => setProfileData({ ...profileData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            <div>
              <Label htmlFor="github">GitHub</Label>
              <Input
                id="github"
                value={profileData.github_url}
                onChange={(e) => setProfileData({ ...profileData, github_url: e.target.value })}
                placeholder="https://github.com/username"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your account preferences and notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="language">Language</Label>
              <Select
                value={accountSettings.language}
                onValueChange={(value) => setAccountSettings({ ...accountSettings, language: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
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
            <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive important account updates</p>
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
                  <p className="font-medium">Marketing Emails</p>
                  <p className="text-sm text-muted-foreground">Receive promotional content and offers</p>
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
                  <p className="font-medium">Job Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified about new job opportunities</p>
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
                  <p className="font-medium">Deal Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified about price drops and new deals</p>
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
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
