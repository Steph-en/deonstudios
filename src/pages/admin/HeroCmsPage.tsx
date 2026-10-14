import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Video,
  Image as ImageIcon,
  Upload,
  Save,
  RotateCcw,
  Smartphone,
  Monitor,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Play,
  Calendar,
  Check,
} from 'lucide-react';
import {
  useHeroSettings,
  useUpdateHeroSettings,
} from '../../hooks/usePortfolioQueries';
import {
  HeroSettings,
  HeroAsset,
  DEFAULT_HERO_SETTINGS,
} from '../../services/siteSettingsService';
import { StorageService } from '../../services/storageService';
import { useToast } from '../../context/AdminUIContext';

export const HeroCmsPage: React.FC = () => {
  const toast = useToast();
  const { data: heroSettings, isLoading } = useHeroSettings();
  const updateMutation = useUpdateHeroSettings();

  const [formData, setFormData] = useState<HeroSettings>(DEFAULT_HERO_SETTINGS);
  const [isUploadingMultiple, setIsUploadingMultiple] = useState(false);
  const [isUploadingSingle, setIsUploadingSingle] = useState(false);
  const [isUploadingMobile, setIsUploadingMobile] = useState(false);
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [simulatedSlotIndex, setSimulatedSlotIndex] = useState<number | null>(null);

  // Synchronize incoming settings
  useEffect(() => {
    if (heroSettings) {
      const normalizedAssets: HeroAsset[] =
        heroSettings.assets && heroSettings.assets.length > 0
          ? heroSettings.assets
          : [
              {
                id: 'asset-1',
                url: heroSettings.mediaUrl || DEFAULT_HERO_SETTINGS.mediaUrl,
                mediaType: heroSettings.mediaType || 'video',
                title: 'Primary Hero Media',
                mobileUrl: heroSettings.mobileMediaUrl,
                fallbackPosterUrl: heroSettings.fallbackPosterUrl,
              },
            ];

      setFormData({
        ...DEFAULT_HERO_SETTINGS,
        ...heroSettings,
        assets: normalizedAssets,
        mode: heroSettings.mode || 'single',
        rotationIntervalHours: heroSettings.rotationIntervalHours || 1,
        rotationIntervalUnit: heroSettings.rotationIntervalUnit || 'hours',
      });
    }
  }, [heroSettings]);

  // Compute live rotation index based on current clock time
  const liveSlotIndex = useMemo(() => {
    if (!formData.assets || formData.assets.length === 0) return 0;
    const interval = formData.rotationIntervalHours || 1;
    const isMin = formData.rotationIntervalUnit === 'minutes';
    const intervalMs = (isMin ? interval * 60 : interval * 3600) * 1000;
    return Math.floor(Date.now() / intervalMs) % formData.assets.length;
  }, [formData.assets, formData.rotationIntervalHours, formData.rotationIntervalUnit]);

  // Determine which asset is previewed in the right-hand simulated viewport
  const activePreviewAsset = useMemo<HeroAsset>(() => {
    if (!formData.assets || formData.assets.length === 0) {
      return {
        id: 'fallback',
        url: formData.mediaUrl || '/videos/hero-desktop.mp4',
        mediaType: formData.mediaType || 'video',
        title: 'Default Hero',
      };
    }

    // Manual simulation preview if user selected one
    if (simulatedSlotIndex !== null && formData.assets[simulatedSlotIndex]) {
      return formData.assets[simulatedSlotIndex];
    }

    if (formData.mode === 'rotation') {
      return formData.assets[liveSlotIndex] || formData.assets[0];
    }

    // Single mode: active asset
    if (formData.activeAssetId) {
      const found = formData.assets.find((a) => a.id === formData.activeAssetId);
      if (found) return found;
    }

    return formData.assets[0];
  }, [formData, simulatedSlotIndex, liveSlotIndex]);

  // Handle batch multiple file upload (mix of videos and images)
  const handleMultipleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      setIsUploadingMultiple(true);
      const newAssets: HeroAsset[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isVideo = file.type.startsWith('video/');
        const res = await StorageService.uploadMedia({
          file,
          destinationPath: 'hero/',
        });

        newAssets.push({
          id: `hero-${Date.now()}-${i}`,
          url: res.url,
          mediaType: isVideo ? 'video' : 'image',
          title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        });
      }

      setFormData((prev) => {
        const updatedAssets = [...prev.assets, ...newAssets];
        return {
          ...prev,
          assets: updatedAssets,
          // Update primary fields to first asset if previously empty
          mediaUrl: prev.mediaUrl || updatedAssets[0]?.url,
          mediaType: prev.mediaType || updatedAssets[0]?.mediaType,
        };
      });

      toast.success(
        `Uploaded ${newAssets.length} asset${newAssets.length > 1 ? 's' : ''} to hero rotation playlist.`,
        'ASSETS UPLOADED'
      );
    } catch (err: any) {
      console.error('Multiple hero assets upload error:', err);
      toast.error(err.message || 'Failed to upload hero assets', 'UPLOAD ERROR');
    } finally {
      setIsUploadingMultiple(false);
    }
  };

  // Move asset up or down in rotation order
  const handleMoveAsset = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= formData.assets.length) return;
    setFormData((prev) => {
      const copy = [...prev.assets];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return {
        ...prev,
        assets: copy,
        mediaUrl: copy[0]?.url || prev.mediaUrl,
        mediaType: copy[0]?.mediaType || prev.mediaType,
      };
    });
    setSimulatedSlotIndex(toIndex);
  };

  // Remove asset from hero list
  const handleDeleteAsset = (id: string) => {
    if (formData.assets.length <= 1) {
      toast.error('You must keep at least one background asset for the hero.', 'ACTION PREVENTED');
      return;
    }
    setFormData((prev) => {
      const filtered = prev.assets.filter((a) => a.id !== id);
      return {
        ...prev,
        assets: filtered,
        activeAssetId: prev.activeAssetId === id ? filtered[0]?.id : prev.activeAssetId,
        mediaUrl: filtered[0]?.url || prev.mediaUrl,
        mediaType: filtered[0]?.mediaType || prev.mediaType,
      };
    });
    setSimulatedSlotIndex(null);
  };

  // Set asset as active in Single mode
  const handleSetActiveAsset = (asset: HeroAsset) => {
    setFormData((prev) => ({
      ...prev,
      activeAssetId: asset.id,
      mediaUrl: asset.url,
      mediaType: asset.mediaType,
      mobileMediaUrl: asset.mobileUrl || prev.mobileMediaUrl,
      fallbackPosterUrl: asset.fallbackPosterUrl || prev.fallbackPosterUrl,
    }));
    setSimulatedSlotIndex(null);
    toast.success(`"${asset.title || 'Asset'}" is now set as the active single hero background.`, 'HERO UPDATED');
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      // Ensure sync between active asset and legacy fields
      const primary =
        (formData.activeAssetId
          ? formData.assets.find((a) => a.id === formData.activeAssetId)
          : null) ||
        formData.assets[0] || {
          url: formData.mediaUrl,
          mediaType: formData.mediaType,
        };

      const payload: HeroSettings = {
        ...formData,
        mediaUrl: primary.url,
        mediaType: primary.mediaType,
      };

      await updateMutation.mutateAsync(payload);
      toast.success(
        'Hero settings & rotation schedule saved live across the site.',
        'HERO SAVED'
      );
    } catch (err: any) {
      console.error('Failed to save hero settings:', err);
      toast.error(err.message || 'Failed to update hero settings', 'SAVE ERROR');
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset hero settings to default configuration?')) {
      setFormData(DEFAULT_HERO_SETTINGS);
      setSimulatedSlotIndex(null);
    }
  };

  const currentMediaUrl =
    previewMode === 'mobile' && activePreviewAsset.mobileUrl
      ? activePreviewAsset.mobileUrl
      : activePreviewAsset.url;

  const isVideoFormat =
    activePreviewAsset.mediaType === 'video' ||
    (currentMediaUrl && (currentMediaUrl.endsWith('.mp4') || currentMediaUrl.endsWith('.webm')));

  if (isLoading) {
    return (
      <div className="p-8 text-center font-mono text-xs text-neutral-400">
        Loading hero section configuration...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-neutral-900 text-white rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-serif text-neutral-950">
              Hero Section CMS
            </h1>
          </div>
          <p className="mt-1 text-xs text-neutral-500 font-sans-clean">
            Upload single or multiple assets (videos &amp; photography) with scheduled rotation across 1 hr, 5 hrs, 6 hrs, or 24 hrs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:text-neutral-900 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-neutral-950 rounded-lg hover:bg-neutral-800 transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Background Mode: Single Asset vs Timed Rotation */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider font-mono">
                1. Hero Background Mode
              </h2>
              <span className="text-[10px] font-mono uppercase bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded">
                Client Strategy
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Choose whether the hero displays a single fixed background or automatically rotates through multiple photos and videos over time.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Option A: Single Background */}
              <label
                className={`flex flex-col p-4 rounded-xl border cursor-pointer transition select-none ${
                  formData.mode === 'single'
                    ? 'border-neutral-950 bg-neutral-50 text-neutral-950 ring-1 ring-neutral-950'
                    : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-medium text-xs text-neutral-950">
                    <ImageIcon className="w-4 h-4 text-neutral-900" />
                    <span>Single Background</span>
                  </div>
                  <input
                    type="radio"
                    name="heroMode"
                    value="single"
                    checked={formData.mode === 'single'}
                    onChange={() => setFormData((prev) => ({ ...prev, mode: 'single' }))}
                    className="accent-neutral-950"
                  />
                </div>
                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  Display one chosen image or video continuously until you decide to change it.
                </p>
              </label>

              {/* Option B: Timed Rotation */}
              <label
                className={`flex flex-col p-4 rounded-xl border cursor-pointer transition select-none ${
                  formData.mode === 'rotation'
                    ? 'border-neutral-950 bg-neutral-50 text-neutral-950 ring-1 ring-neutral-950'
                    : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-medium text-xs text-neutral-950">
                    <Clock className="w-4 h-4 text-neutral-900" />
                    <span>Timed Multi-Asset Rotation</span>
                  </div>
                  <input
                    type="radio"
                    name="heroMode"
                    value="rotation"
                    checked={formData.mode === 'rotation'}
                    onChange={() => setFormData((prev) => ({ ...prev, mode: 'rotation' }))}
                    className="accent-neutral-950"
                  />
                </div>
                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  Upload multiple images and videos. The hero automatically rotates between them on a schedule (e.g. every 1 hr, 5 hrs, 6 hrs, 24 hrs).
                </p>
              </label>
            </div>
          </div>

          {/* 2. Rotation Interval Settings (Shown when Mode === 'rotation') */}
          {formData.mode === 'rotation' && (
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Clock className="w-4 h-4 text-neutral-700" />
                  2. Rotation Schedule Interval
                </h2>
                <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                  Active
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Choose how long each asset stays live before rotating to the next image or video. For example: Image A shows for 1 hour, then Video B, then Image C.
              </p>

              {/* Preset Interval Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {[
                  { label: '1 Hour', hours: 1, unit: 'hours' },
                  { label: '2 Hours', hours: 2, unit: 'hours' },
                  { label: '5 Hours', hours: 5, unit: 'hours' },
                  { label: '6 Hours', hours: 6, unit: 'hours' },
                  { label: '12 Hours', hours: 12, unit: 'hours' },
                  { label: '24 Hours (1 Day)', hours: 24, unit: 'hours' },
                  { label: '5 Minutes (Test)', hours: 5, unit: 'minutes' },
                ].map((item) => {
                  const isSelected =
                    formData.rotationIntervalHours === item.hours &&
                    formData.rotationIntervalUnit === item.unit;
                  return (
                    <button
                      key={`${item.hours}-${item.unit}`}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          rotationIntervalHours: item.hours,
                          rotationIntervalUnit: item.unit as any,
                        }))
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-950 text-white font-semibold shadow-xs'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Custom Number Input */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs text-neutral-700">
                  <span>Custom Interval:</span>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={formData.rotationIntervalHours}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        rotationIntervalHours: Math.max(1, parseInt(e.target.value, 10) || 1),
                      }))
                    }
                    className="w-16 px-2 py-1 text-xs border border-neutral-200 rounded font-mono text-center focus:outline-none focus:border-neutral-900"
                  />
                  <select
                    value={formData.rotationIntervalUnit || 'hours'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        rotationIntervalUnit: e.target.value as any,
                      }))
                    }
                    className="px-2 py-1 text-xs border border-neutral-200 rounded bg-white font-mono"
                  >
                    <option value="hours">Hours</option>
                    <option value="minutes">Minutes</option>
                  </select>
                </div>
              </div>

              {/* Live Schedule Status Card */}
              <div className="p-3.5 bg-neutral-950 text-white rounded-xl space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-300">
                      Live Schedule Status
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">
                    Cycle: {formData.rotationIntervalHours} {formData.rotationIntervalUnit || 'hours'} per asset
                  </span>
                </div>
                <div className="text-xs font-medium text-white flex items-center justify-between pt-1 border-t border-neutral-800">
                  <span>
                    Currently live:{' '}
                    <strong className="text-emerald-300">
                      #{liveSlotIndex + 1} - {formData.assets[liveSlotIndex]?.title || 'Hero Asset'}
                    </strong>
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    Up next: #{((liveSlotIndex + 1) % formData.assets.length) + 1}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 3. Hero Assets Playlist & Multi-Upload */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Layers className="w-4 h-4 text-neutral-700" />
                  3. Hero Assets &amp; Playlist ({formData.assets.length})
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Upload multiple images and videos. Drag or use the arrows to set their rotation order.
                </p>
              </div>

              {/* Multi-Upload Button */}
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-950 hover:bg-neutral-800 rounded-lg cursor-pointer transition shrink-0 shadow-xs">
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploadingMultiple ? 'Uploading...' : 'Upload Multiple Assets'}</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="sr-only"
                  disabled={isUploadingMultiple}
                  onChange={(e) => handleMultipleFileUpload(e.target.files)}
                />
              </label>
            </div>

            {/* Assets List */}
            <div className="space-y-3 pt-2">
              {formData.assets.map((asset, idx) => {
                const isLiveNow = formData.mode === 'rotation' && idx === liveSlotIndex;
                const isSingleActive =
                  formData.mode === 'single' &&
                  (formData.activeAssetId === asset.id || (!formData.activeAssetId && idx === 0));
                const isSimulated = simulatedSlotIndex === idx;

                return (
                  <div
                    key={asset.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isLiveNow || isSingleActive
                        ? 'border-neutral-900 bg-neutral-50/80 ring-1 ring-neutral-900'
                        : isSimulated
                        ? 'border-neutral-400 bg-white ring-1 ring-neutral-400'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    {/* Position and Handle */}
                    <div className="flex flex-col items-center gap-1 text-neutral-400">
                      <span className="text-[11px] font-mono font-bold text-neutral-700">
                        #{idx + 1}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveAsset(idx, idx - 1)}
                          className="p-0.5 rounded hover:bg-neutral-200 text-neutral-600 disabled:opacity-30 cursor-pointer"
                          title="Move up in rotation"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === formData.assets.length - 1}
                          onClick={() => handleMoveAsset(idx, idx + 1)}
                          className="p-0.5 rounded hover:bg-neutral-200 text-neutral-600 disabled:opacity-30 cursor-pointer"
                          title="Move down in rotation"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Thumbnail */}
                    <div className="relative w-16 h-12 rounded-lg bg-neutral-900 overflow-hidden shrink-0 border border-neutral-200">
                      {asset.mediaType === 'video' || asset.url.endsWith('.mp4') ? (
                        <>
                          <video src={asset.url} className="w-full h-full object-cover" muted />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <Video className="w-3.5 h-3.5 text-white" />
                          </div>
                        </>
                      ) : asset.url ? (
                        <img
                          src={asset.url}
                          alt={asset.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : null}
                    </div>

                    {/* Info & Editable Title */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={asset.title || `Asset #${idx + 1}`}
                          onChange={(e) => {
                            const newTitle = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              assets: prev.assets.map((a) =>
                                a.id === asset.id ? { ...a, title: newTitle } : a
                              ),
                            }));
                          }}
                          className="text-xs font-semibold text-neutral-900 truncate bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-neutral-900 focus:outline-none w-full"
                          placeholder="Asset Title..."
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded ${
                            asset.mediaType === 'video'
                              ? 'bg-purple-100 text-purple-700 font-semibold'
                              : 'bg-blue-100 text-blue-700 font-semibold'
                          }`}
                        >
                          {asset.mediaType === 'video' ? 'Video' : 'Image'}
                        </span>
                        {isLiveNow && (
                          <span className="text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            Live on Site Now
                          </span>
                        )}
                        {isSingleActive && formData.mode === 'single' && (
                          <span className="text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-white font-bold">
                            Active Background
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {formData.mode === 'single' && !isSingleActive && (
                        <button
                          type="button"
                          onClick={() => handleSetActiveAsset(asset)}
                          className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition cursor-pointer"
                          title="Set as the active background image/video"
                        >
                          Set Active
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setSimulatedSlotIndex(simulatedSlotIndex === idx ? null : idx)
                        }
                        className={`p-1.5 rounded-md transition cursor-pointer ${
                          simulatedSlotIndex === idx
                            ? 'bg-neutral-950 text-white'
                            : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
                        }`}
                        title="Preview this asset in right preview box"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAsset(asset.id)}
                        className="p-1.5 rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Delete asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Single Direct Upload / Add Another */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider font-mono">
              4. Add Single Media Asset (URL or Upload)
            </h2>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste direct URL (image or video)..."
                  id="direct-url-input"
                  className="flex-1 px-3.5 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-950 font-mono"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const target = e.target as HTMLInputElement;
                      if (target.value.trim()) {
                        const url = target.value.trim();
                        const isVideo = url.endsWith('.mp4') || url.endsWith('.webm');
                        setFormData((prev) => ({
                          ...prev,
                          assets: [
                            ...prev.assets,
                            {
                              id: `asset-${Date.now()}`,
                              url,
                              mediaType: isVideo ? 'video' : 'image',
                              title: `Asset #${prev.assets.length + 1}`,
                            },
                          ],
                        }));
                        target.value = '';
                        toast.success('Asset added to hero playlist.', 'ASSET ADDED');
                      }
                    }
                  }}
                />
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer transition shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingSingle ? 'Uploading...' : 'Upload Single File'}</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="sr-only"
                    disabled={isUploadingSingle}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          setIsUploadingSingle(true);
                          const isVideo = file.type.startsWith('video/');
                          const res = await StorageService.uploadMedia({
                            file,
                            destinationPath: 'hero/',
                          });
                          setFormData((prev) => ({
                            ...prev,
                            assets: [
                              ...prev.assets,
                              {
                                id: `asset-${Date.now()}`,
                                url: res.url,
                                mediaType: isVideo ? 'video' : 'image',
                                title: file.name.replace(/\.[^/.]+$/, ''),
                              },
                            ],
                          }));
                          toast.success('Asset uploaded and added to playlist.', 'UPLOADED');
                        } catch (err: any) {
                          toast.error(err.message || 'Upload failed', 'ERROR');
                        } finally {
                          setIsUploadingSingle(false);
                        }
                      }
                    }}
                  />
                </label>
              </div>
              <p className="text-[11px] text-neutral-400">
                Tip: Press Enter in the URL box or click Upload Single File.
              </p>
            </div>
          </div>

          {/* 5. Mobile Portrait Framing & Focal Centering */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider font-mono">
                5. Mobile Subject Centering &amp; Scale
              </h2>
              <span className="text-[10px] font-mono bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                iPhone / Portrait Display
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              When horizontal assets fill vertical smartphones, adjust focal centering so heads, outfits, and shoes remain perfectly framed.
            </p>

            <div className="space-y-4 pt-1">
              <div>
                <div className="flex justify-between items-center text-xs text-neutral-700 mb-1.5">
                  <span>Mobile Scale / Zoom</span>
                  <span className="font-mono font-medium">
                    {Math.round((formData.mobileScale ?? 0.88) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.70"
                  max="1.15"
                  step="0.02"
                  value={formData.mobileScale ?? 0.88}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      mobileScale: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-neutral-950"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs text-neutral-700 mb-1.5">
                  <span>Horizontal Center Position</span>
                  <span className="font-mono font-medium">
                    {formData.mobileFocalX ?? 58}%
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  step="1"
                  value={formData.mobileFocalX ?? 58}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      mobileFocalX: parseInt(e.target.value, 10),
                    }))
                  }
                  className="w-full accent-neutral-950"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs text-neutral-700 mb-1.5">
                  <span>Vertical Center Position</span>
                  <span className="font-mono font-medium">
                    {formData.mobileFocalY ?? 48}%
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  step="1"
                  value={formData.mobileFocalY ?? 48}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      mobileFocalY: parseInt(e.target.value, 10),
                    }))
                  }
                  className="w-full accent-neutral-950"
                />
              </div>
            </div>
          </div>

          {/* 6. Dark Tint & Scroll Indicator */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider font-mono">
              6. Overlay Tint &amp; Scroll Text
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center text-xs text-neutral-700 mb-1.5">
                  <span>Dark Ambient Tint Opacity</span>
                  <span className="font-mono font-medium">
                    {Math.round((formData.overlayOpacity ?? 0.2) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={formData.overlayOpacity ?? 0.2}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      overlayOpacity: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-neutral-950"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-700 mb-1.5">
                  Scroll Indicator Text
                </label>
                <input
                  type="text"
                  value={formData.scrollText || 'SCROLL'}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, scrollText: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-950 font-mono uppercase tracking-widest"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Preview Column */}
        <div className="lg:col-span-5 sticky top-6 space-y-4">
          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-neutral-600" />
                <span className="text-xs font-semibold uppercase tracking-wider font-mono text-neutral-900">
                  Live Viewport Preview
                </span>
              </div>

              {/* Viewport switch: Desktop vs Mobile */}
              <div className="flex items-center bg-neutral-100 rounded-lg p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewMode('desktop')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition cursor-pointer ${
                    previewMode === 'desktop'
                      ? 'bg-white text-neutral-950 font-medium shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('mobile')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition cursor-pointer ${
                    previewMode === 'mobile'
                      ? 'bg-white text-neutral-950 font-medium shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Mobile</span>
                </button>
              </div>
            </div>

            {/* Asset currently being previewed info badge */}
            <div className="mb-2 flex items-center justify-between text-[11px] bg-neutral-50 p-2 rounded-lg border border-neutral-200">
              <div className="truncate">
                <span className="text-neutral-500">Previewing: </span>
                <span className="font-semibold text-neutral-900">
                  {activePreviewAsset.title || 'Hero Asset'}
                </span>
                <span className="ml-1 text-[10px] text-neutral-400 font-mono">
                  ({activePreviewAsset.mediaType})
                </span>
              </div>

              {formData.mode === 'rotation' && formData.assets.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const current =
                      simulatedSlotIndex !== null ? simulatedSlotIndex : liveSlotIndex;
                    const next = (current + 1) % formData.assets.length;
                    setSimulatedSlotIndex(next);
                  }}
                  className="text-[10px] px-2 py-0.5 bg-neutral-900 text-white rounded font-mono hover:bg-neutral-800 cursor-pointer shrink-0 ml-2"
                >
                  Next Rotation ➔
                </button>
              )}
            </div>

            {/* Preview Frame */}
            <div
              className={`mx-auto bg-neutral-950 relative overflow-hidden transition-all duration-300 rounded-xl border border-neutral-800 shadow-xl ${
                previewMode === 'desktop'
                  ? 'w-full aspect-16/10'
                  : 'w-[240px] aspect-9/16'
              }`}
            >
              {/* Media rendering */}
              {isVideoFormat && currentMediaUrl ? (
                <video
                  key={currentMediaUrl}
                  src={currentMediaUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    objectPosition:
                      previewMode === 'mobile'
                        ? `${formData.mobileFocalX ?? 58}% ${formData.mobileFocalY ?? 48}%`
                        : 'center center',
                    transform:
                      previewMode === 'mobile'
                        ? `scale(${formData.mobileScale ?? 0.88})`
                        : 'none',
                    transformOrigin: `${formData.mobileFocalX ?? 58}% ${formData.mobileFocalY ?? 48}%`,
                  }}
                  className="w-full h-full object-cover transition-all duration-300"
                />
              ) : currentMediaUrl ? (
                <img
                  src={currentMediaUrl}
                  alt="Hero Preview"
                  style={{
                    objectPosition:
                      previewMode === 'mobile'
                        ? `${formData.mobileFocalX ?? 58}% ${formData.mobileFocalY ?? 48}%`
                        : 'center center',
                    transform:
                      previewMode === 'mobile'
                        ? `scale(${formData.mobileScale ?? 0.88})`
                        : 'none',
                    transformOrigin: `${formData.mobileFocalX ?? 58}% ${formData.mobileFocalY ?? 48}%`,
                  }}
                  className="w-full h-full object-cover transition-all duration-300"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600 text-xs font-mono p-4 text-center">
                  <AlertCircle className="w-6 h-6 mb-2 text-neutral-500" />
                  No hero media configured
                </div>
              )}

              {/* Tint overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundColor: `rgba(0, 0, 0, ${formData.overlayOpacity ?? 0.2})`,
                }}
              />

              {/* Top Simulated Navbar: Gideon Boadi on top left, transparent logo center, links right */}
              <div className="absolute top-0 inset-x-0 p-3 flex items-center justify-between pointer-events-none z-10">
                <div className="flex flex-col items-start leading-none text-white drop-shadow-md">
                  <span className="text-[10px] font-serif font-light">Gideon Boadi</span>
                  <span className="text-[6px] uppercase tracking-[0.2em] text-white/70 font-mono mt-0.5">
                    Photographer
                  </span>
                </div>
                <div className="w-5 h-5 rounded-full border border-white/60 bg-transparent flex items-center justify-center text-[7px] text-white font-bold">
                  D
                </div>
                <div className="text-[7px] uppercase tracking-wider text-white/70 font-mono">
                  {previewMode === 'desktop' ? 'Works · About' : '☰'}
                </div>
              </div>

              {/* Bottom scroll indicator */}
              <div className="absolute bottom-2 inset-x-0 flex flex-col items-center pointer-events-none z-10">
                <span className="text-[7px] uppercase tracking-[0.3em] font-mono text-white/80">
                  {formData.scrollText || 'SCROLL'}
                </span>
                <div className="w-[1px] h-3 bg-white/40 mt-1" />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-600 font-mono">
              <div className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Responsive Viewport Fill</span>
              </div>
              <span>{formData.assets.length} Assets Loaded</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroCmsPage;
