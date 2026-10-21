import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { calculateChecksum } from '../src/services/assetOptimizationEngine';

const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'portfolio-media';
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const backupDirArg = process.argv.find((arg) => arg.startsWith('--backup-dir='))?.slice('--backup-dir='.length);

if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the shell.');
if (!backupDirArg) throw new Error('Usage: npx tsx scripts/audit-supabase-storage.ts --backup-dir="/absolute/path/to/backup"');
const backupDir = path.resolve(backupDirArg);
if (!fs.existsSync(backupDir)) throw new Error(`Backup directory not found: ${backupDir}`);

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function listFiles(folder = ''): Promise<string[]> {
  const output: string[] = [];
  const pageSize = 1000;
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(folder, {
      limit: pageSize, offset, sortBy: { column: 'name', order: 'asc' },
    });
    if (error || !data) throw new Error(`List failed for ${folder || '/'}: ${error?.message || 'no data'}`);
    for (const item of data) {
      const full = folder ? `${folder}/${item.name}` : item.name;
      if (item.id === null && !item.metadata) output.push(...await listFiles(full));
      else output.push(full);
    }
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return output;
}

async function download(filePath: string): Promise<Buffer> {
  const { data, error } = await supabase.storage.from(bucket).download(filePath);
  if (error || !data) throw new Error(error?.message || 'Download returned no data');
  return Buffer.from(await data.arrayBuffer());
}

async function main() {
  const files = await listFiles();
  const results: Array<{ path: string; status: string; remoteBytes?: number; backupBytes?: number; remoteSha256?: string; backupSha256?: string; error?: string }> = [];
  for (const filePath of files) {
    const localPath = path.join(backupDir, filePath);
    if (!fs.existsSync(localPath)) {
      results.push({ path: filePath, status: 'no_backup_for_object' });
      continue;
    }
    try {
      const [remote, backup] = await Promise.all([download(filePath), Promise.resolve(fs.readFileSync(localPath))]);
      const remoteSha256 = calculateChecksum(remote);
      const backupSha256 = calculateChecksum(backup);
      const matches = remote.length === backup.length && remoteSha256 === backupSha256;
      results.push({
        path: filePath,
        status: matches ? 'matches_backup' : 'differs_from_backup',
        remoteBytes: remote.length,
        backupBytes: backup.length,
        remoteSha256,
        backupSha256,
      });
      console.log(`${matches ? 'MATCH' : 'DIFF '} ${filePath}`);
    } catch (error) {
      results.push({ path: filePath, status: 'could_not_verify', error: error instanceof Error ? error.message : String(error) });
      console.error(`ERROR ${filePath}: ${error instanceof Error ? error.message : error}`);
    }
  }
  const reportPath = path.resolve(`storage-backup-audit-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(), bucket, backupDir, totalRemoteObjects: files.length,
    counts: {
      matches_backup: results.filter((r) => r.status === 'matches_backup').length,
      differs_from_backup: results.filter((r) => r.status === 'differs_from_backup').length,
      no_backup_for_object: results.filter((r) => r.status === 'no_backup_for_object').length,
      could_not_verify: results.filter((r) => r.status === 'could_not_verify').length,
    }, results,
    note: 'Read-only audit: this script does not upload, overwrite, or delete objects.',
  }, null, 2));
  console.log(`\nRead-only audit report: ${reportPath}`);
}

main().catch((error) => { console.error('AUDIT FAILED:', error instanceof Error ? error.message : error); process.exitCode = 1; });
