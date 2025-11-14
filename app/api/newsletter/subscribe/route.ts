/**
 * Newsletter Subscription API
 * POST /api/newsletter/subscribe
 * Subscribes an email to the newsletter via Mailjet
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { mailjetService } from '@/lib/services/email/mailjet'
import { withRateLimit } from '@/lib/utils/rate-limiter'

// Validation schema
const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
  listId: z.number().optional(),
})

async function handler(req: NextRequest) {
  try {
    // Check if Mailjet is configured
    if (!mailjetService.isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Newsletter service is not configured',
        },
        { status: 503 }
      )
    }

    const body = await req.json()
    const validatedData = subscribeSchema.parse(body)

    // Subscribe to newsletter
    const result = await mailjetService.subscribeToNewsletter({
      email: validatedData.email,
      name: validatedData.name,
      listId: validatedData.listId,
    })

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        data: {
          contactId: result.contactId,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Newsletter subscription error:', error)

    // Validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    // Mailjet errors
    if (error.message?.includes('already')) {
      return NextResponse.json(
        {
          success: true,
          message: 'Email is already subscribed to newsletter',
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to subscribe to newsletter',
      },
      { status: 500 }
    )
  }
}

// Apply rate limiting: 10 requests per minute per IP
export const POST = withRateLimit(handler, { max: 10, windowMs: 60000 })

