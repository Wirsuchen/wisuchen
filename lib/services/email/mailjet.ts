/**
 * Mailjet Email Service
 * Handles newsletter subscriptions and email sending via Mailjet API
 */

import Mailjet from 'node-mailjet'

const apiKey = process.env.MAILJET_API_KEY || ''
const apiSecret = process.env.MAILJET_SECRET_KEY || ''

if (!apiKey || !apiSecret) {
  console.warn('⚠️  Mailjet API credentials not configured. Email features will be disabled.')
}

// Initialize Mailjet client
const mailjet = apiKey && apiSecret 
  ? new Mailjet({
      apiKey,
      apiSecret,
    })
  : null

export interface NewsletterSubscription {
  email: string
  name?: string
  listId?: number // Optional: specific list ID, defaults to first list
}

export interface SendEmailParams {
  to: string | string[]
  subject: string
  htmlContent?: string
  textContent?: string
  fromEmail?: string
  fromName?: string
}

export class MailjetService {
  /**
   * Subscribe email to newsletter
   * Adds contact to Mailjet and subscribes to default newsletter list
   */
  async subscribeToNewsletter(params: NewsletterSubscription): Promise<{
    success: boolean
    message: string
    contactId?: number
  }> {
    if (!mailjet) {
      throw new Error('Mailjet service not configured. Please add MAILJET_API_KEY and MAILJET_SECRET_KEY to environment variables.')
    }

    try {
      const { email, name, listId } = params

      // Get the list ID to subscribe to
      let targetListId = listId
      if (!targetListId) {
        const lists = await this.getContactLists()
        if (lists.length === 0) {
          throw new Error('No contact lists found in Mailjet. Please create a list in your Mailjet account first.')
        }
        targetListId = lists[0].ID
      }

      // Use the contactslist endpoint to directly add contact to list
      // This creates the contact if it doesn't exist and subscribes them
      const subscriptionData: any = {
        Email: email,
        Name: name || email.split('@')[0],
        Action: 'addforce', // Force subscription even if previously unsubscribed
      }

      // Add contact directly to the list (creates contact if needed)
      const response: any = await mailjet
        .post(`contactslist/${targetListId}/managecontact`, { version: 'v3' })
        .request(subscriptionData)

      // Get contact ID from response or by email lookup
      let contactId: number | undefined
      if (response.body?.Data?.[0]?.ID) {
        contactId = response.body.Data[0].ID
      } else {
        // Fallback: get contact by email
        const contact = await this.getContactByEmail(email)
        contactId = contact?.ID
      }

      return {
        success: true,
        message: 'Successfully subscribed to newsletter',
        contactId,
      }
    } catch (error: any) {
      console.error('Mailjet subscription error:', error)

      // Handle case where contact already exists in list
      if (error.statusCode === 400) {
        // Try to get existing contact
        const existingContact = await this.getContactByEmail(params.email)
        if (existingContact) {
          return {
            success: true,
            message: 'Email is already subscribed to newsletter',
            contactId: existingContact.ID,
          }
        }
      }

      throw new Error(error.message || 'Failed to subscribe to newsletter')
    }
  }

  /**
   * Subscribe a contact to a specific list
   */
  private async subscribeContactToList(contactId: number, listId: number): Promise<void> {
    if (!mailjet) return

    try {
      await mailjet
        .post(`contact/${contactId}/managecontactslists`, { version: 'v3' })
        .request({
          ContactsLists: [
            {
              Action: 'addforce', // Force subscription even if previously unsubscribed
              ListID: listId,
            },
          ],
        })
    } catch (error: any) {
      // If already subscribed, that's okay
      if (error.statusCode !== 400 || !error.message?.includes('already')) {
        throw error
      }
    }
  }

  /**
   * Get contact by email
   */
  private async getContactByEmail(email: string): Promise<{ ID: number; Email: string } | null> {
    if (!mailjet) return null

    try {
      const response: any = await mailjet
        .get('contact', { version: 'v3' })
        .request({ Email: email })

      const contacts = response.body?.Data
      return contacts && contacts.length > 0 ? contacts[0] : null
    } catch (error) {
      console.error('Error getting contact:', error)
      return null
    }
  }

  /**
   * Get all contact lists
   */
  async getContactLists(): Promise<Array<{ ID: number; Name: string }>> {
    if (!mailjet) return []

    try {
      const response: any = await mailjet
        .get('contactslist', { version: 'v3' })
        .request()

      return response.body?.Data || []
    } catch (error) {
      console.error('Error getting contact lists:', error)
      return []
    }
  }

  /**
   * Unsubscribe email from newsletter
   */
  async unsubscribeFromNewsletter(email: string, listId?: number): Promise<{
    success: boolean
    message: string
  }> {
    if (!mailjet) {
      throw new Error('Mailjet service not configured')
    }

    try {
      const contact = await this.getContactByEmail(email)
      if (!contact) {
        return {
          success: false,
          message: 'Contact not found',
        }
      }

      const lists = listId ? [{ ID: listId }] : await this.getContactLists()

      for (const list of lists) {
        try {
          await mailjet
            .post(`contact/${contact.ID}/managecontactslists`, { version: 'v3' })
            .request({
              ContactsLists: [
                {
                  Action: 'unsub',
                  ListID: list.ID,
                },
              ],
            })
        } catch (error) {
          // Continue with other lists even if one fails
          console.error(`Error unsubscribing from list ${list.ID}:`, error)
        }
      }

      return {
        success: true,
        message: 'Successfully unsubscribed from newsletter',
      }
    } catch (error: any) {
      console.error('Mailjet unsubscribe error:', error)
      throw new Error(error.message || 'Failed to unsubscribe from newsletter')
    }
  }

  /**
   * Send transactional email
   */
  async sendEmail(params: SendEmailParams): Promise<{
    success: boolean
    messageId?: string
    message: string
  }> {
    if (!mailjet) {
      throw new Error('Mailjet service not configured')
    }

    try {
      const {
        to,
        subject,
        htmlContent,
        textContent,
        fromEmail = process.env.MAILJET_FROM_EMAIL || 'noreply@wirsuchen.com',
        fromName = process.env.MAILJET_FROM_NAME || 'WIRsuchen',
      } = params

      const recipients = Array.isArray(to) ? to : [to]

      const emailData = {
        Messages: [
          {
            From: {
              Email: fromEmail,
              Name: fromName,
            },
            To: recipients.map((email) => ({
              Email: email,
            })),
            Subject: subject,
            TextPart: textContent || htmlContent?.replace(/<[^>]*>/g, '') || '',
            HTMLPart: htmlContent || textContent || '',
          },
        ],
      }

      const response: any = await mailjet
        .post('send', { version: 'v3.1' })
        .request(emailData)

      return {
        success: true,
        messageId: response.body?.Messages?.[0]?.To?.[0]?.MessageID,
        message: 'Email sent successfully',
      }
    } catch (error: any) {
      console.error('Mailjet send email error:', error)
      throw new Error(error.message || 'Failed to send email')
    }
  }

  /**
   * Check if email service is configured
   */
  isConfigured(): boolean {
    return !!mailjet && !!apiKey && !!apiSecret
  }
}

// Export singleton instance
export const mailjetService = new MailjetService()

