import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Check,
  Trash2,
  Camera,
  Package,
  Loader2,
} from 'lucide-react';
import { useProductShot, useProductMutations } from '../../hooks/usePortfolioQueries';
import { MediaUploader } from '../../components/forms/MediaUploader';
import { DbProductShot, ProjectStatus } from '../../types/database';
import { useConfirm, useToast } from '../../context/AdminUIContext';

interface ProductEditPageProps {
  productId: string | null;
  onBack: () => void;
  onViewPublicProducts?: () => void;
}

export const ProductEditPage: React.FC<ProductEditPageProps> = ({
  productId,
  onBack,
  onViewPublicProducts,
}) => {
  const toast = useToast();
  const { confirm } = useConfirm();
  const isNew = !productId || productId === 'new';
  const { data: existingProduct, isLoading: isProductLoading } = useProductShot(isNew ? null : productId);
  const { createProduct, updateProduct, deleteProduct } = useProductMutations();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Still Life');
  const [url, setUrl] = useState('/assets/gideon_boadi_portrait.png');
  const [fallbackUrl, setFallbackUrl] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'portrait' | 'tall' | 'square' | 'landscape' | 'wide'>('portrait');
  const [clientOrBrand, setClientOrBrand] = useState('Brand Partner');
  const [tag, setTag] = useState('Product Shot');
  const [caption, setCaption] = useState('');
  const [camera, setCamera] = useState('Phase One IQ4 150MP');
  const [lens, setLens] = useState('Schneider Kreuznach 120mm Macro');
  const [iso, setIso] = useState('ISO 50');
  const [shutter, setShutter] = useState('1/160s f/11');
  const [status, setStatus] = useState<ProjectStatus>('published');
  const [featured, setFeatured] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (existingProduct) {
      setTitle(existingProduct.title || '');
      setCategory(existingProduct.category || 'Still Life');
      setUrl(existingProduct.url || '/assets/gideon_boadi_portrait.png');
      setFallbackUrl(existingProduct.fallback_url || '');
      setAspectRatio((existingProduct.aspect_ratio as any) || 'portrait');
      setClientOrBrand(existingProduct.client_or_brand || '');
      setTag(existingProduct.tag || '');
      setCaption(existingProduct.caption || '');
      setCamera(existingProduct.camera || '');
      setLens(existingProduct.lens || '');
      setIso(existingProduct.iso || '');
      setShutter(existingProduct.shutter || '');
      setStatus(existingProduct.status || 'published');
      setFeatured(existingProduct.featured ?? false);
    }
  }, [existingProduct]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please enter a title for this product.');
      return;
    }
    if (!url.trim()) {
      setErrorMessage('Please provide an image URL or upload an image.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const payload: Partial<DbProductShot> = {
        title,
        category,
        url,
        fallback_url: fallbackUrl || null,
        aspect_ratio: aspectRatio,
        client_or_brand: clientOrBrand || null,
        tag: tag || null,
        caption: caption || null,
        camera: camera || null,
        lens: lens || null,
        iso: iso || null,
        shutter: shutter || null,
        status,
        featured,
      };

      if (isNew) {
        await createProduct.mutateAsync(payload);
        toast.success(`Product "${title}" created successfully.`, 'PRODUCT CREATED');
      } else if (productId) {
        await updateProduct.mutateAsync({ id: productId, updates: payload });
        toast.success(`Product "${title}" saved successfully.`, 'PRODUCT SAVED');
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onBack();
      }, 700);
    } catch (err: any) {
      const errText = err.message || 'Failed to save product.';
      setErrorMessage(errText);
      toast.error(errText, 'SAVE ERROR');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!productId || isNew) return;
    const ok = await confirm({
      title: 'DELETE PRODUCT',
      subtitle: 'CONFIRMATION REQUIRED',
      message: `Are you sure you want to permanently delete "${title}"? This cannot be undone.`,
      confirmText: 'DELETE PERMANENTLY',
      cancelText: 'CANCEL',
      variant: 'danger',
    });

    if (ok) {
      try {
        await deleteProduct.mutateAsync(productId);
        toast.success(`"${title}" was permanently removed.`, 'PRODUCT DELETED');
        onBack();
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete product.', 'DELETE ERROR');
      }
    }
  };

  if (!isNew && isProductLoading) {
    return (
      <div className="py-24 text-center text-xs text-neutral-400 font-mono">
        Loading product details...
      </div>
    );
  }

  const aspectClass =
    aspectRatio === 'tall'
      ? 'aspect-[2/3]'
      : aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'landscape'
      ? 'aspect-[4/3]'
      : aspectRatio === 'wide'
      ? 'aspect-[16/9]'
      : 'aspect-[3/4]';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-950 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </button>

        <div className="flex items-center gap-2">
          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-2 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition"
              title="Delete Product"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition disabled:opacity-50 shadow-sm"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saveSuccess ? 'Saved' : isNew ? 'Create Product' : 'Save Changes'}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-neutral-950 uppercase tracking-wider">
              Product Information
            </h3>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Product Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sculpted Hydration Serum, Amber Noir"
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 font-medium"
                >
                  <option value="Still Life">Still Life</option>
                  <option value="Skincare">Skincare</option>
                  <option value="Cosmetics">Cosmetics</option>
                  <option value="Fragrance">Fragrance</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Luxury Goods">Luxury Goods</option>
                  <option value="Packaging">Packaging</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Brand or Client
                </label>
                <input
                  type="text"
                  value={clientOrBrand}
                  onChange={(e) => setClientOrBrand(e.target.value)}
                  placeholder="e.g. Prada Beauty, Dermalogica, bareMinerals"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Tag / Plate Description
                </label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="e.g. Still Life, Fluid Motion, Texture Macro"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Aspect Ratio</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 font-medium capitalize"
                >
                  <option value="portrait">Portrait (3:4)</option>
                  <option value="tall">Tall (2:3)</option>
                  <option value="square">Square (1:1)</option>
                  <option value="landscape">Landscape (4:3)</option>
                  <option value="wide">Wide (16:9)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Caption / Narrative</label>
              <textarea
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Product narrative, material lighting, composition notes..."
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white"
              />
            </div>
          </div>

          {/* Media & Image Upload */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-neutral-950 uppercase tracking-wider">
              Product Photograph Asset
            </h3>

            <MediaUploader
              label="Upload Product Photograph"
              currentUrl={url}
              onUploadComplete={(newUrl) => setUrl(newUrl)}
              accept="image/*"
            />

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Direct Image URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://... or /assets/..."
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Fallback URL (Optional)
              </label>
              <input
                type="text"
                value={fallbackUrl}
                onChange={(e) => setFallbackUrl(e.target.value)}
                placeholder="https://... fallback"
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white font-mono"
              />
            </div>
          </div>

          {/* Technical Metadata (EXIF) */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-neutral-950 uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-neutral-400" /> Technical Data & EXIF
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Camera Body</label>
                <input
                  type="text"
                  value={camera}
                  onChange={(e) => setCamera(e.target.value)}
                  placeholder="e.g. Phase One IQ4 150MP"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Lens</label>
                <input
                  type="text"
                  value={lens}
                  onChange={(e) => setLens(e.target.value)}
                  placeholder="e.g. Schneider Kreuznach 120mm Macro"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">ISO</label>
                <input
                  type="text"
                  value={iso}
                  onChange={(e) => setIso(e.target.value)}
                  placeholder="e.g. ISO 50"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Shutter / Aperture</label>
                <input
                  type="text"
                  value={shutter}
                  onChange={(e) => setShutter(e.target.value)}
                  placeholder="e.g. 1/160s f/11"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Publishing & Live Preview */}
        <div className="space-y-6">
          {/* Status & Visibility Card */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-neutral-950 uppercase tracking-wider">
              Publishing Status
            </h3>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className={`w-full text-xs font-medium px-3 py-2 rounded-lg border focus:outline-none ${
                  status === 'published'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : status === 'draft'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                }`}
              >
                <option value="published">Published (Visible on Live Site)</option>
                <option value="draft">Draft (Hidden from Live Site)</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="pt-2 border-t border-neutral-100">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-700 font-medium">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                Mark as Featured Product
              </label>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-neutral-950 uppercase tracking-wider">
              Live Preview
            </h3>
            <p className="text-[11px] text-neutral-500">
              How this product appears in the public gallery.
            </p>

            <div className="bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800">
              <div className={`relative w-full ${aspectClass} overflow-hidden bg-neutral-950`}>
                <img
                  src={url || '/assets/gideon_boadi_portrait.png'}
                  alt={title || 'Preview'}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-3 bg-neutral-900 text-white">
                <p className="text-xs font-semibold truncate">{title || 'Untitled Product'}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                  {clientOrBrand || 'Brand Partner'} {tag ? `• ${tag}` : ''}
                </p>
                {camera && (
                  <p className="text-[10px] text-neutral-500 font-mono mt-1 truncate">
                    {camera} {lens ? `• ${lens}` : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
