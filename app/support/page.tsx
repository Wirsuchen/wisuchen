 "use client"

import { MessageCircle, Mail, Phone, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PageLayout } from "@/components/layout/page-layout"
import Link from "next/link"
import { useTranslation } from "@/contexts/i18n-context"

export default function SupportPage() {
  const { t } = useTranslation()
  const contactMethods = [
    {
      icon: Mail,
      title: t('support.contact.email.title'),
      description: t('support.contact.email.description'),
      availability: t('support.contact.email.availability'),
      action: t('support.contact.email.action'),
      primary: true,
      link: "mailto:hello@yourdomain.com",
    },
    {
      icon: MessageCircle,
      title: t('support.contact.whatsapp.title'),
      description: t('support.contact.whatsapp.description'),
      availability: t('support.contact.whatsapp.availability'),
      action: t('support.contact.whatsapp.action'),
      primary: false,
      link: "https://wa.me/00000000000",
      external: true,
    },
    {
      icon: Phone,
      title: t('support.contact.call.title'),
      description: t('support.contact.call.description'),
      availability: t('support.contact.call.availability'),
      action: t('support.contact.call.action'),
      primary: false,
      link: "https://calendly.com/your-handle/intro-call",
      external: true,
    },
  ]
  const faqs = [
    { q: t('support.faqs.q1'), a: t('support.faqs.a1') },
    { q: t('support.faqs.q2'), a: t('support.faqs.a2') },
    { q: t('support.faqs.q3'), a: t('support.faqs.a3') },
    { q: t('support.faqs.q4'), a: t('support.faqs.a4') },
    { q: t('support.faqs.q5'), a: t('support.faqs.a5') },
    { q: t('support.faqs.q6'), a: t('support.faqs.a6') },
  ]

  return (
    <PageLayout containerClassName="">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">{t('support.hero.title')}</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('support.hero.description')}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="mailto:hello@yourdomain.com">
              <Button>{t('support.hero.emailButton')}</Button>
            </Link>
            <Link href="#contact-form">
              <Button variant="outline">{t('support.hero.formButton')}</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{t('support.contact.title')}</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {contactMethods.map((method, index) => (
              <Card key={index} className={`text-center ${method.primary ? "border-primary shadow-lg" : ""}`}>
                <CardHeader>
                  <method.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <CardTitle className="text-xl">{method.title}</CardTitle>
                  <CardDescription>{method.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center mb-4">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{method.availability}</span>
                  </div>
                  {"link" in method && method.link ? (
                    <Link href={method.link as string} target={(method as any).external ? "_blank" : undefined}>
                      <Button className="w-full" variant={method.primary ? "default" : "outline"}>
                        {method.action}
                      </Button>
                    </Link>
                  ) : (
                    <Button className="w-full" variant={method.primary ? "default" : "outline"}>
                      {method.action}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">{t('support.faqs.title')}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {faqs.map((item, idx) => (
              <div key={idx} className="p-5 border rounded-lg hover:shadow-sm transition-shadow">
                <p className="font-medium">{item.q}</p>
                <p className="text-sm text-muted-foreground mt-2">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact-form" className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('support.form.title')}</h2>
            <p className="text-muted-foreground">
              {t('support.form.description')}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('support.form.cardTitle')}</CardTitle>
              <CardDescription>
                {t('support.form.cardDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{t('support.form.name')}</label>
                <Input placeholder={t('support.form.namePlaceholder')} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t('support.form.email')}</label>
                <Input type="email" placeholder={t('support.form.emailPlaceholder')} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t('support.form.message')}</label>
                <Textarea placeholder={t('support.form.messagePlaceholder')} rows={6} />
              </div>
              <Button className="w-full">{t('support.form.sendButton')}</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Availability */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">{t('support.availability.title')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('support.availability.description')}
          </p>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">{t('support.availability.status')}</span>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
