import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Check,
  Trash2,
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
        title: title.trim(),
        category: category.trim(),
        url: url.trim(),
        status,
        featured,
        aspect_ratio: 'portrait',
        client_or_brand: null,
        tag: null,
        caption: null,
        camera: null,
        lens: null,
        iso: null,
        shutter: null,
        fallback_url: null,
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
      }, 1000);
    } catch (err: any) {
      console.error('Error saving product shot:', err);
      setErrorMessage(err.message || 'Failed to save product. Please check your inputs.');
      toast.error(err.message || 'Failed to save product.', 'SAVE ERROR');
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-950 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </button>

        <div className="flex items-center gap-2">
          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
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
        {/* Left 2 Cols: Simplified Single Image Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photograph Upload Asset */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-neutral-950 uppercase tracking-wider">
              Product Photograph Asset
            </h3>

            <MediaUploader
              label="Upload Product Photograph"
              currentUrl={url}
              onUploadComplete={(res: any) => setUrl(typeof res === 'string' ? res : res?.url || '')}
              accept="image"
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
          </div>

          {/* Core Info (Title & Category Only) */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-neutral-950 uppercase tracking-wider">
              Product Information
            </h3>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sculpted Hydration Serum, Amber Noir"
                className="w-full text-xs px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 font-medium"
              >
                <option value="Still Life">Still Life</option>
                <option value="Skincare">Skincare</option>
                <option value="Cosmetics">Cosmetics</option>
                <option value="Fragrance">Fragrance</option>
                <option value="Accessories">Accessories</option>
                <option value="Luxury Goods">Luxury Goods</option>
                <option value="Commercial">Commercial</option>
                <option value="Packaging">Packaging</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Publishing Status & Live Preview */}
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
              <div className="relative w-full aspect-[3/4] overflow-hidden bg-neutral-950">
                <img
                  src={url || '/assets/gideon_boadi_portrait.png'}
                  alt={title || 'Preview'}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-3 bg-neutral-900 text-white">
                <p className="text-xs font-semibold truncate">{title || 'Untitled Product'}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5 truncate">{category}</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
