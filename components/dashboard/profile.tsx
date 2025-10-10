"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Upload, Save, Camera } from "lucide-react"

export function Profile() {
  const [profileData, setProfileData] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "+49 123 456 789",
    company: "TechCorp GmbH",
    position: "Senior Developer",
    location: "Berlin, Germany",
    bio: "Experienced software developer with 8+ years in web development. Passionate about creating innovative solutions and leading development teams.",
    website: "https://johndoe.dev",
    linkedin: "https://linkedin.com/in/johndoe",
    github: "https://github.com/johndoe",
  })

  const [accountSettings, setAccountSettings] = useState({
    language: "en",
    timezone: "Europe/Berlin",
    emailNotifications: true,
    marketingEmails: false,
    jobAlerts: true,
    dealAlerts: true,
  })

  const handleProfileUpdate = () => {
    // Simulate profile update
    console.log("Updating profile:", profileData)
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
              <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-4xl font-bold mx-auto mb-4">
                JD
              </div>
              <Button size="sm" className="absolute bottom-0 right-0 rounded-full w-10 h-10 p-0" variant="secondary">
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" className="w-full bg-transparent">
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
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                />
              </div>
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
                  value={profileData.company}
                  onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={profileData.position}
                  onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
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
                value={profileData.website}
                onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                placeholder="https://yourwebsite.com"
              />
            </div>
            <div>
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={profileData.linkedin}
                onChange={(e) => setProfileData({ ...profileData, linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            <div>
              <Label htmlFor="github">GitHub</Label>
              <Input
                id="github"
                value={profileData.github}
                onChange={(e) => setProfileData({ ...profileData, github: e.target.value })}
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

          <Button onClick={handleAccountUpdate} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
