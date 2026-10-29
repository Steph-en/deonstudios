import type { IncomingMessage, ServerResponse } from 'http';
import { requireStaff, route } from '../_lib/http.js';
import nodemailer from 'nodemailer';

async function handle(
  req: IncomingMessage,
  res: ServerResponse & { status?: (code: number) => any; json?: (data: any) => any }
) {
  const origin = (req.headers.origin as string) || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const targetDestination = (process.env.CONTACT_DESTINATION_EMAIL || 'studio@gideonboadi.com').trim();
  const smtpFrom = process.env.SMTP_FROM || `"Deon Studios" <${targetDestination}>`;

  const testSubject = `[TEST] Deon Studios Contact Email Verification — ${new Date().toLocaleTimeString()}`;
  const testHtml = `
    <div style="font-family: -apple-system, sans-serif; max-width: 500px; padding: 24px; background: #0a0a0a; color: #fff; border-radius: 8px;">
      <h2 style="margin: 0 0 12px; font-size: 16px; text-transform: uppercase; letter-spacing: 0.15em;">Deon Studios Email Test</h2>
      <p style="font-size: 13px; color: #a3a3a3; line-height: 1.5;">This diagnostic verification email confirms that your outgoing mail dispatch is operational and routing to <strong>${targetDestination}</strong>.</p>
      <p style="font-size: 11px; color: #737373; margin-top: 20px;">Timestamp: ${new Date().toISOString()}</p>
    </div>
  `;

  // 1. Try Resend if configured
  if (resendApiKey && resendApiKey.trim().length > 5) {
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'Deon Studios <onboarding@resend.dev>',
          to: [targetDestination],
          subject: testSubject,
          html: testHtml,
        }),
      });
      const resendData = await resendRes.json();
      res.statusCode = resendRes.ok ? 200 : 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(
        JSON.stringify(
          resendRes.ok
            ? {
                success: true,
                provider: 'resend',
                message: `Verification email successfully dispatched via Resend to ${targetDestination}.`,
                id: resendData?.id,
              }
            : {
                success: false,
                provider: 'resend',
                error: resendData?.message || 'Resend API returned an error',
                details: resendData,
              }
        )
      );
    } catch (err: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(
        JSON.stringify({
          success: false,
          provider: 'resend',
          error: err?.message || 'Failed connecting to Resend API',
        })
      );
    }
  }

  // 2. Try SMTP if configured
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const isSecure = smtpPort === 465 || process.env.SMTP_SECURE === 'true';
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: isSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 8000,
        greetingTimeout: 6000,
        socketTimeout: 8000,
      });

      await transporter.verify();
      await transporter.sendMail({
        from: smtpFrom,
        to: targetDestination,
        subject: testSubject,
        text: `Deon Studios Email Test: Outgoing mail dispatch is operational and routing to ${targetDestination}.`,
        html: testHtml,
      });

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(
        JSON.stringify({
          success: true,
          provider: 'smtp',
          message: `Verification email successfully sent via SMTP (${smtpHost}) to ${targetDestination}.`,
        })
      );
    } catch (err: any) {
      const isBadCredentials =
        err?.message?.includes('535') || err?.message?.includes('BadCredentials');
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(
        JSON.stringify({
          success: false,
          provider: 'smtp',
          error: err?.message || 'SMTP Authentication or Connection failed',
          hint: isBadCredentials
            ? 'Google rejected the login credentials (535 Bad Credentials). Regular passwords do not work with Gmail SMTP. You must generate a 16-character App Password at https://myaccount.google.com/apppasswords (with 2-Step Verification enabled on the Google account) and set it as SMTP_PASS. Alternatively, use Resend (RESEND_API_KEY) which is recommended for Vercel serverless.'
            : 'Check your SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in .env or hosting environment variables.',
        })
      );
    }
  }

  res.statusCode = 400;
  res.setHeader('Content-Type', 'application/json');
  return res.end(
    JSON.stringify({
      success: false,
      provider: 'none',
      error: 'No email dispatch provider configured in .env',
      hint: 'Add RESEND_API_KEY or SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) to enable automated email transmission.',
    })
  );
}

// Diagnostic endpoint: exposes mail configuration, so it is restricted to signed-in staff.
export default route(async (req, res) => {
  if (req.method !== 'OPTIONS') await requireStaff(req);
  await handle(req, res as any);
});
