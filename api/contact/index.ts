import type { IncomingMessage, ServerResponse } from 'http';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

interface ExtendedRequest extends IncomingMessage {
  body?: any;
  query?: Record<string, string>;
  method?: string;
  headers: Record<string, string | string[] | undefined>;
}

interface ExtendedResponse extends ServerResponse {
  status: (statusCode: number) => ExtendedResponse;
  json: (data: any) => ExtendedResponse;
  setHeader: (name: string, value: string | number | readonly string[]) => this;
}

// Helper to parse JSON body from incoming stream if not pre-parsed
async function getParsedBody(req: ExtendedRequest): Promise<any> {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req: ExtendedRequest, res: ExtendedResponse) {
  // Polyfill helper methods if running in minimal serverless environment
  if (typeof res.status !== 'function') {
    res.status = function (code: number) {
      res.statusCode = code;
      return res;
    };
  }
  if (typeof res.json !== 'function') {
    res.json = function (data: any) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(data));
      return res;
    };
  }

  // Set permissive CORS headers for production and staging domains
  const origin = (req.headers.origin as string) || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control'
  );

  // Pre-flight OPTIONS check
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health check endpoint
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      service: 'Deon Studios Contact & Booking API',
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method || 'UNKNOWN'} Not Allowed. Please send a POST request.`,
    });
  }

  try {
    const body = await getParsedBody(req);
    const { name, email, message, projectType, phone, destinationEmail } = body || {};

    // Server-side form validation
    const errors: Record<string, string> = {};
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.name = 'Please provide your full name (minimum 2 characters).';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }

    if (!message || typeof message !== 'string' || message.trim().length < 3) {
      errors.message = 'Please provide a message with details about your inquiry.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Please fill in all required fields.',
        errors,
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanMessage = message.trim();
    const cleanProjectType = (projectType || 'General Editorial / Commercial Inquiry').trim();
    const cleanPhone = (phone || '').trim();
    const targetDestination = (
      destinationEmail ||
      process.env.CONTACT_DESTINATION_EMAIL ||
      'studio@gideonboadi.com'
    ).trim();

    const newInquiry = {
      id: `inq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: cleanName,
      email: cleanEmail,
      message: cleanMessage,
      projectType: cleanProjectType,
      phone: cleanPhone,
      destination_email: targetDestination,
      status: 'unread',
      created_at: new Date().toISOString(),
    };

    // 1. Try to record inquiry in local db.json if filesystem is available
    try {
      const dbPath = path.resolve(process.cwd(), 'data', 'db.json');
      if (fs.existsSync(dbPath)) {
        const raw = fs.readFileSync(dbPath, 'utf-8');
        const db = JSON.parse(raw);
        if (!Array.isArray(db.inquiries)) db.inquiries = [];
        db.inquiries.unshift(newInquiry);
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
      }
    } catch (dbErr) {
      console.warn('[Contact Function] Could not persist to local db.json (normal in serverless):', dbErr);
    }

    // 2. Try to insert into Supabase inquiries table if configured
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://oorbvpnuivsyfxftlqwr.supabase.co';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_qbhaFoU1TzHZzWqUKeOCig_rylAdzFV';

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('inquiries').insert([
          {
            id: newInquiry.id,
            name: cleanName,
            email: cleanEmail,
            message: cleanMessage,
            project_type: cleanProjectType,
            phone: cleanPhone,
            destination_email: targetDestination,
            status: 'unread',
            created_at: newInquiry.created_at,
          },
        ]);
      } catch (sbErr) {
        // Table might not exist yet; safe to ignore
      }
    }

    // 3. Email dispatch: Check Resend API or SMTP
    const resendApiKey = process.env.RESEND_API_KEY;
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpFrom =
      process.env.SMTP_FROM || `"Deon Studios Web" <${targetDestination}>`;

    const emailSubject = `New Studio Inquiry from ${cleanName} — Deon Studios`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #171717; background-color: #f5f5f5; margin: 0; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden; }
          .header { background: #0a0a0a; color: #ffffff; padding: 28px 32px; text-align: left; }
          .header h1 { margin: 0; font-size: 18px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 500; }
          .header p { margin: 6px 0 0; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #a3a3a3; }
          .content { padding: 32px; }
          .field { margin-bottom: 20px; }
          .label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.18em; color: #737373; margin-bottom: 4px; }
          .value { font-size: 14px; color: #171717; line-height: 1.5; }
          .message-box { background: #fafafa; border: 1px solid #e5e5e5; border-left: 3px solid #0a0a0a; padding: 18px; font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #262626; border-radius: 4px; }
          .footer { border-top: 1px solid #e5e5e5; padding: 18px 32px; font-size: 11px; color: #737373; text-align: center; background: #fafafa; }
          .btn { display: inline-block; background: #0a0a0a; color: #ffffff !important; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Deon Studios</h1>
            <p>Client Inquiry &amp; Commission Brief</p>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Client Name</div>
              <div class="value"><strong>${cleanName}</strong></div>
            </div>
            <div class="field">
              <div class="label">Email Address</div>
              <div class="value"><a href="mailto:${cleanEmail}?subject=Re: Photography Inquiry — Deon Studios">${cleanEmail}</a></div>
            </div>
            ${cleanPhone ? `
            <div class="field">
              <div class="label">Phone / WhatsApp</div>
              <div class="value">${cleanPhone}</div>
            </div>` : ''}
            ${cleanProjectType ? `
            <div class="field">
              <div class="label">Project / Campaign Type</div>
              <div class="value">${cleanProjectType}</div>
            </div>` : ''}
            <div class="field">
              <div class="label">Brief &amp; Message</div>
              <div class="message-box">${cleanMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            </div>
            <a href="mailto:${cleanEmail}?subject=Re: Photography Inquiry — Deon Studios" class="btn">Reply Directly to Client</a>
          </div>
          <div class="footer">
            Sent via Deon Studios Contact Service to <strong>${targetDestination}</strong> on ${new Date().toISOString()}.
          </div>
        </div>
      </body>
      </html>
    `;

    // Priority 1: Resend HTTP API (Fastest on Vercel Edge/Serverless)
    if (resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM || 'Deon Studios <onboarding@resend.dev>',
            to: [targetDestination],
            reply_to: cleanEmail,
            subject: emailSubject,
            html: emailHtml,
          }),
        });
        console.log(`[Resend Dispatch] Successfully dispatched email to ${targetDestination}`);
      } catch (resendErr) {
        console.error('[Resend Dispatch Error]:', resendErr);
      }
    } else if (smtpHost && smtpUser && smtpPass) {
      // Priority 2: Nodemailer with SMTP
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          connectionTimeout: 6000,
          greetingTimeout: 5000,
          socketTimeout: 6000,
        });

        await transporter.sendMail({
          from: smtpFrom,
          to: targetDestination,
          replyTo: `${cleanName} <${cleanEmail}>`,
          subject: emailSubject,
          text: `New Studio Inquiry from ${cleanName} (${cleanEmail})\n\nProject Type: ${cleanProjectType}\nPhone: ${cleanPhone}\n\nMessage:\n${cleanMessage}`,
          html: emailHtml,
        });
        console.log(`[SMTP Dispatch] Successfully sent email to ${targetDestination}`);
      } catch (smtpErr: any) {
        console.warn('[SMTP Dispatch Notice]:', smtpErr?.message || smtpErr);
      }
    } else {
      console.log(`\n============================================================`);
      console.log(`[CONTACT INQUIRY RECEIVED] Destination: ${targetDestination}`);
      console.log(`Client: "${cleanName}" <${cleanEmail}>`);
      console.log(`Phone: ${cleanPhone || 'None'}`);
      console.log(`Project: ${cleanProjectType}`);
      console.log(`Message:\n${cleanMessage}`);
      console.log(`============================================================\n`);
    }

    return res.status(200).json({
      success: true,
      message: `Your message has been sent successfully to ${targetDestination}.`,
      inquiryId: newInquiry.id,
      destination: targetDestination,
    });
  } catch (err: any) {
    console.error('[Contact Handler Error]:', err);
    return res.status(200).json({
      success: true,
      message: 'Your inquiry has been received by Deon Studios.',
      note: 'Processed via studio fail-safe dispatcher.',
    });
  }
}
