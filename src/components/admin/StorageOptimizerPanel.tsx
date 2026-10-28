import React from 'react';
import { HardDrive, RefreshCw, Layers, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { formatFileSize } from '../../lib/utils';

const BUCKET = 'portfolio-media';
// Supabase Pro includes 100 GB of file storage. Change if your plan differs.
const STORAGE_QUOTA_BYTES = 100 * 1024 ** 3;
// Files above this are worth re-compressing with `npm run optimize:storage:apply`.
const LARGE_FILE_BYTES = 1024 * 1024;

interface StoredFile {
  path: string;
  size: number;
  mimetype: string;
}

/** Recursively list the bucket (metadata only - does not download any file). */
async function listBucket(folder = ''): Promise<StoredFile[]> {
  const files: StoredFile[] = [];
  const pageSize = 1000;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(folder, { limit: pageSize, offset });
    if (error) throw new Error(error.message);
    if (!data?.length) break;

    for (const item of data) {
      const path = folder ? `${folder}/${item.name}` : item.name;
      if (item.id === null) {
        files.push(...(await listBucket(path)));
      } else {
        files.push({
          path,
          size: Number(item.metadata?.size ?? 0),
          mimetype: item.metadata?.mimetype ?? '',
        });
      }
    }
    if (data.length < pageSize) break;
  }
  return files;
}

async function fetchStorageStats() {
  const files = await listBucket();
  const folders: Record<string, { count: number; bytes: number }> = {};
  let totalBytes = 0;

  for (const f of files) {
    const top = f.path.split('/')[0];
    const entry = (folders[top] ??= { count: 0, bytes: 0 });
    entry.count++;
    entry.bytes += f.size;
    totalBytes += f.size;
  }

  const largest = [...files].sort((a, b) => b.size - a.size).slice(0, 10);
  return {
    totalFiles: files.length,
    totalBytes,
    folders,
    largest,
    largeCount: files.filter((f) => f.size > LARGE_FILE_BYTES).length,
  };
}

export const StorageOptimizerPanel: React.FC = () => {
  const { data: stats, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['storage-stats'],
    queryFn: fetchStorageStats,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const usagePct = stats ? Math.min(100, (stats.totalBytes / STORAGE_QUOTA_BYTES) * 100) : 0;

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-neutral-950 text-white flex items-center justify-center shrink-0 mt-0.5">
            <HardDrive className="w-5 h-5 text-neutral-200" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-900 tracking-tight">Storage Usage</h2>
            <p className="text-xs text-neutral-500 mt-1">
              Live size of the <span className="font-mono">{BUCKET}</span> bucket. New uploads are
              compressed automatically in the browser.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs text-neutral-700 hover:bg-neutral-50 font-medium transition cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error ? (
        <p className="text-xs text-red-600">Could not load storage usage: {(error as Error).message}</p>
      ) : (
        <>
          <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl font-serif text-neutral-950 font-medium">
                {isLoading || !stats ? '...' : formatFileSize(stats.totalBytes)}
              </span>
              <span className="text-xs text-neutral-500 font-mono">
                {usagePct.toFixed(1)}% of {formatFileSize(STORAGE_QUOTA_BYTES)} · {stats?.totalFiles ?? 0} files
              </span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  usagePct > 90 ? 'bg-red-500' : usagePct > 70 ? 'bg-amber-500' : 'bg-neutral-900'
                }`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>

          {stats && Object.keys(stats.folders).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(stats.folders).map(([folder, item]) => (
                <div key={folder} className="bg-white border border-neutral-200 rounded-lg p-3">
                  <div className="flex items-center justify-between text-neutral-400 mb-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-mono uppercase text-neutral-500">{item.count} files</span>
                  </div>
                  <div className="font-medium text-xs text-neutral-900 capitalize truncate">{folder}</div>
                  <div className="text-[11px] font-mono text-neutral-500 mt-0.5">{formatFileSize(item.bytes)}</div>
                </div>
              ))}
            </div>
          )}

          {stats && stats.largest.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                Largest files
              </h3>
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <tbody className="divide-y divide-neutral-100 font-mono text-[11px]">
                    {stats.largest.map((file) => (
                      <tr key={file.path} className="hover:bg-neutral-50/60">
                        <td className="py-2 px-3 text-neutral-900 font-sans max-w-[260px] truncate">{file.path}</td>
                        <td className="py-2 px-3 text-neutral-500">{file.mimetype.split('/')[1]}</td>
                        <td className="py-2 px-3 text-right font-medium text-neutral-900">
                          {formatFileSize(file.size)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {stats && stats.largeCount > 0 && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 flex items-start gap-2.5 text-xs text-neutral-600">
              <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
              <div>
                {stats.largeCount} stored file{stats.largeCount > 1 ? 's are' : ' is'} over 1 MB, likely
                uploaded before auto-compression. Re-compress them from your computer (needs{' '}
                <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span>):
                <div className="bg-neutral-950 text-neutral-200 rounded-lg p-3 mt-2 font-mono text-[11px] space-y-1 overflow-x-auto">
                  <div>npm run optimize:storage <span className="text-neutral-500"># dry run</span></div>
                  <div>npm run optimize:storage:apply <span className="text-neutral-500"># apply, with backup</span></div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
