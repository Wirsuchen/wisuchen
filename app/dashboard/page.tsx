"use client"

import { DashboardOverview } from "@/components/dashboard/overview"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div>
      {/* Back Button */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="p-0 h-auto font-normal text-muted-foreground hover:text-foreground">
          <Link href="/" className="inline-flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
      <DashboardOverview />
    </div>
  )
}
