import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';

interface ExtendedRequest extends IncomingMessage {
  query?: Record<string, string>;
  method?: string;
  headers: Record<string, string | string[] | undefined>;
}

interface ExtendedResponse extends ServerResponse {
  status: (statusCode: number) => ExtendedResponse;
  json: (data: any) => ExtendedResponse;
}

export default async function handler(req: ExtendedRequest, res: ExtendedResponse) {
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

  const origin = (req.headers.origin as string) || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const dbPath = path.resolve(process.cwd(), 'data', 'db.json');
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, 'utf-8');
      const db = JSON.parse(raw);
      return res.status(200).json(Array.isArray(db.inquiries) ? db.inquiries : []);
    }
  } catch (err) {
    console.warn('[Inquiries API] Error loading db.json:', err);
  }

  return res.status(200).json([]);
}
