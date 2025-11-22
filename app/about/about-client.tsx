'use client'

import { Users, Target, Award, Globe } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useTranslation } from "@/contexts/i18n-context"

interface AboutContentProps {
  cmsContent?: string | null
}

export function AboutContent({ cmsContent }: AboutContentProps) {
  const { t } = useTranslation()
  const stats = [
    { label: t('about.stats.activeUsers'), value: "50K+", icon: Users },
    { label: t('about.stats.jobsPosted'), value: "25K+", icon: Target },
    { label: t('about.stats.dealsFound'), value: "100K+", icon: Award },
    { label: t('about.stats.countries'), value: "15+", icon: Globe },
  ]

  const team = [
    {
      name: "Sarah Johnson",
      role: "CEO & Founder",
      bio: "Former VP at LinkedIn with 15+ years in talent acquisition.",
      image: "/professional-woman-ceo.png",
    },
    {
      name: "Michael Chen",
      role: "CTO",
      bio: "Ex-Google engineer passionate about connecting talent with opportunities.",
      image: "/professional-man-cto.png",
    },
    {
      name: "Emily Rodriguez",
      role: "Head of Product",
      bio: "Product leader focused on creating exceptional user experiences.",
      image: "/professional-woman-product-manager.png",
    },
  ]

  return (
    <>
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">{t('about.hero.title')}</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            {t('about.hero.description')}
          </p>
          <Link href="/jobs">
            <Button size="lg" className="mr-4">
              {t('about.hero.exploreJobs')}
            </Button>
          </Link>
          <Link href="/deals">
            <Button size="lg" variant="outline">
              {t('about.hero.browseDeals')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <stat.icon className="h-8 w-8 mx-auto mb-4 text-primary" />
                  <div className="text-3xl font-bold mb-2">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">{t('about.mission.title')}</h2>
            <div className="text-lg text-muted-foreground">
              {cmsContent ? (
                <div dangerouslySetInnerHTML={{ __html: cmsContent }} className="prose prose-lg dark:prose-invert mx-auto" />
              ) : (
                t('about.mission.description')
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4">{t('about.mission.forJobSeekers.title')}</h3>
              <p className="text-muted-foreground mb-6">
                {t('about.mission.forJobSeekers.description')}
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  {t('about.mission.forJobSeekers.aiMatching')}
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  {t('about.mission.forJobSeekers.careerInsights')}
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  {t('about.mission.forJobSeekers.resumeTools')}
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4">{t('about.mission.forEmployers.title')}</h3>
              <p className="text-muted-foreground mb-6">
                {t('about.mission.forEmployers.description')}
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  {t('about.mission.forEmployers.candidateFiltering')}
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  {t('about.mission.forEmployers.hiringAnalytics')}
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  {t('about.mission.forEmployers.applicationManagement')}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">{t('about.team.title')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('about.team.description')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {team.map((member, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <img
                    src={member.image || "/placeholder.svg"}
                    alt={member.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h3 className="font-bold text-lg mb-1">{member.name}</h3>
                  <p className="text-primary text-sm mb-3">{member.role}</p>
                  <p className="text-muted-foreground text-sm">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">{t('about.cta.title')}</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('about.cta.description')}
          </p>
          <Link href="/register">
            <Button size="lg">{t('about.cta.joinToday')}</Button>
          </Link>
        </div>
      </section>
    </>
  )
}
