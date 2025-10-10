import Link from "next/link"
import Image from "next/image"
import { Facebook, Twitter, Instagram, Linkedin, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Footer() {
  const footerLinks = {
    company: [
      { name: "About Us", href: "/about" },
      { name: "Careers", href: "/careers" },
      { name: "Press", href: "/press" },
      { name: "Contact", href: "/contact" },
    ],
    support: [
      { name: "Help Center", href: "/help" },
      { name: "FAQ", href: "/faq" },
      { name: "Support", href: "/support" },
      { name: "Community", href: "/community" },
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
      { name: "Rules", href: "/rules" },
    ],
    resources: [
      { name: "Blog", href: "/blog" },
      { name: "Pricing", href: "/pricing" },
      { name: "API", href: "/api" },
      { name: "Documentation", href: "/docs" },
    ],
  }

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
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
              Your ultimate platform for finding jobs, comparing deals, and managing your career growth.
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

          {/* Links Sections */}
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

          <div>
            <h3 className="font-semibold mb-3">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
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

          <div>
            <h3 className="font-semibold mb-3">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
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

          <div>
            <h3 className="font-semibold mb-3">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
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
              <h3 className="font-semibold mb-2">Stay updated</h3>
              <p className="text-sm text-muted-foreground">Get the latest jobs and deals delivered to your inbox.</p>
            </div>
            <div className="flex space-x-2 w-full md:w-auto">
              <Input type="email" placeholder="Enter your email" className="md:w-64" />
              <Button>
                <Mail className="h-4 w-4 mr-2" />
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">© 2024 WIRsuchen. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
