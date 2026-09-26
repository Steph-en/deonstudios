import React, { useState } from 'react';
import {
  Search,
  Plus,
  Star,
  Copy,
  Trash2,
  Edit,
  Eye,
  Package,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useProductShots, useProductMutations } from '../../hooks/usePortfolioQueries';
import { ProductService } from '../../features/products/services/productService';
import { DbProductShot, ProjectStatus } from '../../types/database';
import { useConfirm, useToast } from '../../context/AdminUIContext';

interface ProductListPageProps {
  onEditProduct: (id: string) => void;
  onNewProduct: () => void;
  onViewPublicProducts?: () => void;
}

export const ProductListPage: React.FC<ProductListPageProps> = ({
  onEditProduct,
  onNewProduct,
  onViewPublicProducts,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [previewProduct, setPreviewProduct] = useState<DbProductShot | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const queryClient = useQueryClient();

  const { data: products, isLoading } = useProductShots({
    status: statusFilter,
    category: categoryFilter,
    search: search || undefined,
  });

  const { updateProduct, deleteProduct, duplicateProduct } = useProductMutations();
  const toast = useToast();
  const { confirm } = useConfirm();

  const allCategories = [
    'All',
    'Still Life',
    'Skincare',
    'Cosmetics',
    'Fragrance',
    'Accessories',
    'Luxury Goods',
    'Packaging',
  ];

  const handleToggleFeatured = async (p: DbProductShot) => {
    try {
      await updateProduct.mutateAsync({
        id: p.id,
        updates: { featured: !p.featured },
      });
      toast.success(
        !p.featured ? `"${p.title}" is now highlighted in products.` : `"${p.title}" removed from featured.`,
        'PRODUCTS UPDATED'
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to update featured flag', 'UPDATE ERROR');
    }
  };

  const handleStatusChange = async (p: DbProductShot, newStatus: ProjectStatus) => {
    try {
      await updateProduct.mutateAsync({
        id: p.id,
        updates: { status: newStatus },
      });
      toast.success(`"${p.title}" status changed to ${newStatus}.`, 'STATUS UPDATED');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status', 'STATUS ERROR');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateProduct.mutateAsync(id);
      toast.success('Product duplicate created successfully.', 'PRODUCT DUPLICATED');
    } catch (err: any) {
      toast.error(err.message || 'Failed to duplicate product', 'DUPLICATE ERROR');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    const ok = await confirm({
      title: 'DELETE PRODUCT',
      subtitle: 'CONFIRMATION REQUIRED',
      message: `Are you sure you want to delete "${title}" permanently? This cannot be undone.`,
      confirmText: 'DELETE PERMANENTLY',
      cancelText: 'CANCEL',
      variant: 'danger',
    });
    if (ok) {
      try {
        await deleteProduct.mutateAsync(id);
        toast.success(`"${title}" was permanently removed from products.`, 'PRODUCT DELETED');
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete product', 'DELETE ERROR');
      }
    }
  };

  const handleSeedProducts = async () => {
    try {
      setIsSeeding(true);
      await ProductService.seedProductsToDatabase();
      await queryClient.invalidateQueries({ queryKey: ['product-shots'] });
      await queryClient.refetchQueries({ queryKey: ['product-shots'] });
      toast.success('Sample commercial products restored successfully.', 'PRODUCTS SEEDED');
    } catch (err: any) {
      toast.error(err.message || 'Failed to seed sample product shots', 'SEED ERROR');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-serif text-neutral-950 font-normal">Products Directory</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Manage, publish, duplicate, and curate commercial product photography and still life works.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {(!products || products.length === 0) && (
            <button
              type="button"
              onClick={handleSeedProducts}
              disabled={isSeeding}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-700 text-xs font-medium hover:bg-neutral-50 transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSeeding ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-500" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-neutral-500" />
              )}
              Seed 3 Sample Products
            </button>
          )}

          {onViewPublicProducts && (
            <button
              type="button"
              onClick={onViewPublicProducts}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-neutral-200 text-neutral-700 bg-white hover:bg-neutral-50 text-xs font-medium transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" /> View on Live Site
            </button>
          )}
          <button
            type="button"
            onClick={onNewProduct}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Product
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 rounded-xl border border-neutral-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by brand, title, category, caption..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs px-2.5 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-700 focus:outline-none focus:border-neutral-900 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-2.5 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-700 focus:outline-none focus:border-neutral-900 font-medium"
          >
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-neutral-400 font-mono">
            Loading products...
          </div>
        ) : !products || products.length === 0 ? (
          <div className="py-20 text-center space-y-4 px-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-neutral-800">
                {search || categoryFilter !== 'All' || statusFilter !== 'all'
                  ? 'No products match your filter'
                  : 'No products in directory'}
              </p>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                {search || categoryFilter !== 'All' || statusFilter !== 'all'
                  ? 'Try adjusting your search criteria or reset filters.'
                  : 'Your studio catalogue currently has no commercial product works. You can create a new work or populate sample studio works.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSeedProducts}
                disabled={isSeeding}
                className="inline-flex items-center gap-2 px-3.5 py-2 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition cursor-pointer disabled:opacity-50"
              >
                {isSeeding ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-500" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-neutral-500" />
                )}
                Seed 3 Sample Products
              </button>
              <button
                type="button"
                onClick={onNewProduct}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 text-white rounded-lg text-xs font-medium hover:bg-neutral-800 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                New Product
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                  <th className="py-3 px-4">Plate</th>
                  <th className="py-3 px-4">Product & Brand</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Aspect Ratio</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Featured</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {products.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/80 transition group">
                      {/* Thumbnail */}
                      <td className="py-3 px-4 w-16">
                        <button
                          type="button"
                          onClick={() => setPreviewProduct(p)}
                          className="w-12 h-14 bg-neutral-900 rounded overflow-hidden flex-shrink-0 border border-neutral-200 block relative group/thumb cursor-zoom-in"
                          title="Preview product"
                        >
                          <img
                            src={p.url}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      </td>

                      {/* Title & Brand */}
                      <td className="py-3 px-4 min-w-[200px]">
                        <button
                          type="button"
                          onClick={() => onEditProduct(p.id)}
                          className="font-semibold text-neutral-900 hover:underline text-left block truncate max-w-xs"
                        >
                          {p.title}
                        </button>
                        <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                          <span>{p.client_or_brand || 'Brand Partner'}</span>
                          {p.tag && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-neutral-400">{p.tag}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-[11px] font-medium border border-neutral-200">
                          {p.category || 'Still Life'}
                        </span>
                      </td>

                      {/* Aspect Ratio Badge */}
                      <td className="py-3 px-4 font-mono text-[11px] text-neutral-500 capitalize">
                        {p.aspect_ratio || 'portrait'}
                      </td>

                      {/* Status Selector */}
                      <td className="py-3 px-4">
                        <select
                          value={p.status}
                          onChange={(e) => handleStatusChange(p, e.target.value as ProjectStatus)}
                          className={`text-[11px] font-medium px-2 py-1 rounded-md border focus:outline-none ${
                            p.status === 'published'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : p.status === 'draft'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                          }`}
                        >
                          <option value="published">Published</option>
                          <option value="draft">Draft</option>
                          <option value="archived">Archived</option>
                        </select>
                      </td>

                      {/* Featured toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(p)}
                          className={`p-1 rounded transition ${
                            p.featured
                              ? 'text-amber-500 hover:text-amber-600'
                              : 'text-neutral-300 hover:text-neutral-500'
                          }`}
                          title={p.featured ? 'Remove from Featured' : 'Mark as Featured'}
                        >
                          <Star className={`w-4 h-4 ${p.featured ? 'fill-amber-400' : ''}`} />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onEditProduct(p.id)}
                            className="p-1.5 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition"
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDuplicate(p.id)}
                            className="p-1.5 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition"
                            title="Duplicate Product"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.title)}
                            className="p-1.5 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Modal Preview */}
      {previewProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewProduct(null)}
        >
          <div
            className="max-w-xl w-full bg-neutral-950 text-white rounded-xl overflow-hidden border border-neutral-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[3/4] max-h-[70vh] bg-black">
              <img
                src={previewProduct.url}
                alt={previewProduct.title}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-4 flex items-center justify-between border-t border-neutral-800">
              <div>
                <h4 className="text-sm font-semibold">{previewProduct.title}</h4>
                <p className="text-xs text-neutral-400">
                  {previewProduct.client_or_brand || 'Brand Partner'} • {previewProduct.category}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewProduct(null)}
                className="text-xs px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
