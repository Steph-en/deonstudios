import React, { useState, useRef } from 'react';
import { Upload, X, Check, AlertCircle, Loader2, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';
import { StorageService, UploadResult } from '../../services/storageService';
import { formatFileSize } from '../../lib/utils';

interface MediaUploaderProps {
  label: string;
  description?: string;
  accept?: 'image' | 'video' | 'both';
  currentUrl?: string | null;
  currentPath?: string | null;
  projectId?: string;
  folder?: string;
  onUploadComplete: (result: UploadResult) => void;
  onRemove?: () => void;
  className?: string;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  label,
  description,
  accept = 'image',
  currentUrl,
  currentPath,
  projectId = 'general',
  folder = 'preview',
  onUploadComplete,
  onRemove,
  className = '',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedMime =
    accept === 'video'
      ? 'video/mp4,video/webm'
      : accept === 'image'
      ? 'image/jpeg,image/png,image/webp,image/svg+xml'
      : 'image/jpeg,image/png,image/webp,image/svg+xml,video/mp4,video/webm';

  const handleFile = async (file: File) => {
    setError(null);
    setIsUploading(true);

    try {
      const destinationPath = `projects/${projectId}/${folder}/`;
      const result = await StorageService.uploadMedia({
        file,
        destinationPath,
        upsert: true,
      });

      onUploadComplete(result);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'Upload failed. Please check file format and size.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const isVideo =
    currentUrl?.endsWith('.mp4') ||
    currentUrl?.endsWith('.webm') ||
    accept === 'video';

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-800">
          {label}
        </label>
        {description && <span className="text-xs text-neutral-400">{description}</span>}
      </div>

      {currentUrl ? (
        <div className="relative group border border-neutral-200 bg-neutral-50 rounded-lg overflow-hidden p-2 flex items-center gap-4">
          <div className="w-24 h-24 bg-neutral-900 rounded overflow-hidden flex-shrink-0 flex items-center justify-center relative">
            {isVideo ? (
              <video src={currentUrl} className="w-full h-full object-cover" muted loop playsInline />
            ) : (
              <img src={currentUrl} alt={label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {isVideo ? <VideoIcon className="w-6 h-6 text-white" /> : <ImageIcon className="w-6 h-6 text-white" />}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-neutral-700 truncate" title={currentUrl}>
              {currentUrl}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
              <Check className="w-3.5 h-3.5" /> Media Ready
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs px-2.5 py-1 rounded bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-medium transition"
              >
                Replace
              </button>
              {onRemove && (
                <button
                  type="button"
                  onClick={onRemove}
                  className="text-xs px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-red-600 font-medium transition"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition ${
            dragOver
              ? 'border-neutral-900 bg-neutral-100'
              : 'border-neutral-300 hover:border-neutral-500 bg-neutral-50/50'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center py-2 space-y-2">
              <Loader2 className="w-7 h-7 animate-spin text-neutral-700" />
              <p className="text-xs font-medium text-neutral-600">Uploading media...</p>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mb-2 text-neutral-600">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-neutral-800">
                Click to upload or drag & drop {accept}
              </p>
              <p className="text-[11px] text-neutral-400 mt-1">
                {accept === 'video'
                  ? 'MP4, WebM up to 150MB'
                  : accept === 'image'
                  ? 'JPG, PNG, WebP, SVG up to 20MB'
                  : 'Images up to 20MB, Videos up to 150MB'}
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="text-xs text-red-600 flex items-center gap-1.5 mt-1 bg-red-50 p-2 rounded">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedMime}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />
    </div>
  );
};
