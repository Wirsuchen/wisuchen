"use client"

import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageLayout } from "@/components/layout/page-layout"
import Link from "next/link"
import { useTranslation } from "@/contexts/i18n-context"

export default function PricingPage() {
  const { t } = useTranslation()
  const plans = [
    {
      id: 'basic',
      name: t('pricing.plans.basic.name'),
      price: t('pricing.plans.basic.price'),
      amount: "0",
      description: t('pricing.plans.basic.description'),
      features: [
        t('pricing.plans.basic.features.browse'),
        t('pricing.plans.basic.features.save'),
        t('pricing.plans.basic.features.alerts'),
        t('pricing.plans.basic.features.support'),
        t('pricing.plans.basic.features.ai'),
      ],
      cta: t('pricing.plans.basic.cta'),
      popular: false,
      href: "/dashboard"
    },
    {
      id: 'professional',
      name: t('pricing.plans.professional.name'),
      price: "€19",
      amount: "19",
      period: t('pricing.plans.professional.period'),
      description: t('pricing.plans.professional.description'),
      features: [
        t('pricing.plans.professional.features.everything'),
        t('pricing.plans.professional.features.jobGenerator'),
        t('pricing.plans.professional.features.seoGenerator'),
        t('pricing.plans.professional.features.blogGenerator'),
        t('pricing.plans.professional.features.filters'),
        t('pricing.plans.professional.features.priorityAlerts'),
        t('pricing.plans.professional.features.unlimited'),
        t('pricing.plans.professional.features.prioritySupport'),
      ],
      cta: t('pricing.plans.professional.cta'),
      popular: true,
      href: "/dashboard/profile"
    },
    {
      id: 'business',
      name: t('pricing.plans.business.name'),
      price: "€49",
      amount: "49",
      period: t('pricing.plans.business.period'),
      description: t('pricing.plans.business.description'),
      features: [
        t('pricing.plans.business.features.everything'),
        t('pricing.plans.business.features.posting'),
        t('pricing.plans.business.features.profile'),
        t('pricing.plans.business.features.sla'),
      ],
      cta: t('pricing.plans.business.cta'),
      popular: false,
      href: "/dashboard/profile"
    },
  ]

  return (
    <PageLayout containerClassName="">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">{t('pricing.hero.title')}</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('pricing.hero.description')}
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? "border-primary shadow-lg scale-105" : ""}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">{t('pricing.mostPopular')}</Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link href={plan.href}>
                      {plan.cta}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">{t('pricing.faqs.title')}</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2">{t('pricing.faqs.q1.question')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('pricing.faqs.q1.answer')}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">{t('pricing.faqs.q2.question')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('pricing.faqs.q2.answer')}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">{t('pricing.faqs.q3.question')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('pricing.faqs.q3.answer')}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">{t('pricing.faqs.q4.question')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('pricing.faqs.q4.answer')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
