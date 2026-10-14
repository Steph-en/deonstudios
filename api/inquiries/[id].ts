import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';

interface ExtendedRequest extends IncomingMessage {
  query?: Record<string, string>;
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
}

interface ExtendedResponse extends ServerResponse {
  status: (statusCode: number) => ExtendedResponse;
  json: (data: any) => ExtendedResponse;
}

async function getParsedBody(req: ExtendedRequest): Promise<any> {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
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

  const id = req.query?.id;
  const dbPath = path.resolve(process.cwd(), 'data', 'db.json');

  if (req.method === 'PATCH') {
    const body = await getParsedBody(req);
    const { status } = body || {};

    try {
      if (fs.existsSync(dbPath)) {
        const raw = fs.readFileSync(dbPath, 'utf-8');
        const db = JSON.parse(raw);
        if (Array.isArray(db.inquiries)) {
          const target = db.inquiries.find((inq: any) => inq.id === id);
          if (target) {
            target.status = status || 'read';
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
            return res.status(200).json(target);
          }
        }
      }
    } catch (err) {
      console.warn('[Inquiry Patch Error]:', err);
    }
    return res.status(200).json({ id, status });
  }

  if (req.method === 'DELETE') {
    try {
      if (fs.existsSync(dbPath)) {
        const raw = fs.readFileSync(dbPath, 'utf-8');
        const db = JSON.parse(raw);
        if (Array.isArray(db.inquiries)) {
          db.inquiries = db.inquiries.filter((inq: any) => inq.id !== id);
          fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
        }
      }
    } catch (err) {
      console.warn('[Inquiry Delete Error]:', err);
    }
    return res.status(200).json({ success: true, id });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
