'use client'

import Link from "next/link"
import Image from "next/image"
import { Facebook, Twitter, Instagram, Linkedin, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/contexts/i18n-context"

export function Footer() {
  const { t } = useTranslation()
  
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
                  <span className="sr-only">Facebook</span>
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full hover:text-primary" asChild>
                <Link
                  href="https://twitter.com"
                  aria-label="Visit us on X (Twitter)"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Twitter className="size-7" aria-hidden="true" />
                  <span className="sr-only">X (Twitter)</span>
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
                  <span className="sr-only">Instagram</span>
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full hover:text-primary" asChild>
                <Link
                  href="https://linkedin.com"
                  aria-label="Visit us on LinkedIn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin className="size-7" aria-hidden="true" />
                  <span className="sr-only">LinkedIn</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Explore Links */}
          <div>
            <h3 className="font-semibold mb-3">Explore</h3>
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
            <h3 className="font-semibold mb-3">Account</h3>
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
            <h3 className="font-semibold mb-3">Company</h3>
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
            <div className="flex space-x-2 w-full md:w-auto">
              <Input type="email" placeholder={t('footer.enterEmail')} className="md:w-64" />
              <Button>
                <Mail className="h-4 w-4 mr-2" />
                {t('footer.subscribe')}
              </Button>
            </div>
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
