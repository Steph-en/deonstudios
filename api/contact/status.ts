import type { IncomingMessage, ServerResponse } from 'http';
import { requireStaff, route } from '../_lib/http.js';

async function handle(
  req: IncomingMessage,
  res: ServerResponse & { status?: (code: number) => any; json?: (data: any) => any }
) {
  const origin = (req.headers.origin as string) || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control'
  );

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const target = process.env.CONTACT_DESTINATION_EMAIL || 'studio@gideonboadi.com';

  const hasResend = Boolean(resendApiKey && resendApiKey.trim().length > 5);
  const hasSmtp = Boolean(smtpHost && smtpUser && smtpPass);

  const responseData = {
    status: 'ok',
    service: 'Deon Studios Contact & Booking API',
    destination: target,
    deliveryProvider: hasResend ? 'resend' : hasSmtp ? 'smtp' : 'database_only',
    resendConfigured: hasResend,
    smtpConfigured: hasSmtp,
    smtpHost: smtpHost ? smtpHost : 'Not set',
    smtpUser: smtpUser ? smtpUser : 'Not set',
    timestamp: new Date().toISOString(),
  };

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(responseData));
}

// Diagnostic endpoint: exposes mail configuration, so it is restricted to signed-in staff.
export default route(async (req, res) => {
  if (req.method !== 'OPTIONS') await requireStaff(req);
  await handle(req, res as any);
});
