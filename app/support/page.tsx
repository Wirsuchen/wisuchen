 import { MessageCircle, Mail, Phone, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PageLayout } from "@/components/layout/page-layout"
import Link from "next/link"

export default function SupportPage() {
  const contactMethods = [
    {
      icon: Mail,
      title: "Email",
      description: "Best for detailed questions",
      availability: "Replies within 24–48h",
      action: "Email me",
      primary: true,
      link: "mailto:hello@yourdomain.com",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      description: "Quick questions and updates",
      availability: "Weekdays 9am–6pm",
      action: "Message on WhatsApp",
      primary: false,
      link: "https://wa.me/00000000000",
      external: true,
    },
    {
      icon: Phone,
      title: "Book a 15‑min call",
      description: "Perfect for clarifying scope",
      availability: "By appointment",
      action: "Open calendar",
      primary: false,
      link: "https://calendly.com/your-handle/intro-call",
      external: true,
    },
  ]
  const faqs = [
    { q: "How fast do you reply?", a: "I usually reply within 24 hours on weekdays (48 hours max during busy periods)." },
    { q: "Do you work on weekends?", a: "I monitor for urgent issues, but detailed replies may wait until Monday." },
    { q: "What’s the best way to reach you?", a: "Email for detailed requests; WhatsApp for quick updates. Use the form below if you prefer." },
    { q: "Can we schedule a call?", a: "Yes—use the calendar link above to pick a time that works for you." },
    { q: "Do you offer ongoing support?", a: "Yes, I offer flexible retainers and on‑demand support for ongoing work." },
    { q: "Where are you based?", a: "I’m based in your city here and work with clients worldwide across time zones." },
  ]

  return (
    <PageLayout containerClassName="">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">How can I help?</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            I’m a solo entrepreneur—so you’ll always talk to me directly. No bots. No ticket hoops.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="mailto:hello@yourdomain.com">
              <Button>Email me</Button>
            </Link>
            <Link href="#contact-form">
              <Button variant="outline">Go to contact form</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Get in Touch</h2>
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
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
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
            <h2 className="text-3xl font-bold mb-4">Prefer to write it out?</h2>
            <p className="text-muted-foreground">
              Send me a message and I’ll get back to you within 24–48 hours.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Contact form</CardTitle>
              <CardDescription>
                Share as much detail as you like—screenshots and links help me move faster.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Name</label>
                <Input placeholder="Your name" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <Input type="email" placeholder="you@example.com" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Message</label>
                <Textarea placeholder="How can I help?" rows={6} />
              </div>
              <Button className="w-full">Send message</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Availability */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Availability</h2>
          <p className="text-muted-foreground mb-6">
            I aim to reply within 24–48 hours on weekdays. During launches, it may take a bit longer.
          </p>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">Currently accepting new clients</span>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
