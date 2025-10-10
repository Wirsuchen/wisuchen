import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageLayout } from "@/components/layout/page-layout"

export default function PricingPage() {
  const plans = [
    {
      name: "Basic",
      price: "Free",
      description: "Perfect for job seekers and casual deal hunters",
      features: [
        "Browse unlimited jobs",
        "Access to all deals",
        "Basic job alerts",
        "Save up to 10 items",
        "Community support",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Professional",
      price: "$19",
      period: "/month",
      description: "Ideal for active job seekers and deal enthusiasts",
      features: [
        "Everything in Basic",
        "Advanced job filters",
        "Priority job alerts",
        "Unlimited saved items",
        "Price drop notifications",
        "Resume builder",
        "Email support",
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Business",
      price: "$49",
      period: "/month",
      description: "For companies and recruiters",
      features: [
        "Everything in Professional",
        "Post unlimited jobs",
        "Advanced analytics",
        "Candidate management",
        "Priority support",
        "Custom branding",
        "API access",
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ]

  return (
    <PageLayout containerClassName="">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Choose the perfect plan for your needs. Upgrade or downgrade at any time.
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
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">Most Popular</Badge>
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
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                    {plan.cta}
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
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
              <p className="text-muted-foreground text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-muted-foreground text-sm">
                Yes, all paid plans come with a 14-day free trial. No credit card required.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground text-sm">
                We accept all major credit cards, PayPal, and bank transfers for annual plans.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-muted-foreground text-sm">
                Yes, we offer a 30-day money-back guarantee for all paid plans.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
