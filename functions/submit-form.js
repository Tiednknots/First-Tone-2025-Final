// submit-form.js
// Netlify Serverless Function to handle form inputs on the client site, save them to Supabase,
// and trigger instant Email (Resend) & WhatsApp (Twilio) notifications for non-newsletter inquiries.

const fetch = require('node-fetch');

// Helper: Send HTML Email Notification via Resend API
async function sendEmailNotification(data) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'info@firsttone.co.uk';

  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured. Skipping email notification.");
    return;
  }

  const senderName = [data.name, data.surname].filter(Boolean).join(' ') || 'Website Visitor';
  const subject = `📩 New Inquiry from ${senderName}`;
  const htmlContent = `
    <div style="font-family: 'Open Sans', Arial, sans-serif; background-color: #050505; color: #ffffff; padding: 32px; border-radius: 16px; border: 1px solid #222;">
      <div style="margin-bottom: 24px; border-bottom: 1px solid #222; padding-bottom: 16px;">
        <span style="font-size: 11px; font-weight: 700; color: #fe5c00; text-transform: uppercase; letter-spacing: 2px;">First Tone Website Inquiry</span>
        <h2 style="color: #ffffff; margin: 8px 0 0 0; font-size: 22px;">New Contact Submission</h2>
      </div>

      <div style="margin-bottom: 20px; line-height: 1.8; font-size: 14px;">
        <p style="margin: 4px 0;"><strong style="color: #aaa;">Name:</strong> ${senderName}</p>
        <p style="margin: 4px 0;"><strong style="color: #aaa;">Email:</strong> <a href="mailto:${data.email}" style="color: #fe5c00; text-decoration: none;">${data.email}</a></p>
        ${data.company ? `<p style="margin: 4px 0;"><strong style="color: #aaa;">Company / Org:</strong> ${data.company}</p>` : ''}
        <p style="margin: 4px 0;"><strong style="color: #aaa;">Form Type:</strong> ${data.form_type}</p>
      </div>

      <div style="margin-top: 24px;">
        <h4 style="font-size: 12px; font-weight: 700; color: #fe5c00; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Message Details:</h4>
        <div style="background-color: #111111; border: 1px solid #333; padding: 20px; border-radius: 12px; font-size: 14px; line-height: 1.6; color: #e4e4e7; white-space: pre-wrap;">${data.message || 'No message content provided.'}</div>
      </div>

      <div style="margin-top: 32px; font-size: 11px; color: #666; border-top: 1px solid #222; padding-top: 16px;">
        First Tone Productions Automated Notification System
      </div>
    </div>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'First Tone <notifications@firsttone.co.uk>',
        to: [NOTIFY_EMAIL],
        subject: subject,
        html: htmlContent
      })
    });
    const result = await res.json();
    console.log("Email notification API response:", res.status, result);
  } catch (err) {
    console.error("Failed to send email notification:", err.message);
  }
}

// Helper: Send FREE WhatsApp Notification via CallMeBot, Meta Cloud API, or Twilio
async function sendWhatsAppNotification(data) {
  const senderName = [data.name, data.surname].filter(Boolean).join(' ') || 'Website Visitor';
  const messageText = `🔔 *FIRST TONE NEW INQUIRY*\n\n` +
    `*From:* ${senderName}\n` +
    `*Email:* ${data.email}\n` +
    (data.company ? `*Company:* ${data.company}\n` : '') +
    `*Type:* ${data.form_type}\n\n` +
    `*Message:* ${data.message || 'No message provided.'}`;

  const NOTIFY_WHATSAPP = process.env.NOTIFICATION_WHATSAPP_NUMBER; // e.g. +447123456789

  // Option 1: CallMeBot Free WhatsApp API (100% FREE & ZERO COST)
  const CALLMEBOT_KEY = process.env.CALLMEBOT_API_KEY;
  if (CALLMEBOT_KEY && NOTIFY_WHATSAPP) {
    try {
      const cleanPhone = NOTIFY_WHATSAPP.replace('whatsapp:', '').replace(/\s+/g, '');
      const callmebotUrl = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(messageText)}&apikey=${encodeURIComponent(CALLMEBOT_KEY)}`;
      const res = await fetch(callmebotUrl);
      console.log("CallMeBot Free WhatsApp response status:", res.status);
      return;
    } catch (err) {
      console.error("CallMeBot WhatsApp notification error:", err.message);
    }
  }

  // Option 2: Meta Official WhatsApp Cloud API (Free 1,000 Conversations/Month)
  const META_TOKEN = process.env.META_WHATSAPP_TOKEN;
  const META_PHONE_ID = process.env.META_PHONE_ID;
  if (META_TOKEN && META_PHONE_ID && NOTIFY_WHATSAPP) {
    try {
      const cleanPhone = NOTIFY_WHATSAPP.replace('whatsapp:', '').replace('+', '').replace(/\s+/g, '');
      const res = await fetch(`https://graph.facebook.com/v18.0/${META_PHONE_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${META_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: { body: messageText }
        })
      });
      const result = await res.json();
      console.log("Meta Official WhatsApp Cloud API response:", res.status, result);
      return;
    } catch (err) {
      console.error("Meta WhatsApp Cloud API error:", err.message);
    }
  }

  // Option 3: Twilio (Fallback)
  const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_FROM = process.env.TWILIO_WHATSAPP_NUMBER;
  if (TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM && NOTIFY_WHATSAPP) {
    try {
      const authHeader = 'Basic ' + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64');
      const params = new URLSearchParams();
      params.append('From', TWILIO_FROM.startsWith('whatsapp:') ? TWILIO_FROM : `whatsapp:${TWILIO_FROM}`);
      params.append('To', NOTIFY_WHATSAPP.startsWith('whatsapp:') ? NOTIFY_WHATSAPP : `whatsapp:${NOTIFY_WHATSAPP}`);
      params.append('Body', messageText);

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });
      const result = await res.json();
      console.log("Twilio WhatsApp response:", res.status, result.sid || result.message);
    } catch (err) {
      console.error("Twilio WhatsApp error:", err.message);
    }
  }
}

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    
    const payload = {
      name: data.name || '',
      surname: data.surname || '',
      email: data.email || '',
      company: data.company || '',
      message: data.message || '',
      form_type: data.form_type || 'contact'
    };

    if (!payload.email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email address is required.' })
      };
    }

    // 1. Save message to Supabase DB
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/messages`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Supabase insert failed: ${errText}`);
    }

    // 2. Trigger Email & WhatsApp notifications for contact inquiries (excl. mailing list subscriptions)
    if (payload.form_type !== 'newsletter') {
      await Promise.allSettled([
        sendEmailNotification(payload),
        sendWhatsAppNotification(payload)
      ]);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    console.error('Submit form error:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
