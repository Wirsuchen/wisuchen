/**
 * Resend Email Service
 * Handles email sending via Resend API through Supabase Edge Functions
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export interface NewsletterSubscription {
  email: string
  name?: string
}

export interface SendEmailParams {
  to: string | string[]
  subject: string
  htmlContent?: string
  textContent?: string
  fromEmail?: string
  fromName?: string
}

export class ResendService {
  private edgeFunctionUrl: string

  constructor() {
    if (!SUPABASE_URL) {
      console.warn('⚠️  Supabase URL not configured. Email features will be disabled.')
    }
    this.edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/resend`
  }

  /**
   * Subscribe email to newsletter
   * Sends a welcome email and stores subscription (you can extend this to use Supabase database)
   */
  async subscribeToNewsletter(params: NewsletterSubscription): Promise<{
    success: boolean
    message: string
    contactId?: string
  }> {
    try {
      const { email, name } = params

      // Send welcome email
      await this.sendEmail({
        to: email,
        subject: 'Welcome to our Newsletter!',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Welcome${name ? `, ${name}` : ''}!</h1>
            <p>Thank you for subscribing to our newsletter. We're excited to have you on board!</p>
            <p>You'll receive our latest updates, news, and exclusive content directly in your inbox.</p>
            <p>If you have any questions, feel free to reach out to us.</p>
            <br>
            <p>Best regards,<br>The Team</p>
          </div>
        `,
        textContent: `Welcome${name ? `, ${name}` : ''}! Thank you for subscribing to our newsletter. We're excited to have you on board!`,
      })

      // TODO: Store subscription in Supabase database if needed
      // You can create a table for newsletter subscriptions and insert here

      return {
        success: true,
        message: 'Successfully subscribed to newsletter',
        contactId: email, // Using email as identifier
      }
    } catch (error: any) {
      console.error('Resend subscription error:', error)
      throw new Error(error.message || 'Failed to subscribe to newsletter')
    }
  }

  /**
   * Send transactional email via Supabase Edge Function
   */
  async sendEmail(params: SendEmailParams): Promise<{
    success: boolean
    messageId?: string
    message: string
  }> {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to environment variables.')
    }

    try {
      const {
        to,
        subject,
        htmlContent,
        textContent,
        fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        fromName = process.env.RESEND_FROM_NAME || 'WIRsuchen',
      } = params

      const response = await fetch(this.edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          to,
          subject,
          htmlContent,
          textContent,
          fromEmail,
          fromName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email')
      }

      return {
        success: true,
        messageId: data.messageId || data.data?.id,
        message: data.message || 'Email sent successfully',
      }
    } catch (error: any) {
      console.error('Resend send email error:', error)
      throw new Error(error.message || 'Failed to send email')
    }
  }

  /**
   * Unsubscribe email from newsletter
   * Sends confirmation email and removes subscription (you can extend this to use Supabase database)
   */
  async unsubscribeFromNewsletter(email: string): Promise<{
    success: boolean
    message: string
  }> {
    try {
      // Send unsubscribe confirmation email
      await this.sendEmail({
        to: email,
        subject: 'You have been unsubscribed',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>You have been unsubscribed</h1>
            <p>We're sorry to see you go. You have been successfully unsubscribed from our newsletter.</p>
            <p>If this was a mistake, you can always subscribe again from our website.</p>
            <br>
            <p>Best regards,<br>The Team</p>
          </div>
        `,
        textContent: 'You have been successfully unsubscribed from our newsletter. If this was a mistake, you can always subscribe again from our website.',
      })

      // TODO: Remove subscription from Supabase database if needed

      return {
        success: true,
        message: 'Successfully unsubscribed from newsletter',
      }
    } catch (error: any) {
      console.error('Resend unsubscribe error:', error)
      throw new Error(error.message || 'Failed to unsubscribe from newsletter')
    }
  }

  /**
   * Check if email service is configured
   */
  isConfigured(): boolean {
    return !!SUPABASE_URL && !!SUPABASE_ANON_KEY
  }
}

// Export singleton instance
export const resendService = new ResendService()

