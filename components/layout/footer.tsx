'use client'

import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/contexts/i18n-context"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export function Footer() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      toast({
        title: t('footer.newsletterInvalidEmailTitle'),
        description: t('footer.newsletterInvalidEmailDescription'),
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: t('footer.newsletterSubscribedTitle'),
          description: t('footer.newsletterSubscribedDescription'),
        })
        setEmail('')
      } else {
        toast({
          title: t('notifications.error'),
          description: data.error || t('footer.newsletterErrorTryAgain'),
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error)
      toast({
        title: t('notifications.error'),
        description: t('footer.newsletterErrorTryAgainLater'),
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const footerLinks = {
    explore: [
      { name: t('nav.jobs'), href: "/jobs" },
      { name: t('nav.deals'), href: "/deals" },
      { name: t('nav.blog'), href: "/blog" },
      { name: t('jobs.save'), href: "/saved" },
    ],
    account: [
      { name: t('nav.dashboard'), href: "/dashboard" },
      { name: t('nav.login'), href: "/login" },
      { name: t('nav.register'), href: "/register" },
      { name: t('pricing.title'), href: "/pricing" },
    ],
    company: [
      { name: t('footer.aboutUs'), href: "/about" },
      { name: t('footer.support'), href: "/support" },
      { name: t('footer.apiDocs'), href: "/api-docs" },
    ],
  }

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="w-16 h-16">
                <Image
                  src="/logo.png"
                  width={68}
                  height={68}
                  alt="Logo"
                />
              </div>
            </Link>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              {t('common.tagline')}
            </p>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon" className="rounded-full hover:text-primary" asChild>
                <Link
                  href="https://facebook.com"
                  aria-label="Visit us on Facebook"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Facebook className="size-7" aria-hidden="true" />
                  <span className="sr-only">{t('footer.facebook')}</span>
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full hover:text-primary" asChild>
                <Link
                  href="https://instagram.com"
                  aria-label="Visit us on Instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram className="size-7" aria-hidden="true" />
                  <span className="sr-only">{t('footer.instagram')}</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Explore Links */}
          <div>
            <h3 className="font-semibold mb-3">{t('footer.explore')}</h3>
            <ul className="space-y-2">
              {footerLinks.explore.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h3 className="font-semibold mb-3">{t('footer.account')}</h3>
            <ul className="space-y-2">
              {footerLinks.account.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold mb-3">{t('footer.company')}</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="border-t mt-8 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div>
              <h3 className="font-semibold mb-2">{t('footer.subscribeNewsletter')}</h3>
              <p className="text-sm text-muted-foreground">{t('footer.newsletter')}</p>
            </div>
            <form onSubmit={handleSubscribe} className="flex space-x-2 w-full md:w-auto">
              <Input 
                type="email" 
                placeholder={t('footer.enterEmail')} 
                className="md:w-64" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
              <Button type="submit" disabled={isSubmitting}>
                <Mail className="h-4 w-4 mr-2" />
                {isSubmitting ? t('footer.subscribing') : t('footer.subscribe')}
              </Button>
            </form>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">© 2024 WIRsuchen. {t('footer.allRightsReserved')}</p>
        </div>
      </div>
    </footer>
  )
}
