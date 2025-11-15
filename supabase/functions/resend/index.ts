import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

interface EmailRequest {
  to: string | string[];
  subject: string;
  htmlContent?: string;
  textContent?: string;
  fromEmail?: string;
  fromName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'RESEND_API_KEY not configured' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Method not allowed' 
      }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const body: EmailRequest = await req.json();
    const {
      to,
      subject,
      htmlContent,
      textContent,
      fromEmail = 'onboarding@resend.dev',
      fromName,
    } = body;

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: to, subject' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Convert to array if single email
    const recipients = Array.isArray(to) ? to : [to];

    // Prepare email payload
    const emailPayload: any = {
      from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
      to: recipients,
      subject: subject,
    };

    // Add HTML content if provided
    if (htmlContent) {
      emailPayload.html = htmlContent;
    }

    // Add text content if provided, or strip HTML from htmlContent
    if (textContent) {
      emailPayload.text = textContent;
    } else if (htmlContent) {
      emailPayload.text = htmlContent.replace(/<[^>]*>/g, '');
    }

    // Send email via Resend API
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data.message || 'Failed to send email',
          details: data 
        }),
        {
          status: res.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: data.id,
        message: 'Email sent successfully',
        data: data 
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    console.error('Resend Edge Function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

Deno.serve(handler);

