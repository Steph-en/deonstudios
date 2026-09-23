import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Upload,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MediaUploader } from '../../components/forms/MediaUploader';
import { MediaService, LibraryMediaAsset } from '../../features/media/services/mediaService';

export const MediaManagerPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: assets = [], isLoading } = useQuery<LibraryMediaAsset[]>({
    queryKey: ['media-library'],
    queryFn: () => MediaService.getAllLibraryAssets(),
  });

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (asset: LibraryMediaAsset) => {
    if (confirm(`Are you sure you want to permanently delete "${asset.name}"? This cannot be undone.`)) {
      try {
        setDeletingId(asset.id);
        await MediaService.deleteLibraryAsset(asset.id, asset.storagePath, asset.url);
        await queryClient.invalidateQueries();
      } catch (err: any) {
        alert(err.message || 'Failed to delete media asset');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleSeedSamples = async () => {
    try {
      setIsSeeding(true);
      await MediaService.seedSampleAssets();
      await queryClient.invalidateQueries({ queryKey: ['media-library'] });
    } catch (err: any) {
      alert(err.message || 'Failed to seed sample assets');
    } finally {
      setIsSeeding(false);
    }
  };

  const filtered = assets.filter((a) => {
    const matchesType = filterType === 'all' || a.type === filterType;
    const matchesSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.url.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-serif text-neutral-950 font-normal">Media Library</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Browse, upload, and organize high-resolution photography and video assets.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {assets.length === 0 && (
            <button
              type="button"
              onClick={handleSeedSamples}
              disabled={isSeeding}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-700 text-xs font-medium hover:bg-neutral-50 transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSeeding ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-500" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-neutral-500" />
              )}
              Seed Sample Media
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition shadow-sm cursor-pointer"
          >
            <Upload className="w-4 h-4" /> {showUpload ? 'Close Uploader' : 'Upload Assets'}
          </button>
        </div>
      </div>

      {showUpload && (
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
          <MediaUploader
            label="Upload Media Asset"
            description="Upload high-resolution photography plates or video clips"
            accept="both"
            projectId="general"
            folder="uploads"
            onUploadComplete={async (res) => {
              await MediaService.addLibraryAsset({
                name: res.fileName,
                url: res.url,
                storagePath: res.path,
                type: res.mimeType.startsWith('video') ? 'video' : 'image',
                size: `${(res.fileSize / 1024 / 1024).toFixed(2)} MB`,
              });
              await queryClient.invalidateQueries({ queryKey: ['media-library'] });
              setShowUpload(false);
            }}
          />
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 rounded-xl border border-neutral-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search media files by name..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="text-xs px-2.5 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-700 focus:outline-none focus:border-neutral-900 font-medium"
          >
            <option value="all">All Media</option>
            <option value="image">Images Only</option>
            <option value="video">Videos Only</option>
          </select>
        </div>
      </div>

      {/* Grid of media cards or Empty State */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-neutral-400 font-mono bg-white border border-neutral-200 rounded-xl">
          Loading media library...
        </div>
      ) : assets.length === 0 ? (
        <div className="py-20 text-center space-y-4 px-4 bg-white border border-neutral-200 rounded-xl">
          <div className="space-y-1">
            <p className="text-sm font-medium text-neutral-800">No media assets in library</p>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Your storage bucket is clean and has zero media assets. You can upload bespoke photography plates or seed sample assets.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSeedSamples}
              disabled={isSeeding}
              className="inline-flex items-center gap-2 px-3.5 py-2 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition cursor-pointer disabled:opacity-50"
            >
              {isSeeding ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-500" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-neutral-500" />
              )}
              Seed Sample Media
            </button>
            <button
              type="button"
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 text-white rounded-lg text-xs font-medium hover:bg-neutral-800 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload First Asset
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center space-y-2 bg-white border border-neutral-200 rounded-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
            No media matching active filters
          </p>
          <p className="text-xs text-neutral-400">
            Try adjusting your search query or reset the filter type.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map((asset) => (
            <div
              key={asset.id}
              className="group bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm hover:border-neutral-400 transition flex flex-col"
            >
              <div className="relative aspect-square bg-neutral-900 overflow-hidden">
                {asset.type === 'video' ? (
                  <video src={asset.url} className="w-full h-full object-cover" muted />
                ) : (
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    referrerPolicy="no-referrer"
                  />
                )}

                <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-black/60 text-white backdrop-blur-sm">
                  {asset.type}
                </div>
              </div>

              <div className="p-2.5 flex-1 flex flex-col justify-between gap-2 bg-neutral-50/50">
                <div>
                  <p className="text-xs font-medium text-neutral-800 truncate" title={asset.name}>
                    {asset.name}
                  </p>
                  <p className="text-[10px] font-mono text-neutral-400 mt-0.5">
                    {asset.size} • {asset.date}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(asset.id, asset.url)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-600 hover:text-neutral-950 transition cursor-pointer"
                    title="Copy Public URL"
                  >
                    {copiedId === asset.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy URL
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(asset)}
                    disabled={deletingId === asset.id}
                    className="p-1 text-neutral-400 hover:text-red-600 transition cursor-pointer disabled:opacity-50"
                    title="Delete file permanently"
                  >
                    {deletingId === asset.id ? (
                      <Loader2 className="w-3 h-3 animate-spin text-neutral-500" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
