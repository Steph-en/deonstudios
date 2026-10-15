import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Star,
  Copy,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  Archive,
  FileEdit,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  Sparkles,
  Loader2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ArrowUpToLine,
  List,
  LayoutGrid,
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
import { useProjects, useCategories, useProjectMutations } from '../../hooks/usePortfolioQueries';
import { ProjectService } from '../../features/projects/services/projectService';
import { DbProject, ProjectStatus } from '../../types/database';
import { useConfirm, useToast } from '../../context/AdminUIContext';
import { BulkActionBar } from '../../components/admin/BulkActionBar';
import {
  getCachedAspectRatioClass,
  detectOrientationFromClassOrString,
} from '../../utils/aspectRatioHelper';

interface ProjectListPageProps {
  onEditProject: (id: string) => void;
  onNewProject: () => void;
  onViewPublicProject: (slug: string) => void;
}

interface SortableProjectCardProps {
  project: DbProject;
  index: number;
  totalCount: number;
  onEdit: () => void;
  onPreview: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleFeatured: () => void;
  onStatusChange: (status: ProjectStatus) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onMakeFirst?: () => void;
}

const SortableProjectCard: React.FC<SortableProjectCardProps> = ({
  project,
  index,
  totalCount,
  onEdit,
  onPreview,
  onDuplicate,
  onDelete,
  onToggleFeatured,
  onStatusChange,
  onMoveUp,
  onMoveDown,
  onMakeFirst,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  const isInvalid = (url?: string | null) =>
    !url || url === '/assets/gideon_boadi_portrait.png' || url.includes('placeholder');
  const thumb =
    (!isInvalid(project.preview_image) ? project.preview_image : null) ||
    (!isInvalid(project.hero_image) ? project.hero_image : null) ||
    project.media?.[0]?.media_url ||
    '';

  const cachedAspect = thumb ? getCachedAspectRatioClass(thumb) : null;
  const orientation =
    (cachedAspect && detectOrientationFromClassOrString(cachedAspect)) ||
    (project.aspect_ratio && detectOrientationFromClassOrString(project.aspect_ratio)) ||
    'portrait';

  const isFirst = index === 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white border rounded-xl overflow-hidden shadow-xs transition-all flex flex-col justify-between ${
        isDragging
          ? 'border-neutral-950 ring-2 ring-neutral-950/20 shadow-xl scale-[1.02]'
          : isFirst
          ? 'border-neutral-900 ring-1 ring-neutral-900/10'
          : 'border-neutral-200 hover:border-neutral-400'
      }`}
    >
      <div>
        {/* Thumbnail Plate */}
        <div className="relative aspect-[16/10] bg-neutral-950 overflow-hidden flex items-center justify-center">
          {thumb ? (
            <img
              src={thumb}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-[10px] font-mono text-neutral-500 uppercase">No Cover Image</span>
          )}

          {/* Top Left: Drag Handle & Shift Controls */}
          <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
            <div
              {...attributes}
              {...listeners}
              className="p-1.5 rounded-md bg-black/80 text-white cursor-grab active:cursor-grabbing hover:bg-black transition backdrop-blur-xs shadow-md"
              title="Drag to rearrange project position"
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
                title="Shift earlier / up in order"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            )}

            {onMoveDown && index < totalCount - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown();
                }}
                className="p-1 rounded-md bg-black/80 text-white hover:bg-neutral-800 transition shadow-md cursor-pointer"
                title="Shift later / down in order"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Top Right: Order Badge & Make #1 */}
          <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
            {!isFirst && onMakeFirst && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMakeFirst();
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-black/80 text-white hover:bg-black transition shadow-sm cursor-pointer"
                title="Shift directly to position #1 (Top of Portfolio)"
              >
                <ArrowUpToLine className="w-3 h-3" />
                <span>Make #1</span>
              </button>
            )}

            <div
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-tight shadow-sm ${
                isFirst
                  ? 'bg-neutral-900 text-amber-300 border border-amber-400/40'
                  : 'bg-black/80 text-white'
              }`}
            >
              {isFirst ? '#1 First' : `#${index + 1}`}
            </div>
          </div>

          {/* Bottom Left: Orientation Badge */}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-black/75 text-neutral-200 backdrop-blur-xs flex items-center gap-1 shadow-sm">
            <span>{orientation}</span>
            {orientation === 'landscape' && isFirst && (
              <span className="text-amber-400 font-bold">• Full Width Hero</span>
            )}
          </div>

          {/* Bottom Right: Featured Star */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFeatured();
            }}
            className={`absolute bottom-2 right-2 p-1.5 rounded-md backdrop-blur-xs shadow-sm transition ${
              project.featured ? 'bg-amber-400 text-black' : 'bg-black/60 text-white hover:bg-black/80'
            }`}
            title={project.featured ? 'Featured on Homepage' : 'Pin to Featured'}
          >
            <Star className={`w-3.5 h-3.5 ${project.featured ? 'fill-black' : ''}`} />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-3.5">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4
              onClick={onEdit}
              className="text-xs font-bold text-neutral-950 truncate hover:underline cursor-pointer"
              title={project.title}
            >
              {project.title}
            </h4>
            <select
              value={project.status}
              onChange={(e) => onStatusChange(e.target.value as ProjectStatus)}
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded border focus:outline-none cursor-pointer ${
                project.status === 'published'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : project.status === 'draft'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-neutral-100 text-neutral-600 border-neutral-200'
              }`}
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 truncate">
            <span>{project.client || 'Studio Work'}</span>
            <span>•</span>
            <span className="font-mono">{project.year || '2025'}</span>
            <span>•</span>
            <span className="capitalize">{project.category?.name || 'Editorial'}</span>
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="px-3.5 py-2.5 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            className="text-[11px] font-medium text-neutral-700 hover:text-black flex items-center gap-1 cursor-pointer"
          >
            <Edit className="w-3 h-3" /> Edit
          </button>

          {project.status === 'published' && (
            <button
              type="button"
              onClick={onPreview}
              className="text-[11px] font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-1 cursor-pointer ml-1"
            >
              <Eye className="w-3 h-3" /> View
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1 rounded text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200/60 transition cursor-pointer"
            title="Duplicate Project"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
            title="Delete Project"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const ProjectListPage: React.FC<ProjectListPageProps> = ({
  onEditProject,
  onNewProject,
  onViewPublicProject,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'reorder' | 'table'>('reorder');

  const { data: projects, isLoading } = useProjects({
    status: statusFilter,
    categoryId: categoryFilter || undefined,
    search: search || undefined,
  });

  const { data: categories } = useCategories();
  const {
    updateProject,
    deleteProject,
    duplicateProject,
    deleteMultipleProjects,
    updateMultipleProjectsStatus,
    updateMultipleProjectsFeatured,
    reorderProjects,
  } = useProjectMutations();
  const toast = useToast();
  const { confirm } = useConfirm();

  const [itemsList, setItemsList] = useState<DbProject[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Sync projects list whenever data updates
  useEffect(() => {
    if (projects) {
      setItemsList(
        [...projects].sort((a, b) => {
          const orderA = a.display_order !== undefined && a.display_order !== null ? a.display_order : 9999;
          const orderB = b.display_order !== undefined && b.display_order !== null ? b.display_order : 9999;
          return orderA - orderB;
        })
      );
    }
  }, [projects]);

  // Drag and drop sensors
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
      const newOrder: DbProject[] = arrayMove(itemsList, oldIndex, newIndex);
      setItemsList(newOrder);

      const payload = newOrder.map((item: DbProject, idx: number) => ({
        id: item.id,
        display_order: idx + 1,
      }));

      try {
        await reorderProjects.mutateAsync(payload);
        toast.success(
          `Project "${newOrder[newIndex].title}" moved to position #${newIndex + 1}.`,
          'ORDER SAVED'
        );
      } catch (err: any) {
        toast.error(err.message || 'Failed to save order', 'REORDER ERROR');
      }
    }
  };

  const handleMoveStep = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= itemsList.length || fromIndex === toIndex) return;
    const newOrder: DbProject[] = arrayMove(itemsList, fromIndex, toIndex);
    setItemsList(newOrder);

    const payload = newOrder.map((item: DbProject, idx: number) => ({
      id: item.id,
      display_order: idx + 1,
    }));

    try {
      await reorderProjects.mutateAsync(payload);
      toast.success(
        `Project position shifted to #${toIndex + 1}.`,
        'ORDER SAVED'
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to persist order', 'REORDER ERROR');
    }
  };

  const handleMakeFirst = async (fromIndex: number) => {
    if (fromIndex <= 0 || fromIndex >= itemsList.length) return;
    const target = itemsList[fromIndex];
    const newOrder: DbProject[] = arrayMove(itemsList, fromIndex, 0);
    setItemsList(newOrder);

    const payload = newOrder.map((item: DbProject, idx: number) => ({
      id: item.id,
      display_order: idx + 1,
    }));

    try {
      await reorderProjects.mutateAsync(payload);
      toast.success(
        `"${target.title}" is now positioned as the #1 project!`,
        'PRIMARY PROJECT SET'
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to shift project', 'REORDER ERROR');
    }
  };

  // Selection helpers
  const allProjectIds = itemsList.map((p) => p.id);
  const isAllSelected = allProjectIds.length > 0 && allProjectIds.every((id) => selectedIds.includes(id));
  const isPartiallySelected = selectedIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allProjectIds);
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
      title: 'DELETE PROJECTS',
      subtitle: 'CONFIRMATION REQUIRED',
      message: `Are you sure you want to permanently delete ${count} selected project${count > 1 ? 's' : ''}? This cannot be undone.`,
      confirmText: `DELETE ${count} PROJECT${count > 1 ? 'S' : ''}`,
      cancelText: 'CANCEL',
      variant: 'danger',
    });

    if (ok) {
      try {
        setIsBulkDeleting(true);
        await deleteMultipleProjects.mutateAsync(selectedIds);
        setSelectedIds([]);
        toast.success(`Successfully deleted ${count} project${count > 1 ? 's' : ''}.`, 'PROJECTS DELETED');
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete selected projects', 'DELETE ERROR');
      } finally {
        setIsBulkDeleting(false);
      }
    }
  };

  const handleBulkStatus = async (status: ProjectStatus) => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    try {
      await updateMultipleProjectsStatus.mutateAsync({ ids: selectedIds, status });
      toast.success(
        `Updated ${count} project${count > 1 ? 's' : ''} to "${status}".`,
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
      await updateMultipleProjectsFeatured.mutateAsync({ ids: selectedIds, featured });
      toast.success(
        `${featured ? 'Featured' : 'Unfeatured'} ${count} project${count > 1 ? 's' : ''}.`,
        'FEATURED UPDATED'
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to update featured flag', 'UPDATE ERROR');
    }
  };

  const handleToggleFeatured = async (p: DbProject) => {
    try {
      await updateProject.mutateAsync({
        id: p.id,
        updates: { featured: !p.featured },
      });
      toast.success(
        !p.featured ? `"${p.title}" is now highlighted on the homepage.` : `"${p.title}" unpinned from featured.`,
        'FEATURED UPDATED'
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to update featured flag', 'UPDATE ERROR');
    }
  };

  const handleStatusChange = async (p: DbProject, newStatus: ProjectStatus) => {
    try {
      await updateProject.mutateAsync({
        id: p.id,
        updates: { status: newStatus },
      });
      toast.success(`"${p.title}" status changed to ${newStatus}.`, 'STATUS UPDATED');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status', 'UPDATE ERROR');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateProject.mutateAsync(id);
      toast.success('Project duplicate created successfully.', 'PROJECT DUPLICATED');
    } catch (err: any) {
      toast.error(err.message || 'Failed to duplicate project', 'DUPLICATE ERROR');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    const ok = await confirm({
      title: 'DELETE PROJECT',
      subtitle: 'CONFIRMATION REQUIRED',
      message: `Are you sure you want to delete the project "${title}" permanently? This cannot be undone.`,
      confirmText: 'DELETE PERMANENTLY',
      cancelText: 'CANCEL',
      variant: 'danger',
    });
    if (ok) {
      try {
        await deleteProject.mutateAsync(id);
        toast.success(`Project "${title}" was permanently removed.`, 'PROJECT DELETED');
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete project', 'DELETE ERROR');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-serif text-neutral-950 font-normal">Projects Directory</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Curate, rearrange, publish, and order projects for your public portfolio.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onNewProject}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Project
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
            placeholder="Search projects by title, client, or narrative..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center p-0.5 bg-neutral-100 rounded-lg border border-neutral-200">
            <button
              type="button"
              onClick={() => setViewMode('reorder')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                viewMode === 'reorder'
                  ? 'bg-white text-neutral-950 font-semibold shadow-xs ring-1 ring-neutral-950/10'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
              title="Drag and drop or shift position to rearrange projects live"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Rearrange Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-neutral-950 font-semibold shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
              title="View compact tabular list"
            >
              <List className="w-3.5 h-3.5" />
              <span>Table View</span>
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
            <option value="">All Categories</option>
            {(categories || []).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-white border border-neutral-200 rounded-xl py-16 text-center text-xs text-neutral-400 font-mono">
          Loading projects...
        </div>
      ) : itemsList.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl py-20 text-center space-y-4 px-4 shadow-sm">
          <div className="space-y-1">
            <p className="text-sm font-medium text-neutral-800">
              {search || categoryFilter || statusFilter !== 'all'
                ? 'No projects match your active filter'
                : 'No projects in directory'}
            </p>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              {search || categoryFilter || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or reset filters.'
                : 'Your studio portfolio currently has no bespoke projects. Create a new bespoke project to get started.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onNewProject}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 text-white rounded-lg text-xs font-medium hover:bg-neutral-800 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Create New Project
            </button>
          </div>
        </div>
      ) : viewMode === 'reorder' ? (
        /* 1. VISUAL DRAG & DROP REARRANGE GRID */
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-neutral-700" />
                Rearrange Projects Order ({itemsList.length} projects)
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Drag cards or click <strong className="text-neutral-700">"Make #1"</strong> / shift arrows to reposition any project. The first project appears first in your portfolio and saves automatically.
              </p>
            </div>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={itemsList.map((p) => p.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {itemsList.map((project, index) => (
                  <SortableProjectCard
                    key={project.id}
                    project={project}
                    index={index}
                    totalCount={itemsList.length}
                    onEdit={() => onEditProject(project.id)}
                    onPreview={() => onViewPublicProject(project.slug)}
                    onDuplicate={() => handleDuplicate(project.id)}
                    onDelete={() => handleDelete(project.id, project.title)}
                    onToggleFeatured={() => handleToggleFeatured(project)}
                    onStatusChange={(newStatus) => handleStatusChange(project, newStatus)}
                    onMoveUp={() => handleMoveStep(index, index - 1)}
                    onMoveDown={() => handleMoveStep(index, index + 1)}
                    onMakeFirst={() => handleMakeFirst(index)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ) : (
        /* 2. TABLE VIEW WITH ORDER COLUMN */
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
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
                  <th className="py-3 px-3 w-28 text-center">Position</th>
                  <th className="py-3 px-3">Thumbnail</th>
                  <th className="py-3 px-4">Title & Client</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Featured</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {itemsList.map((p, index) => {
                  const isInvalid = (url?: string | null) =>
                    !url || url === '/assets/gideon_boadi_portrait.png' || url.includes('placeholder');
                  const thumb =
                    (!isInvalid(p.preview_image) ? p.preview_image : null) ||
                    (!isInvalid(p.hero_image) ? p.hero_image : null) ||
                    p.media?.[0]?.media_url ||
                    '';
                  const isSelected = selectedIds.includes(p.id);
                  const isFirst = index === 0;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-neutral-50/80 transition group ${
                        isSelected ? 'bg-neutral-900/[0.03]' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center w-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelectOne(p.id, e)}
                          className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                        />
                      </td>

                      {/* Position & Shift Controls */}
                      <td className="py-3 px-3 w-28">
                        <div className="flex items-center justify-center gap-1">
                          <span
                            className={`font-mono font-bold text-[11px] px-1.5 py-0.5 rounded ${
                              isFirst
                                ? 'bg-neutral-900 text-amber-300'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            #{index + 1}
                          </span>

                          <div className="flex items-center gap-0.5">
                            {!isFirst && (
                              <button
                                type="button"
                                onClick={() => handleMoveStep(index, index - 1)}
                                className="p-1 rounded text-neutral-400 hover:text-black hover:bg-neutral-200 transition cursor-pointer"
                                title="Move up in order"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {index < itemsList.length - 1 && (
                              <button
                                type="button"
                                onClick={() => handleMoveStep(index, index + 1)}
                                className="p-1 rounded text-neutral-400 hover:text-black hover:bg-neutral-200 transition cursor-pointer"
                                title="Move down in order"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {!isFirst && (
                              <button
                                type="button"
                                onClick={() => handleMakeFirst(index)}
                                className="p-1 rounded text-neutral-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                                title="Make #1 (Show at top of portfolio)"
                              >
                                <ArrowUpToLine className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Thumbnail */}
                      <td className="py-3 px-3 w-16">
                        <div className="w-12 h-14 bg-neutral-900 rounded overflow-hidden flex-shrink-0 border border-neutral-200 flex items-center justify-center">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={p.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-[9px] font-mono text-neutral-500 uppercase">Empty</span>
                          )}
                        </div>
                      </td>

                      {/* Title & Client */}
                      <td className="py-3 px-4 min-w-[200px]">
                        <button
                          type="button"
                          onClick={() => onEditProject(p.id)}
                          className="font-semibold text-neutral-900 hover:underline text-left block truncate max-w-xs cursor-pointer"
                        >
                          {p.title}
                        </button>
                        <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                          <span>{p.client || 'Personal Project'}</span>
                          <span>•</span>
                          <span className="font-mono">{p.year || '2025'}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-[11px] font-medium border border-neutral-200">
                          {p.category?.name || 'Editorial'}
                        </span>
                      </td>

                      {/* Status Selector */}
                      <td className="py-3 px-4">
                        <select
                          value={p.status}
                          onChange={(e) => handleStatusChange(p, e.target.value as ProjectStatus)}
                          className={`text-[11px] font-medium px-2 py-1 rounded-md border focus:outline-none cursor-pointer ${
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
                          className={`p-1 rounded transition cursor-pointer ${
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
                          {p.status === 'published' && (
                            <button
                              type="button"
                              onClick={() => onViewPublicProject(p.slug)}
                              className="p-1.5 rounded text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
                              title="Preview on Public Portfolio"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onEditProject(p.id)}
                            className="p-1.5 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
                            title="Edit Project"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDuplicate(p.id)}
                            className="p-1.5 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
                            title="Duplicate Project"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.title)}
                            className="p-1.5 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Delete Project"
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
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={itemsList.length}
        onClearSelection={() => setSelectedIds([])}
        onSelectAll={handleToggleSelectAll}
        onDelete={handleBulkDelete}
        isDeleting={isBulkDeleting}
        entityName="projects"
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
              title="Feature selected projects"
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
