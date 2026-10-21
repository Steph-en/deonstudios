import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import {
  optimizeImageBuffer, calculateChecksum, isImage, isVideo, getMimeType,
} from '../src/services/assetOptimizationEngine';

const args = process.argv.slice(2);
const has = (flag: string) => args.includes(flag);
function arg(flag: string, fallback?: string): string | undefined {
  const i = args.indexOf(flag);
  if (i < 0) return fallback;
  const value = args[i + 1];
  if (!value || value.startsWith('--')) throw new Error(`Expected a value after ${flag}`);
  return value;
}
const isApply = has('--apply');
const dryRun = !isApply || has('--dry-run');
const bucket = arg('--bucket', process.env.SUPABASE_STORAGE_BUCKET || 'portfolio-media')!;
const maxFiles = Number(arg('--max-files', '0'));
const minSize = Number(arg('--min-size', '300000'));
const maxWidth = Number(arg('--max-width', '2560'));
const maxHeight = Number(arg('--max-height', '2560'));
const quality = Number(arg('--quality', '82'));
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const expectedRef = arg('--confirm-project-ref');

if (has('--clean-orphans')) throw new Error('Orphan deletion is disabled.');
if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the shell.');
const parsedUrl = new URL(url);
if (parsedUrl.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(parsedUrl.hostname)) throw new Error('SUPABASE_URL must use HTTPS.');
const projectRef = parsedUrl.hostname.split('.')[0];
if (isApply) {
  if (!has('--backup')) throw new Error('Apply mode requires --backup.');
  if (!expectedRef || expectedRef !== projectRef) throw new Error(`Apply blocked. Confirm the project with --confirm-project-ref ${projectRef}`);
}
for (const [name, value] of Object.entries({ maxFiles, minSize, maxWidth, maxHeight, quality })) {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be a non-negative number.`);
}
if (maxWidth < 1 || maxHeight < 1 || quality < 1 || quality > 100) throw new Error('Dimensions must be positive and quality must be 1–100.');

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
interface ObjectInfo { path: string; name: string; size: number; mimeType: string }
interface Result { path: string; status: string; originalSize: number; optimizedSize: number; savedBytes: number; error?: string; checksumBefore?: string; checksumAfter?: string; restoreVerified?: boolean }

async function listFiles(folder = ''): Promise<ObjectInfo[]> {
  const out: ObjectInfo[] = [];
  const pageSize = 1000;
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(folder, { limit: pageSize, offset, sortBy: { column: 'name', order: 'asc' } });
    if (error || !data) throw new Error(`List failed for ${folder || '/'}: ${error?.message || 'no data'}`);
    for (const item of data) {
      const objectPath = folder ? `${folder}/${item.name}` : item.name;
      if (item.id === null && !item.metadata) out.push(...await listFiles(objectPath));
      else out.push({ path: objectPath, name: item.name, size: Number(item.metadata?.size ?? 0), mimeType: item.metadata?.mimetype || getMimeType(item.name) });
    }
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return out;
}
async function download(filePath: string): Promise<Buffer> {
  const { data, error } = await supabase.storage.from(bucket).download(filePath);
  if (error || !data) throw new Error(`Download failed for ${filePath}: ${error?.message || 'no data'}`);
  return Buffer.from(await data.arrayBuffer());
}
async function upload(filePath: string, bytes: Buffer, contentType: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).upload(filePath, bytes, { upsert: true, contentType, cacheControl: '0' });
  if (error) throw new Error(`Upload failed for ${filePath}: ${error.message}`);
}
/** Direct REST GET with a unique query parameter to reduce the chance of verifying a cached prior version. */
async function downloadForVerification(filePath: string): Promise<Buffer> {
  const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
  const verifyUrl = `${url!.replace(/\/$/, '')}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}?verify=${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const response = await fetch(verifyUrl, {
    headers: { apikey: key!, Authorization: `Bearer ${key}`, 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Verification download returned HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  const all = await listFiles();
  const totalBytes = all.reduce((sum, file) => sum + file.size, 0);
  const eligible = all.filter((f) => (isImage(f.path) || isImage(f.mimeType)) && f.size >= minSize && !f.name.endsWith('.emptyFolderPlaceholder')).sort((a, b) => b.size - a.size);
  const selected = maxFiles > 0 ? eligible.slice(0, maxFiles) : eligible;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve('backups', 'supabase-storage', `backup-${stamp}`);
  const tempDir = path.resolve('.tmp_optimizer', `run-${stamp}`);
  fs.mkdirSync(tempDir, { recursive: true });
  if (isApply) fs.mkdirSync(backupDir, { recursive: true });
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'APPLY'} | Project: ${projectRef} | Bucket: ${bucket}`);
  console.log(`Objects: ${all.length} | Eligible: ${eligible.length} | Selected: ${selected.length} | Listed size: ${(totalBytes / 1048576).toFixed(2)} MiB`);
  if (isApply) console.log(`Local originals backup: ${backupDir}`);

  const results: Result[] = [];
  let totalSaved = 0;
  try {
    for (let i = 0; i < selected.length; i++) {
      const file = selected[i];
      console.log(`[${i + 1}/${selected.length}] ${file.path}`);
      let original: Buffer;
      try { original = await download(file.path); }
      catch (e) { results.push({ path: file.path, status: 'download_failed', originalSize: file.size, optimizedSize: file.size, savedBytes: 0, error: String(e) }); continue; }

      const beforeHash = calculateChecksum(original);
      if (isApply) {
        const localBackup = path.join(backupDir, file.path);
        fs.mkdirSync(path.dirname(localBackup), { recursive: true });
        fs.writeFileSync(localBackup, original, { flag: 'wx' });
        const check = fs.readFileSync(localBackup);
        if (check.length !== original.length || calculateChecksum(check) !== beforeHash) throw new Error(`Backup verification failed; stopping before modifying ${file.path}`);
      }

      let optimized = original;
      let outputMime = file.mimeType || getMimeType(file.path);
      try {
        if (isImage(file.path) || isImage(file.mimeType)) {
          const result = await optimizeImageBuffer(original, { maxWidth, maxHeight, quality, format: 'preserve', minFileSizeToProcess: minSize }, outputMime);
          optimized = result.optimizedBuffer;
          outputMime = result.mimeType || outputMime;
        } else if (isVideo(file.path) || isVideo(file.mimeType)) {
          // Video output is MP4; do not overwrite a differently suffixed source in place.
          // This safe script skips video conversion until an explicit extension/URL migration is designed.
          results.push({ path: file.path, status: 'skipped_video_requires_migration', originalSize: original.length, optimizedSize: original.length, savedBytes: 0, checksumBefore: beforeHash, checksumAfter: beforeHash });
          continue;
        }
      } catch (e) {
        results.push({ path: file.path, status: 'optimization_failed', originalSize: original.length, optimizedSize: original.length, savedBytes: 0, error: String(e), checksumBefore: beforeHash });
        continue;
      }

      if (optimized.length >= original.length) {
        results.push({ path: file.path, status: 'skipped_no_savings', originalSize: original.length, optimizedSize: original.length, savedBytes: 0, checksumBefore: beforeHash, checksumAfter: beforeHash });
        continue;
      }
      const afterHash = calculateChecksum(optimized);
      if (dryRun) {
        totalSaved += original.length - optimized.length;
        results.push({ path: file.path, status: 'dry_run_candidate', originalSize: original.length, optimizedSize: optimized.length, savedBytes: original.length - optimized.length, checksumBefore: beforeHash, checksumAfter: afterHash });
        console.log(`  Would save ${((original.length - optimized.length) / 1048576).toFixed(2)} MiB`);
        continue;
      }

      try {
        await upload(file.path, optimized, outputMime);
        const remote = await downloadForVerification(file.path);
        if (remote.length !== optimized.length || calculateChecksum(remote) !== afterHash) {
          throw new Error('Post-upload verification mismatch after cache-busting direct REST read.');
        }
        totalSaved += original.length - optimized.length;
        results.push({ path: file.path, status: 'applied_verified', originalSize: original.length, optimizedSize: optimized.length, savedBytes: original.length - optimized.length, checksumBefore: beforeHash, checksumAfter: afterHash, restoreVerified: undefined });
        console.log('  Applied and verified.');
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error(`  Apply/verify failed: ${errorMessage}`);
        let restoreVerified = false;
        try {
          const localBackup = fs.readFileSync(path.join(backupDir, file.path));
          await upload(file.path, localBackup, file.mimeType || getMimeType(file.path));
          const restored = await downloadForVerification(file.path);
          restoreVerified = restored.length === localBackup.length && calculateChecksum(restored) === beforeHash;
          if (!restoreVerified) throw new Error('Restoration bytes did not match the original backup.');
          console.error('  Original restored and verified.');
        } catch (restoreError) {
          console.error(`  CRITICAL: restoration NOT verified. Preserve backup at ${path.join(backupDir, file.path)}. ${String(restoreError)}`);
        }
        results.push({ path: file.path, status: restoreVerified ? 'failed_restored_verified' : 'CRITICAL_restore_unverified', originalSize: original.length, optimizedSize: optimized.length, savedBytes: 0, error: errorMessage, checksumBefore: beforeHash, checksumAfter: afterHash, restoreVerified });
      }
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  const reportPath = path.resolve(`storage-optimization-report-${stamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(), mode: dryRun ? 'dry-run' : 'applied', projectRef, bucket,
    totalObjectsListed: all.length, eligibleObjects: eligible.length, selectedObjects: selected.length,
    bucketBytesBefore: totalBytes, estimatedBytesSaved: totalSaved,
    bucketBytesProjectedAfter: Math.max(0, totalBytes - totalSaved), backupDir: isApply ? backupDir : null,
    counts: Object.fromEntries([...new Set(results.map((r) => r.status))].map((s) => [s, results.filter((r) => r.status === s).length])),
    note: 'Bucket-level estimate only. Video rewriting is deliberately skipped. Do not infer project quota/billing changes from this report.', results,
  }, null, 2));
  console.log(`\nEstimated saved: ${(totalSaved / 1048576).toFixed(2)} MiB`);
  console.log(`Report: ${reportPath}`);
  if (dryRun) console.log('Dry run only: no remote objects were changed.');
}

main().catch((error) => { console.error('\nFATAL — run stopped:', error instanceof Error ? error.message : error); process.exitCode = 1; });
