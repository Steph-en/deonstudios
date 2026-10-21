import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control'
  );
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Try Supabase cloud storage (shared across Vercel & all environments)
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    'https://oorbvpnuivsyfxftlqwr.supabase.co';
  const supabaseKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    'sb_publishable_qbhaFoU1TzHZzWqUKeOCig_rylAdzFV';

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'client_inquiries')
        .maybeSingle();

      if (!error && data && Array.isArray((data as any).value)) {
        return res.status(200).json((data as any).value);
      }
    } catch (sbErr) {
      console.warn('[Inquiries API] Supabase fetch error:', sbErr);
    }
  }

  // 2. Fallback to local db.json
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
