import { Users, Target, Award, Globe } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageLayout } from "@/components/layout/page-layout"
import Link from "next/link"

export default function AboutPage() {
  const stats = [
    { label: "Active Users", value: "50K+", icon: Users },
    { label: "Jobs Posted", value: "25K+", icon: Target },
    { label: "Deals Found", value: "100K+", icon: Award },
    { label: "Countries", value: "15+", icon: Globe },
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
    <PageLayout containerClassName="">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Connecting Talent with Opportunity</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            WIRsuchen is more than just a job board. We're building the future of work by connecting talented
            individuals with amazing opportunities while helping everyone save money on the things they love.
          </p>
          <Link href="/jobs">
            <Button size="lg" className="mr-4">
              Explore Jobs
            </Button>
          </Link>
          <Link href="/deals">
            <Button size="lg" variant="outline">
              Browse Deals
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
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-lg text-muted-foreground">
              We believe that finding the right job and getting the best deals shouldn't be complicated. Our platform
              combines the power of AI with human insight to create meaningful connections between talent and
              opportunity, while helping our community save money on everyday purchases.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4">For Job Seekers</h3>
              <p className="text-muted-foreground mb-6">
                We understand that job searching can be overwhelming. That's why we've built intelligent matching
                algorithms and provide personalized recommendations to help you find roles that truly fit your skills
                and aspirations.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  AI-powered job matching
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  Personalized career insights
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  Resume optimization tools
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4">For Employers</h3>
              <p className="text-muted-foreground mb-6">
                Finding the right talent is crucial for your business success. Our platform helps you reach qualified
                candidates efficiently while providing tools to manage your hiring process from start to finish.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  Advanced candidate filtering
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  Hiring analytics dashboard
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  Streamlined application management
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
            <h2 className="text-3xl font-bold mb-6">Meet Our Team</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We're a diverse team of passionate individuals committed to revolutionizing how people find jobs and
              discover great deals.
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
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have found their dream jobs and amazing deals through WIRsuchen.
          </p>
          <Link href="/register">
            <Button size="lg">Join WIRsuchen Today</Button>
          </Link>
        </div>
      </section>
    </PageLayout>
  )
}
