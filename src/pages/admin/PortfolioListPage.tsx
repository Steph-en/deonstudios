import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Star,
  Copy,
  Trash2,
  Edit,
  Eye,
  Camera,
  ExternalLink,
  Sparkles,
  Loader2,
  GripVertical,
  List,
  LayoutGrid,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQueryClient } from '@tanstack/react-query';
import { usePortfolioShots, usePortfolioMutations } from '../../hooks/usePortfolioQueries';
import { PortfolioService } from '../../features/portfolio/services/portfolioService';
import { DbPortfolioShot, ProjectStatus } from '../../types/database';
import { useConfirm, useToast } from '../../context/AdminUIContext';
import { BulkActionBar } from '../../components/admin/BulkActionBar';

interface SortableShotCardProps {
  shot: DbPortfolioShot;
  index: number;
  onEdit: () => void;
  onPreview: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

const SortableShotCard: React.FC<SortableShotCardProps> = ({
  shot,
  index,
  onEdit,
  onPreview,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: shot.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white border rounded-xl overflow-hidden shadow-xs transition-all ${
        isDragging
          ? 'border-neutral-950 ring-2 ring-neutral-950/20 shadow-xl scale-[1.02]'
          : 'border-neutral-200 hover:border-neutral-400'
      }`}
    >
      <div className="relative aspect-[3/4] bg-neutral-900 overflow-hidden flex items-center justify-center">
        {shot.url ? (
          <img
            src={shot.url}
            alt={shot.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="text-[10px] font-mono text-neutral-500 uppercase">No image</span>
        )}
        {/* Drag handle & Step order buttons */}
        <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
          <div
            {...attributes}
            {...listeners}
            className="p-1.5 rounded-md bg-black/80 text-white cursor-grab active:cursor-grabbing hover:bg-black transition backdrop-blur-xs shadow-md"
            title="Drag to rearrange order"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          {onMoveUp && !isFirst && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              className="p-1 rounded-md bg-black/80 text-white hover:bg-neutral-800 transition shadow-md cursor-pointer"
              title="Move up in order"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          )}
          {onMoveDown && !isLast && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              className="p-1 rounded-md bg-black/80 text-white hover:bg-neutral-800 transition shadow-md cursor-pointer"
              title="Move down in order"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {/* Order badge */}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-black/80 text-white backdrop-blur-xs shadow-sm">
          #{index + 1}
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-1 mb-1">
          <h4 className="text-xs font-semibold text-neutral-900 truncate" title={shot.title}>
            {shot.title}
          </h4>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
              shot.status === 'published'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            {shot.status}
          </span>
        </div>
        <p className="text-[11px] text-neutral-500 truncate">{shot.category || 'Portraiture'}</p>
        <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onEdit}
            className="text-[11px] font-medium text-neutral-700 hover:text-black flex items-center gap-1 cursor-pointer"
          >
            <Edit className="w-3 h-3" /> Edit
          </button>
          <button
            type="button"
            onClick={onPreview}
            className="text-[11px] font-medium text-neutral-500 hover:text-neutral-800 flex items-center gap-1 cursor-pointer"
          >
            <Eye className="w-3 h-3" /> View
          </button>
        </div>
      </div>
    </div>
  );
};

interface PortfolioListPageProps {
  onEditShot: (id: string) => void;
  onNewShot: () => void;
  onViewPublicPortfolio?: () => void;
}

export const PortfolioListPage: React.FC<PortfolioListPageProps> = ({
  onEditShot,
  onNewShot,
  onViewPublicPortfolio,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [previewShot, setPreviewShot] = useState<DbPortfolioShot | null>(null);

  const queryClient = useQueryClient();

  const { data: shots, isLoading } = usePortfolioShots({
    status: statusFilter,
    category: categoryFilter,
    search: search || undefined,
  });

  const {
    updateShot,
    deleteShot,
    duplicateShot,
    deleteMultipleShots,
    updateMultipleShotsStatus,
    updateMultipleShotsFeatured,
    reorderShots,
  } = usePortfolioMutations();
  const toast = useToast();
  const { confirm } = useConfirm();

  const [viewMode, setViewMode] = useState<'table' | 'reorder'>('table');
  const [itemsList, setItemsList] = useState<DbPortfolioShot[]>([]);

  useEffect(() => {
    if (shots) {
      setItemsList(shots);
    }
  }, [shots]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = itemsList.findIndex((i) => i.id === active.id);
      const newIndex = itemsList.findIndex((i) => i.id === over.id);
      const newOrder: DbPortfolioShot[] = arrayMove(itemsList, oldIndex, newIndex);
      setItemsList(newOrder);

      const payload = newOrder.map((item: DbPortfolioShot, idx) => ({
        id: item.id,
        display_order: idx + 1,
      }));

      try {
        await reorderShots.mutateAsync(payload);
        toast.success('Portraits reordered successfully and updated live on site.', 'ORDER SAVED');
      } catch (err: any) {
        toast.error(err.message || 'Failed to persist order', 'REORDER ERROR');
      }
    }
  };

  const handleMoveStep = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= itemsList.length) return;
    const newOrder: DbPortfolioShot[] = arrayMove(itemsList, fromIndex, toIndex);
    setItemsList(newOrder);

    const payload = newOrder.map((item: DbPortfolioShot, idx) => ({
      id: item.id,
      display_order: idx + 1,
    }));

    try {
      await reorderShots.mutateAsync(payload);
      toast.success('Portraits reordered successfully and updated live on site.', 'ORDER SAVED');
    } catch (err: any) {
      toast.error(err.message || 'Failed to persist order', 'REORDER ERROR');
    }
  };

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Selection helpers
  const allShotIds = (shots || []).map((s) => s.id);
  const isAllSelected = allShotIds.length > 0 && allShotIds.every((id) => selectedIds.includes(id));
  const isPartiallySelected = selectedIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allShotIds);
    }
  };

  const handleToggleSelectOne = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    const ok = await confirm({
      title: 'DELETE PORTFOLIO SHOTS',
      subtitle: 'CONFIRMATION REQUIRED',
      message: `Are you sure you want to permanently delete ${count} selected portrait${count > 1 ? 's' : ''}? This cannot be undone.`,
      confirmText: `DELETE ${count} PORTRAIT${count > 1 ? 'S' : ''}`,
      cancelText: 'CANCEL',
      variant: 'danger',
    });

    if (ok) {
      try {
        setIsBulkDeleting(true);
        await deleteMultipleShots.mutateAsync(selectedIds);
        setSelectedIds([]);
        toast.success(`Successfully deleted ${count} portrait shot${count > 1 ? 's' : ''}.`, 'PORTFOLIO DELETED');
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete selected shots', 'DELETE ERROR');
      } finally {
        setIsBulkDeleting(false);
      }
    }
  };

  const handleBulkStatus = async (status: ProjectStatus) => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    try {
      await updateMultipleShotsStatus.mutateAsync({ ids: selectedIds, status });
      toast.success(
        `Updated ${count} portrait${count > 1 ? 's' : ''} to "${status}".`,
        'STATUS UPDATED'
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status', 'UPDATE ERROR');
    }
  };

  const handleBulkFeatured = async (featured: boolean) => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    try {
      await updateMultipleShotsFeatured.mutateAsync({ ids: selectedIds, featured });
      toast.success(
        `${featured ? 'Featured' : 'Unfeatured'} ${count} portrait${count > 1 ? 's' : ''}.`,
        'FEATURED UPDATED'
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to update featured flag', 'UPDATE ERROR');
    }
  };

  // Extract unique categories
  const allCategories = ['All', 'Portraiture', 'Editorial', 'Fashion', 'Fine Art', 'Campaign'];

  const handleToggleFeatured = async (s: DbPortfolioShot) => {
    try {
      await updateShot.mutateAsync({
        id: s.id,
        updates: { featured: !s.featured },
      });
      toast.success(
        !s.featured ? `"${s.title}" is now highlighted in portfolio.` : `"${s.title}" removed from featured.`,
        'PORTFOLIO UPDATED'
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to update featured flag', 'UPDATE ERROR');
    }
  };

  const handleStatusChange = async (s: DbPortfolioShot, newStatus: ProjectStatus) => {
    try {
      await updateShot.mutateAsync({
        id: s.id,
        updates: { status: newStatus },
      });
      toast.success(`"${s.title}" status changed to ${newStatus}.`, 'STATUS UPDATED');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status', 'STATUS ERROR');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateShot.mutateAsync(id);
      toast.success('Portrait shot duplicate created successfully.', 'SHOT DUPLICATED');
    } catch (err: any) {
      toast.error(err.message || 'Failed to duplicate shot', 'DUPLICATE ERROR');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    const ok = await confirm({
      title: 'DELETE PORTFOLIO SHOT',
      subtitle: 'CONFIRMATION REQUIRED',
      message: `Are you sure you want to delete "${title}" permanently? This cannot be undone.`,
      confirmText: 'DELETE PERMANENTLY',
      cancelText: 'CANCEL',
      variant: 'danger',
    });
    if (ok) {
      try {
        await deleteShot.mutateAsync(id);
        toast.success(`"${title}" was permanently removed from portfolio.`, 'SHOT DELETED');
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete shot', 'DELETE ERROR');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-serif text-neutral-950 font-normal">Portfolio Directory</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Manage, publish, duplicate, and curate portraits and single editorial.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onViewPublicPortfolio && (
            <button
              type="button"
              onClick={onViewPublicPortfolio}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-neutral-200 text-neutral-700 bg-white hover:bg-neutral-50 text-xs font-medium transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" /> View on Live Site
            </button>
          )}
          <button
            type="button"
            onClick={onNewShot}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Portrait
          </button>
        </div>
      </div>

      {/* Filter, Search, and View Mode Switcher */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-neutral-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search portraits by title, client, caption, camera..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher: Table vs Drag & Drop Reorder */}
          <div className="flex items-center p-0.5 bg-neutral-100 rounded-lg border border-neutral-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-neutral-950 font-semibold shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
              title="View full table list"
            >
              <List className="w-3.5 h-3.5" />
              <span>Table View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('reorder')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                viewMode === 'reorder'
                  ? 'bg-white text-neutral-950 font-semibold shadow-xs ring-1 ring-neutral-950/10'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
              title="Drag and drop to rearrange order live"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Drag &amp; Drop Reorder</span>
            </button>
          </div>

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

      {/* Portfolio Content: Reorder Grid or Table */}
      {viewMode === 'reorder' ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-neutral-700" />
                Drag &amp; Drop Image Order
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Drag cards or use the up/down buttons to rearrange the live portfolio presentation. New order updates instantly on the live site.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-md">
                {itemsList.length} total portraits
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-xs text-neutral-400 font-mono">
              Loading portraits...
            </div>
          ) : itemsList.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <p className="text-sm font-medium text-neutral-800">No portraits to reorder</p>
              <p className="text-xs text-neutral-500">Create new portraits first to arrange their order.</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={itemsList.map((i) => i.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {itemsList.map((shot, idx) => (
                    <SortableShotCard
                      key={shot.id}
                      shot={shot}
                      index={idx}
                      onEdit={() => onEditShot(shot.id)}
                      onPreview={() => setPreviewShot(shot)}
                      onMoveUp={() => handleMoveStep(idx, idx - 1)}
                      onMoveDown={() => handleMoveStep(idx, idx + 1)}
                      isFirst={idx === 0}
                      isLast={idx === itemsList.length - 1}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      ) : (
        /* Portfolio Table */
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-neutral-400 font-mono">
              Loading portraits...
            </div>
          ) : !shots || shots.length === 0 ? (
            <div className="py-20 text-center space-y-4 px-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-neutral-800">
                  {search || categoryFilter !== 'All' || statusFilter !== 'all'
                    ? 'No portraits match your filter'
                    : 'No portraits in directory'}
                </p>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                {search || categoryFilter !== 'All' || statusFilter !== 'all'
                  ? 'Try adjusting your search criteria or reset filters.'
                  : 'Your studio collection currently has no portrait works. You can create a new work or populate sample studio works.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onNewShot}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 text-white rounded-lg text-xs font-medium hover:bg-neutral-800 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                New Portrait
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isPartiallySelected;
                      }}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                      title={isAllSelected ? 'Deselect all' : 'Select all'}
                    />
                  </th>
                  <th className="py-3 px-3">Assets</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Featured</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {shots.map((s) => {
                  const isSelected = selectedIds.includes(s.id);
                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-neutral-50/80 transition group ${
                        isSelected ? 'bg-neutral-900/[0.03]' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center w-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelectOne(s.id, e)}
                          className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                        />
                      </td>

                      {/* Thumbnail */}
                      <td className="py-3 px-3 w-16">
                        <button
                          type="button"
                          onClick={() => setPreviewShot(s)}
                          className="w-12 h-14 bg-neutral-900 rounded overflow-hidden flex-shrink-0 border border-neutral-200 block relative group/thumb cursor-zoom-in"
                          title="Preview full shot"
                        >
                          {s.url ? (
                            <img
                              src={s.url}
                              alt={s.title}
                              className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-mono text-[9px] text-neutral-500">
                              N/A
                            </div>
                          )}
                        </button>
                      </td>

                      {/* Title */}
                      <td className="py-3 px-4 min-w-[200px]">
                        <button
                          type="button"
                          onClick={() => onEditShot(s.id)}
                          className="font-semibold text-neutral-900 hover:underline text-left block truncate max-w-xs"
                        >
                          {s.title}
                        </button>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-[11px] font-medium border border-neutral-200">
                          {s.category || 'Portraiture'}
                        </span>
                      </td>

                      {/* Status Selector */}
                      <td className="py-3 px-4">
                        <select
                          value={s.status}
                          onChange={(e) => handleStatusChange(s, e.target.value as ProjectStatus)}
                          className={`text-[11px] font-medium px-2 py-1 rounded-md border focus:outline-none ${
                            s.status === 'published'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : s.status === 'draft'
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
                          onClick={() => handleToggleFeatured(s)}
                          className={`p-1 rounded transition ${
                            s.featured
                              ? 'text-amber-500 hover:text-amber-600'
                              : 'text-neutral-300 hover:text-neutral-500'
                          }`}
                          title={s.featured ? 'Remove from Featured' : 'Mark as Featured'}
                        >
                          <Star className={`w-4 h-4 ${s.featured ? 'fill-amber-400' : ''}`} />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onEditShot(s.id)}
                            className="p-1.5 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition"
                            title="Edit Portrait"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDuplicate(s.id)}
                            className="p-1.5 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition"
                            title="Duplicate Portrait"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(s.id, s.title)}
                            className="p-1.5 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete Portrait"
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
      )}

      {/* Quick Modal Preview */}
      {previewShot && (
        <div
          className="fixed inset-0 z-50 bg-neutral-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewShot(null)}
        >
          <div
            className="max-w-xl w-full bg-white text-neutral-900 rounded-2xl overflow-hidden border border-neutral-200 shadow-2xl ring-1 ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[3/4] max-h-[70vh] bg-neutral-100">
              {previewShot.url ? (
                <img
                  src={previewShot.url}
                  alt={previewShot.title}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : null}
            </div>
            <div className="p-4 flex items-center justify-between border-t border-neutral-100 bg-white">
              <div>
                <h4 className="text-sm font-semibold text-neutral-900">{previewShot.title}</h4>
                <p className="text-xs text-neutral-500">
                  {previewShot.client_or_brand || 'Studio Portrait'} • {previewShot.category}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewShot(null)}
                className="text-xs px-3.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-medium transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={shots?.length || 0}
        onClearSelection={() => setSelectedIds([])}
        onSelectAll={handleToggleSelectAll}
        onDelete={handleBulkDelete}
        isDeleting={isBulkDeleting}
        entityName="portraits"
        customActions={
          <>
            {/* Quick Status Dropdown */}
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkStatus(e.target.value as ProjectStatus);
                  e.target.value = '';
                }
              }}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-800 focus:outline-none focus:border-neutral-900 transition cursor-pointer font-medium"
            >
              <option value="" disabled>
                Set Status...
              </option>
              <option value="published">Publish Selected</option>
              <option value="draft">Set to Draft</option>
              <option value="archived">Archive Selected</option>
            </select>

            {/* Quick Feature Toggle */}
            <button
              type="button"
              onClick={() => handleBulkFeatured(true)}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-800 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
              title="Feature selected portraits"
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span className="hidden sm:inline">Feature</span>
            </button>
          </>
        }
      />
    </div>
  );
};
