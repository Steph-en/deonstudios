import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    'https://oorbvpnuivsyfxftlqwr.supabase.co';
  const supabaseKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    'sb_publishable_qbhaFoU1TzHZzWqUKeOCig_rylAdzFV';

  if (req.method === 'PATCH') {
    const body = await getParsedBody(req);
    const { status } = body || {};

    let updatedTarget: any = null;

    // 1. Update in Supabase site_settings
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'client_inquiries')
          .maybeSingle();

        const list: any[] = Array.isArray((data as any)?.value)
          ? [...(data as any).value]
          : [];
        const item = list.find((i: any) => i.id === id);
        if (item) {
          item.status = status || 'read';
          updatedTarget = item;
          await supabase.from('site_settings').upsert(
            {
              key: 'client_inquiries',
              value: list,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          );
        }
      } catch (sbErr) {
        console.warn('[Inquiry Patch Supabase]:', sbErr);
      }
    }

    // 2. Also update local db.json if available
    try {
      if (fs.existsSync(dbPath)) {
        const raw = fs.readFileSync(dbPath, 'utf-8');
        const db = JSON.parse(raw);
        if (Array.isArray(db.inquiries)) {
          const target = db.inquiries.find((inq: any) => inq.id === id);
          if (target) {
            target.status = status || 'read';
            if (!updatedTarget) updatedTarget = target;
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
          }
        }
      }
    } catch (err) {
      console.warn('[Inquiry Patch Error]:', err);
    }

    return res.status(200).json(updatedTarget || { id, status });
  }

  if (req.method === 'DELETE') {
    // 1. Delete from Supabase site_settings
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'client_inquiries')
          .maybeSingle();

        const list: any[] = Array.isArray((data as any)?.value)
          ? [...(data as any).value]
          : [];
        const filtered = list.filter((i: any) => i.id !== id);
        await supabase.from('site_settings').upsert(
          {
            key: 'client_inquiries',
            value: filtered,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );
      } catch (sbErr) {
        console.warn('[Inquiry Delete Supabase]:', sbErr);
      }
    }

    // 2. Also delete from local db.json
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
