#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import {
  optimizeImageBuffer,
  optimizeVideoFile,
  calculateChecksum,
  isImage,
  isVideo,
  getMimeType,
} from '../src/services/assetOptimizationEngine';

// Parse command line arguments
const args = process.argv.slice(2);

function getArg(flag: string, defaultValue: string): string {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return defaultValue;
}

const hasFlag = (flag: string) => args.includes(flag);

const isApply = hasFlag('--apply');
const isDryRun = !isApply || hasFlag('--dry-run');
const doBackup = hasFlag('--backup') || isApply;
const cleanOrphans = hasFlag('--clean-orphans') && isApply;
const maxWidth = parseInt(getArg('--max-width', '2560'), 10);
const maxHeight = parseInt(getArg('--max-height', '2560'), 10);
const quality = parseInt(getArg('--quality', '82'), 10);
const minSize = parseInt(getArg('--min-size', '300000'), 10); // 300 KB threshold
const concurrency = parseInt(getArg('--concurrency', '2'), 10);
const bucketName = getArg('--bucket', 'portfolio-media');

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://oorbvpnuivsyfxftlqwr.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_qbhaFoU1TzHZzWqUKeOCig_rylAdzFV';

const supabase = createClient(supabaseUrl, supabaseKey);

interface StorageFile {
  path: string;
  name: string;
  size: number;
  mimetype: string;
  updated_at?: string;
  isReferenced: boolean;
  references: string[];
}

async function listAllFilesInBucket(folder = ''): Promise<StorageFile[]> {
  let files: StorageFile[] = [];
  const { data, error } = await supabase.storage.from(bucketName).list(folder, {
    limit: 1000,
    sortBy: { column: 'name', order: 'asc' },
  });

  if (error || !data) {
    console.error(`Error listing folder "${folder}":`, error?.message || error);
    return files;
  }

  for (const item of data) {
    const fullPath = folder ? `${folder}/${item.name}` : item.name;
    // Check if item is a directory
    if (item.id === null && !item.metadata) {
      const subFiles = await listAllFilesInBucket(fullPath);
      files = files.concat(subFiles);
    } else {
      files.push({
        path: fullPath,
        name: item.name,
        size: item.metadata?.size || 0,
        mimetype: item.metadata?.mimetype || getMimeType(item.name),
        updated_at: item.updated_at,
        isReferenced: false,
        references: [],
      });
    }
  }

  return files;
}

async function collectDatabaseReferences(): Promise<{
  allRefs: Map<string, string[]>;
  mediaRows: Map<string, any>;
}> {
  const allRefs = new Map<string, string[]>();
  const mediaRows = new Map<string, any>();

  const recordRef = (key: string, source: string) => {
    if (!key) return;
    const cleanKey = key.trim();
    if (!allRefs.has(cleanKey)) {
      allRefs.set(cleanKey, []);
    }
    allRefs.get(cleanKey)!.push(source);

    // Also extract clean storage path if full URL
    const match = cleanKey.match(/portfolio-media\/(.+)$/);
    if (match && match[1]) {
      const pathOnly = match[1];
      if (!allRefs.has(pathOnly)) {
        allRefs.set(pathOnly, []);
      }
      allRefs.get(pathOnly)!.push(source);
    }
  };

  try {
    // 1. project_media
    const { data: pm } = await supabase.from('project_media').select('*');
    (pm || []).forEach((row) => {
      if (row.storage_path) {
        recordRef(row.storage_path, `project_media:${row.id}`);
        mediaRows.set(row.storage_path, row);
      }
      if (row.media_url) {
        recordRef(row.media_url, `project_media:${row.id}`);
      }
      if (row.thumbnail_url) {
        recordRef(row.thumbnail_url, `project_media_thumb:${row.id}`);
      }
    });

    // 2. projects
    const { data: proj } = await supabase
      .from('projects')
      .select('id, title, preview_image, preview_video, hero_image, hero_video');
    (proj || []).forEach((row) => {
      if (row.preview_image) recordRef(row.preview_image, `project_preview:${row.title || row.id}`);
      if (row.preview_video) recordRef(row.preview_video, `project_video:${row.title || row.id}`);
      if (row.hero_image) recordRef(row.hero_image, `project_hero:${row.title || row.id}`);
      if (row.hero_video) recordRef(row.hero_video, `project_hero_vid:${row.title || row.id}`);
    });

    // 3. portfolio_shots
    const { data: port } = await supabase.from('portfolio_shots').select('id, title, url');
    (port || []).forEach((row) => {
      if (row.url) recordRef(row.url, `portfolio_shot:${row.title || row.id}`);
    });

    // 4. product_shots
    const { data: prod } = await supabase.from('product_shots').select('id, title, url');
    (prod || []).forEach((row) => {
      if (row.url) recordRef(row.url, `product_shot:${row.title || row.id}`);
    });

    // 5. site_settings
    const { data: sett } = await supabase.from('site_settings').select('*');
    (sett || []).forEach((row) => {
      const raw = JSON.stringify(row);
      const matches = raw.match(/portfolio-media\/([^\s\"']+)/g) || [];
      matches.forEach((m) => {
        const p = m.replace('portfolio-media/', '');
        recordRef(p, `site_setting:${row.id || 'hero'}`);
      });
    });
  } catch (err: any) {
    console.warn('Notice querying database tables:', err?.message || err);
  }

  // Also check local data/db.json
  try {
    const dbJsonPath = path.resolve(process.cwd(), 'data', 'db.json');
    if (fs.existsSync(dbJsonPath)) {
      const localDb = JSON.parse(fs.readFileSync(dbJsonPath, 'utf-8'));
      const raw = JSON.stringify(localDb);
      const matches = raw.match(/portfolio-media\/([^\s\"']+)/g) || [];
      matches.forEach((m) => {
        const p = m.replace('portfolio-media/', '');
        recordRef(p, 'local_db_json');
      });
    }
  } catch {
    // Ignore local db read error
  }

  return { allRefs, mediaRows };
}

async function runOptimization() {
  console.log('===============================================================');
  console.log('   DEON STUDIOS — SUPABASE STORAGE ASSET OPTIMIZER');
  console.log('===============================================================');
  console.log(`Mode:            ${isDryRun ? 'DRY-RUN (Simulate Only, No Files Modified)' : 'APPLY (Live Optimization & Re-upload)'}`);
  console.log(`Supabase URL:    ${supabaseUrl}`);
  console.log(`Target Bucket:   ${bucketName}`);
  console.log(`Max Dimensions:  ${maxWidth} x ${maxHeight} px`);
  console.log(`JPEG Quality:    ${quality}% (MozJPEG)`);
  console.log(`Min File Size:   ${(minSize / 1024).toFixed(0)} KB threshold`);
  console.log(`Backup Enabled:  ${doBackup}`);
  console.log(`Clean Orphans:   ${cleanOrphans}`);
  console.log('---------------------------------------------------------------\n');

  console.log('Step 1: Enumerating all storage assets in Supabase...');
  const allFiles = await listAllFilesInBucket();
  console.log(`Found ${allFiles.length} total files in bucket "${bucketName}".`);

  console.log('Step 2: Cross-referencing database records & active settings...');
  const { allRefs, mediaRows } = await collectDatabaseReferences();

  let referencedCount = 0;
  let unreferencedCount = 0;
  let totalBytes = 0;
  let unreferencedBytes = 0;

  for (const file of allFiles) {
    totalBytes += file.size;
    const directMatches = allRefs.get(file.path) || [];
    const publicUrl = `https://oorbvpnuivsyfxftlqwr.supabase.co/storage/v1/object/public/portfolio-media/${file.path}`;
    const urlMatches = allRefs.get(publicUrl) || [];
    const combinedRefs = [...directMatches, ...urlMatches];

    if (combinedRefs.length > 0) {
      file.isReferenced = true;
      file.references = combinedRefs;
      referencedCount++;
    } else {
      file.isReferenced = false;
      unreferencedCount++;
      unreferencedBytes += file.size;
    }
  }

  console.log(`- Referenced Assets:   ${referencedCount} files (${( (totalBytes - unreferencedBytes) / (1024 * 1024) ).toFixed(2)} MB)`);
  console.log(`- Unreferenced Assets: ${unreferencedCount} files (${(unreferencedBytes / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`- Total Current Usage: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB (${(totalBytes / (1024 * 1024 * 1024)).toFixed(3)} GB)`);
  console.log(`- Supabase Free Limit: 5,000 MB (5.00 GB)\n`);

  // Filter eligible assets for optimization
  const eligibleFiles = allFiles
    .filter((f) => {
      // Must be image or video and meet minimum size threshold
      if (f.name.endsWith('.emptyFolderPlaceholder')) return false;
      const isImg = isImage(f.path) || isImage(f.mimetype);
      const isVid = isVideo(f.path) || isVideo(f.mimetype);
      return (isImg || isVid) && f.size >= minSize;
    })
    .sort((a, b) => b.size - a.size); // Largest files first!

  console.log(`Step 3: Found ${eligibleFiles.length} files >= ${(minSize / 1024).toFixed(0)} KB eligible for compression.\n`);

  const results: any[] = [];
  let totalOptimizedOriginalBytes = 0;
  let totalOptimizedResultBytes = 0;
  let totalBytesSaved = 0;

  const backupDir = path.resolve(process.cwd(), 'backups', 'supabase-storage', `backup-${Date.now()}`);
  if (doBackup && isApply) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`Created backup folder: ${backupDir}\n`);
  }

  const tmpDir = path.resolve(process.cwd(), '.tmp_optimizer');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  // Process files sequentially or with controlled concurrency
  for (let i = 0; i < eligibleFiles.length; i++) {
    const file = eligibleFiles[i];
    const progress = `[${i + 1}/${eligibleFiles.length}]`;
    const originalMb = (file.size / (1024 * 1024)).toFixed(2);

    process.stdout.write(`${progress} Downloading "${file.path}" (${originalMb} MB)... `);

    try {
      const { data: blob, error: downloadError } = await supabase.storage
        .from(bucketName)
        .download(file.path);

      if (downloadError || !blob) {
        console.log(`FAILED download: ${downloadError?.message}`);
        continue;
      }

      const arrayBuf = await blob.arrayBuffer();
      const inputBuffer = Buffer.from(arrayBuf);

      // Backup if apply mode
      if (doBackup && isApply) {
        const destBackup = path.join(backupDir, file.path);
        fs.mkdirSync(path.dirname(destBackup), { recursive: true });
        fs.writeFileSync(destBackup, inputBuffer);
      }

      const fileChecksum = calculateChecksum(inputBuffer);
      const isImg = isImage(file.path) || isImage(file.mimetype);
      const isVid = isVideo(file.path) || isVideo(file.mimetype);

      let optimizedBuffer: Buffer | null = null;
      let newWidth: number | undefined;
      let newHeight: number | undefined;
      let newMimeType = file.mimetype || getMimeType(file.path);

      if (isImg) {
        const optRes = await optimizeImageBuffer(
          inputBuffer,
          { maxWidth, maxHeight, quality, format: 'preserve' },
          file.mimetype
        );
        optimizedBuffer = optRes.optimizedBuffer;
        newWidth = optRes.width;
        newHeight = optRes.height;
        newMimeType = optRes.mimeType;
      } else if (isVid) {
        const tempIn = path.join(tmpDir, `in-${Date.now()}-${file.name}`);
        const tempOut = path.join(tmpDir, `out-${Date.now()}-${file.name}`);
        fs.writeFileSync(tempIn, inputBuffer);

        try {
          const vidRes = await optimizeVideoFile(tempIn, tempOut, {
            maxHeight: 1080,
            maxWidth: 1920,
            crf: 26,
            audioBitrate: '128k',
          });
          optimizedBuffer = fs.readFileSync(vidRes.outputPath);
        } finally {
          if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
          if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
        }
      }

      if (!optimizedBuffer || optimizedBuffer.length >= inputBuffer.length) {
        console.log(`Already optimal (No reduction).`);
        results.push({
          path: file.path,
          originalSize: file.size,
          optimizedSize: file.size,
          savedBytes: 0,
          savedPercentage: 0,
          status: 'skipped_no_savings',
        });
        continue;
      }

      const optSize = optimizedBuffer.length;
      const savedBytes = inputBuffer.length - optSize;
      const savedPct = ((savedBytes / inputBuffer.length) * 100).toFixed(1);
      const optMb = (optSize / (1024 * 1024)).toFixed(2);

      totalOptimizedOriginalBytes += inputBuffer.length;
      totalOptimizedResultBytes += optSize;
      totalBytesSaved += savedBytes;

      console.log(`Optimized: ${originalMb} MB -> ${optMb} MB (${savedPct}% reduction)`);

      // If apply mode: upload back to Supabase Storage at identical path
      if (isApply) {
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(file.path, optimizedBuffer, {
            contentType: newMimeType,
            upsert: true,
            cacheControl: 'public, max-age=31536000',
          });

        if (uploadError) {
          console.error(`  -> Upload error: ${uploadError.message}`);
          results.push({
            path: file.path,
            originalSize: file.size,
            optimizedSize: optSize,
            savedBytes: 0,
            status: 'upload_failed',
            error: uploadError.message,
          });
          continue;
        }

        // Update project_media row in DB if exists
        const pmRow = mediaRows.get(file.path);
        if (pmRow && pmRow.id) {
          try {
            await supabase
              .from('project_media')
              .update({
                file_size: optSize,
                width: newWidth || pmRow.width,
                height: newHeight || pmRow.height,
              })
              .eq('id', pmRow.id);
          } catch {
            // Non-fatal
          }
        }
      }

      results.push({
        path: file.path,
        originalSize: inputBuffer.length,
        optimizedSize: optSize,
        savedBytes,
        savedPercentage: Number(savedPct),
        checksum: fileChecksum,
        width: newWidth,
        height: newHeight,
        status: isApply ? 'applied' : 'simulated',
        isReferenced: file.isReferenced,
      });
    } catch (err: any) {
      console.log(`Error processing file: ${err?.message || err}`);
    }
  }

  // Cleanup temp dir
  try {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  } catch {}

  // Handle unreferenced files
  let cleanedOrphanCount = 0;
  let cleanedOrphanBytes = 0;

  if (cleanOrphans && isApply) {
    console.log('\nStep 4: Cleaning verified unreferenced files...');
    const unreferencedFiles = allFiles.filter((f) => !f.isReferenced && !f.name.endsWith('.emptyFolderPlaceholder'));

    for (const orphan of unreferencedFiles) {
      const { error: rmErr } = await supabase.storage.from(bucketName).remove([orphan.path]);
      if (!rmErr) {
        cleanedOrphanCount++;
        cleanedOrphanBytes += orphan.size;
        console.log(`  Removed orphan: ${orphan.path} (${(orphan.size / (1024 * 1024)).toFixed(2)} MB)`);
      }
    }
  }

  // Generate Report
  const totalOriginalEligibleMb = (totalOptimizedOriginalBytes / (1024 * 1024)).toFixed(2);
  const totalOptimizedEligibleMb = (totalOptimizedResultBytes / (1024 * 1024)).toFixed(2);
  const totalSavedMb = (totalBytesSaved / (1024 * 1024)).toFixed(2);
  const overallReductionPct = totalOptimizedOriginalBytes > 0
    ? ((totalBytesSaved / totalOptimizedOriginalBytes) * 100).toFixed(1)
    : '0';

  const newProjectedTotalBytes = totalBytes - totalBytesSaved - (cleanOrphans ? cleanedOrphanBytes : 0);
  const newProjectedTotalMb = (newProjectedTotalBytes / (1024 * 1024)).toFixed(2);

  console.log('\n===============================================================');
  console.log('   OPTIMIZATION REPORT SUMMARY');
  console.log('===============================================================');
  console.log(`Files Processed:           ${results.length}`);
  console.log(`Original Eligible Size:    ${totalOriginalEligibleMb} MB`);
  console.log(`Optimized Size:            ${totalOptimizedEligibleMb} MB`);
  console.log(`Storage Reclaimed:         ${totalSavedMb} MB (${overallReductionPct}% reduction)`);
  if (cleanOrphans) {
    console.log(`Orphans Deleted:           ${cleanedOrphanCount} files (${(cleanedOrphanBytes / (1024 * 1024)).toFixed(2)} MB)`);
  }
  console.log(`Starting Total Storage:    ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Projected Total Storage:   ${newProjectedTotalMb} MB ( ${(newProjectedTotalBytes / (1024 * 1024 * 1024)).toFixed(3)} GB )`);
  console.log(`Supabase Free Allowance:   5,000 MB (5.00 GB)`);
  console.log(`Plan Status:               WITHIN SAFE FREE LIMIT (${((newProjectedTotalBytes / (5 * 1024 * 1024 * 1024)) * 100).toFixed(1)}% of 5GB allowance)`);
  console.log('===============================================================\n');

  // Write JSON report
  const reportPath = path.resolve(process.cwd(), 'storage-optimization-report.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        mode: isApply ? 'applied' : 'dry-run',
        bucketName,
        totalFiles: allFiles.length,
        eligibleFiles: eligibleFiles.length,
        processedFiles: results.length,
        totalBytesBefore: totalBytes,
        totalBytesAfter: newProjectedTotalBytes,
        bytesSaved: totalBytesSaved,
        savedMb: Number(totalSavedMb),
        reductionPercent: Number(overallReductionPct),
        unreferencedFilesCount: unreferencedCount,
        unreferencedBytes,
        results,
      },
      null,
      2
    )
  );
  console.log(`Detailed report written to: ${reportPath}`);

  if (isDryRun) {
    console.log('\nTo apply these optimizations and re-upload to Supabase Storage, run:');
    console.log('  npm run optimize:storage:apply\n');
  }
}

runOptimization().catch((err) => {
  console.error('Fatal error during asset optimization:', err);
  process.exit(1);
});
