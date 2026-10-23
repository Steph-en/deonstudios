import React, { useState } from 'react';
import {
  HardDrive,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowDown,
  Layers,
  FileCheck,
  FileX,
  Play,
  Download,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConfirm, useToast } from '../../context/AdminUIContext';

export interface StorageStatsResponse {
  success: boolean;
  totalFiles: number;
  totalBytes: number;
  totalMb: number;
  totalGb: number;
  freeAllowanceGb: number;
  usagePercentage: number;
  folderBreakdown: Record<string, { count: number; bytes: number }>;
  topLargest: Array<{
    path: string;
    name: string;
    size: number;
    mimetype: string;
  }>;
  lastReport?: {
    timestamp: string;
    mode: string;
    bytesSaved: number;
    savedMb: number;
    reductionPercent: number;
    unreferencedFilesCount: number;
    unreferencedBytes: number;
    results: any[];
  };
}

export const StorageOptimizerPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { confirm } = useConfirm();

  const [maxWidth, setMaxWidth] = useState<number>(2560);
  const [quality, setQuality] = useState<number>(82);
  const [cleanOrphans, setCleanOrphans] = useState<boolean>(false);
  const [createBackup, setCreateBackup] = useState<boolean>(true);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [fileFilter, setFileFilter] = useState<'all' | 'large' | 'orphans'>('all');

  // Fetch Storage Stats (cached 5 min to protect Supabase egress)
  const {
    data: stats,
    isLoading,
    refetch,
    isFetching,
  } = useQuery<StorageStatsResponse>({
    queryKey: ['storage-stats'],
    queryFn: async () => {
      const res = await fetch('/api/storage/stats');
      if (!res.ok) throw new Error('Failed to load storage statistics');
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const lastReport = stats?.lastReport;
  const freeAllowanceBytes = 5 * 1024 * 1024 * 1024; // 5 GB
  const currentBytes = stats?.totalBytes || 0;
  const usagePct = stats?.usagePercentage || 0;

  // Potential savings estimate (based on sharp 82% mozjpeg benchmark ~85-92% reduction)
  const estimatedSavingsBytes = Math.round(currentBytes * 0.88);
  const projectedBytesAfterOpt = Math.max(0, currentBytes - estimatedSavingsBytes);

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-neutral-950 text-white flex items-center justify-center shrink-0 mt-0.5">
            <HardDrive className="w-5 h-5 text-neutral-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-neutral-900 tracking-tight">
                Supabase Storage & Asset Optimization
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                Free Plan Guard
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Reduce storage consumption below the 5 GB Supabase Free limit using Sharp MozJPEG compression and deduplication.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            try {
              const res = await fetch('/api/storage/stats?fresh=true');
              if (res.ok) {
                const freshData = await res.json();
                queryClient.setQueryData(['storage-stats'], freshData);
                toast.info('Storage statistics updated');
              } else {
                refetch();
              }
            } catch {
              refetch();
            }
          }}
          disabled={isFetching}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs text-neutral-700 hover:bg-neutral-50 font-medium transition cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* Storage Gauge & Quota Bar */}
      <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
              Current Supabase Storage Allowance
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-serif text-neutral-950 font-medium">
                {stats ? `${stats.totalMb.toFixed(1)} MB` : '...'}
              </span>
              <span className="text-xs text-neutral-500 font-mono">
                / 5,000 MB (5.00 GB Allowance)
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-mono font-medium text-neutral-700">
              {usagePct}% Consumed
            </span>
            <p className="text-[11px] text-neutral-500">
              {stats && stats.totalGb >= 5 ? (
                <span className="text-red-600 font-medium flex items-center gap-1 sm:justify-end">
                  <AlertTriangle className="w-3.5 h-3.5" /> Exceeding 5 GB limit
                </span>
              ) : (
                <span className="text-emerald-700 font-medium flex items-center gap-1 sm:justify-end">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Within Free Tier
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Multi-stage Progress Bar */}
        <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden flex">
          <div
            className={`h-full transition-all duration-500 ${
              usagePct > 90 ? 'bg-red-500' : usagePct > 70 ? 'bg-amber-500' : 'bg-neutral-900'
            }`}
            style={{ width: `${Math.min(usagePct, 100)}%` }}
          />
        </div>

        {/* Projected Savings Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-neutral-200/60 text-xs">
          <div className="flex items-center gap-2 text-neutral-700">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              Estimated Optimization Savings:{' '}
              <strong className="font-semibold text-neutral-900">
                ~{(estimatedSavingsBytes / (1024 * 1024)).toFixed(0)} MB (~88% reduction)
              </strong>
            </span>
          </div>
          <div className="text-neutral-500 font-mono">
            Projected Storage: ~{(projectedBytesAfterOpt / (1024 * 1024)).toFixed(1)} MB
          </div>
        </div>
      </div>

      {/* Folder Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats?.folderBreakdown &&
          Object.entries(stats.folderBreakdown).map(([folder, item]) => (
            <div
              key={folder}
              className="bg-white border border-neutral-200 rounded-lg p-3 hover:border-neutral-300 transition"
            >
              <div className="flex items-center justify-between text-neutral-400 mb-1">
                <Layers className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono uppercase text-neutral-500">
                  {item.count} files
                </span>
              </div>
              <div className="font-medium text-xs text-neutral-900 capitalize truncate">
                {folder === 'projects' ? 'Project Works' : folder}
              </div>
              <div className="text-[11px] font-mono text-neutral-500 mt-0.5">
                {(item.bytes / (1024 * 1024)).toFixed(1)} MB
              </div>
            </div>
          ))}

        {lastReport && (
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-3">
            <div className="flex items-center justify-between text-emerald-600 mb-1">
              <FileCheck className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono uppercase text-emerald-700 font-medium">
                Last Run
              </span>
            </div>
            <div className="font-medium text-xs text-emerald-950">
              {lastReport.mode === 'applied' ? 'Applied' : 'Simulation'}
            </div>
            <div className="text-[11px] font-mono text-emerald-700 mt-0.5">
              -{lastReport.savedMb.toFixed(1)} MB ({lastReport.reductionPercent}%)
            </div>
          </div>
        )}
      </div>

      {/* Optimization Parameters & CLI Instructions */}
      <div className="border border-neutral-200 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
            Optimization Pipeline & Batch CLI
          </div>
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-950 font-medium cursor-pointer"
          >
            {showDetails ? 'Hide Controls' : 'Show Controls'}
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showDetails && (
          <div className="space-y-4 pt-2 border-t border-neutral-100 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-neutral-700 font-medium mb-1">
                  Max Image Bounding Box (Pixels)
                </label>
                <select
                  value={maxWidth}
                  onChange={(e) => setMaxWidth(Number(e.target.value))}
                  className="w-full border border-neutral-200 rounded-lg p-2 text-xs text-neutral-900 bg-white"
                >
                  <option value={2560}>2560 x 2560 px (Recommended for Studio Retina)</option>
                  <option value={3840}>3840 x 3840 px (4K Ultra-High-Res)</option>
                  <option value={1920}>1920 x 1920 px (Full HD Maximum Savings)</option>
                </select>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Aspect ratio is preserved. Images are never upscaled.
                </p>
              </div>

              <div>
                <label className="block text-neutral-700 font-medium mb-1">
                  MozJPEG Compression Quality: <span className="font-mono">{quality}%</span>
                </label>
                <input
                  type="range"
                  min={75}
                  max={92}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-neutral-950 mt-1"
                />
                <div className="flex justify-between text-[10px] text-neutral-400 font-mono mt-1">
                  <span>75% (Maximum compression)</span>
                  <span className="font-bold text-neutral-700">82% (Lossless visual balance)</span>
                  <span>92% (Heavy archival)</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createBackup}
                  onChange={(e) => setCreateBackup(e.target.checked)}
                  className="accent-neutral-950 rounded"
                />
                <span className="text-neutral-700 font-medium">
                  Create timestamped local backup before replacing files
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cleanOrphans}
                  onChange={(e) => setCleanOrphans(e.target.checked)}
                  className="accent-neutral-950 rounded"
                />
                <span className="text-neutral-700 font-medium">
                  Clean unreferenced/abandoned files from bucket
                </span>
              </label>
            </div>
          </div>
        )}

        {/* CLI Terminal Commands */}
        <div className="bg-neutral-950 text-neutral-200 rounded-lg p-3 font-mono text-[11px] space-y-1.5 overflow-x-auto">
          <div className="text-neutral-400 text-[10px] uppercase tracking-wider mb-1">
            CLI Commands (Available in workspace & server terminal):
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-emerald-400">npm run optimize:storage</span>
            <span className="text-neutral-500 text-[10px] font-sans"># Dry-run analysis & simulation</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-amber-400">npm run optimize:storage:apply</span>
            <span className="text-neutral-500 text-[10px] font-sans"># Apply optimization with automatic backups</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-blue-400">npm run optimize:storage:clean</span>
            <span className="text-neutral-500 text-[10px] font-sans"># Apply + purge unreferenced duplicate files</span>
          </div>
        </div>
      </div>

      {/* Top Largest Assets Table */}
      {stats?.topLargest && stats.topLargest.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
              Top Storage Consumers
            </h3>
            <span className="text-[11px] text-neutral-500 font-mono">
              Top 10 largest files
            </span>
          </div>

          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-mono text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Storage Path</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Current Size</th>
                  <th className="py-2.5 px-3 text-right">Estimated After</th>
                  <th className="py-2.5 px-3 text-right">Savings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono text-[11px]">
                {stats.topLargest.map((file) => {
                  const mb = file.size / (1024 * 1024);
                  const estAfterMb = mb * 0.1; // ~90% reduction
                  const savedPct = 90;
                  return (
                    <tr key={file.path} className="hover:bg-neutral-50/60">
                      <td className="py-2 px-3 text-neutral-900 font-sans max-w-[260px] truncate">
                        {file.path}
                      </td>
                      <td className="py-2 px-3 text-neutral-500">
                        {file.mimetype.replace('image/', '')}
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-neutral-900">
                        {mb.toFixed(2)} MB
                      </td>
                      <td className="py-2 px-3 text-right text-emerald-700 font-medium">
                        ~{estAfterMb.toFixed(2)} MB
                      </td>
                      <td className="py-2 px-3 text-right text-emerald-600 font-semibold">
                        -{savedPct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Safety & Real-time Upload Guarantee Footer */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 flex items-start gap-2.5 text-xs text-neutral-600">
        <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
        <div>
          <strong className="text-neutral-900">Automatic Upload Protection Active:</strong>{' '}
          All future uploads via the Admin Dashboard or API proxy are now automatically processed through Sharp before being saved to Supabase Storage. Camera raw images (15MB-30MB) are automatically sized to max 2560px MozJPEG, guaranteeing the storage quota remains permanently protected under the 5 GB plan.
        </div>
      </div>
    </div>
  );
};
