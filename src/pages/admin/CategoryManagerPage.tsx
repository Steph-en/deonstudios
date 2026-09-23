import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Tag, Plus, Edit2, Trash2, Check, X, AlertCircle, Layers } from 'lucide-react';
import { useCategories } from '../../hooks/usePortfolioQueries';
import { CategoryService } from '../../features/categories/services/categoryService';
import { DbCategory } from '../../types/database';
import { slugify } from '../../lib/utils';

export const CategoryManagerPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useCategories();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#d4d4d4');
  const [error, setError] = useState<string | null>(null);

  const handleStartCreate = () => {
    setName('');
    setSlug('');
    setDescription('');
    setColor('#d4d4d4');
    setError(null);
    setEditingId(null);
    setIsCreating(true);
  };

  const handleStartEdit = (cat: DbCategory) => {
    setIsCreating(false);
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setColor(cat.color || '#d4d4d4');
    setError(null);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setError(null);
  };

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }
    const finalSlug = slug.trim() || slugify(name);

    try {
      if (isCreating) {
        await CategoryService.createCategory({
          name: name.trim(),
          slug: finalSlug,
          description: description.trim() || null,
          color,
          display_order: (categories?.length || 0) + 1,
        });
      } else if (editingId) {
        await CategoryService.updateCategory(editingId, {
          name: name.trim(),
          slug: finalSlug,
          description: description.trim() || null,
          color,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCreating(false);
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || 'Unable to save category.');
    }
  };

  const handleDelete = async (cat: DbCategory) => {
    if (confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      try {
        await CategoryService.deleteCategory(cat.id);
        await queryClient.invalidateQueries({ queryKey: ['categories'] });
      } catch (err: any) {
        alert(err.message || 'Failed to delete category');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-serif text-neutral-950 font-normal">Category Management</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Configure portfolio categories and display taxonomies.
          </p>
        </div>

        {!isCreating && !editingId && (
          <button
            type="button"
            onClick={handleStartCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        )}
      </div>

      {/* Inline Create / Edit Box */}
      {(isCreating || editingId) && (
        <div className="bg-white border border-neutral-300 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
              {isCreating ? 'Create New Category' : 'Edit Category'}
            </h3>
            <button
              type="button"
              onClick={handleCancel}
              className="p-1 text-neutral-400 hover:text-neutral-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (isCreating) setSlug(slugify(e.target.value));
                }}
                placeholder="e.g. Documentary"
                className="w-full text-sm px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Slug *
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. documentary"
                className="w-full text-sm font-mono px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of this aesthetic category..."
              className="w-full text-sm px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition"
            >
              <Check className="w-3.5 h-3.5" /> Save Category
            </button>
          </div>
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-neutral-400 font-mono">
            Loading categories...
          </div>
        ) : !categories || categories.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <Layers className="w-8 h-8 text-neutral-300 mx-auto" />
            <p className="text-sm font-medium text-neutral-800">No categories found</p>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Categories help organize your editorial projects and commercial photography.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={async () => {
                  await CategoryService.seedSampleCategories();
                  await queryClient.invalidateQueries({ queryKey: ['categories'] });
                }}
                className="px-3.5 py-2 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition cursor-pointer"
              >
                Seed Default Categories
              </button>
              <button
                type="button"
                onClick={handleStartCreate}
                className="px-3.5 py-2 bg-neutral-900 text-white rounded-lg text-xs font-medium hover:bg-neutral-800 transition cursor-pointer"
              >
                + New Category
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {(categories || []).map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-neutral-50/80 transition">
                    <td className="py-3.5 px-4 font-mono text-neutral-400">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-semibold text-neutral-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-neutral-400" />
                      {cat.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-500">{cat.slug}</td>
                    <td className="py-3.5 px-4 text-neutral-600 max-w-sm truncate">
                      {cat.description || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cat)}
                          className="p-1.5 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition"
                          title="Edit Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat)}
                          className="p-1.5 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
