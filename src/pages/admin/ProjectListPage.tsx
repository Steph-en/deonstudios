import React, { useState } from 'react';
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
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useProjects, useCategories, useProjectMutations } from '../../hooks/usePortfolioQueries';
import { ProjectService } from '../../features/projects/services/projectService';
import { DbProject, ProjectStatus } from '../../types/database';

interface ProjectListPageProps {
  onEditProject: (id: string) => void;
  onNewProject: () => void;
  onViewPublicProject: (slug: string) => void;
}

export const ProjectListPage: React.FC<ProjectListPageProps> = ({
  onEditProject,
  onNewProject,
  onViewPublicProject,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [isSeeding, setIsSeeding] = useState(false);

  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useProjects({
    status: statusFilter,
    categoryId: categoryFilter || undefined,
    search: search || undefined,
  });

  const { data: categories } = useCategories();
  const { updateProject, deleteProject, duplicateProject } = useProjectMutations();

  const handleToggleFeatured = async (p: DbProject) => {
    try {
      await updateProject.mutateAsync({
        id: p.id,
        updates: { featured: !p.featured },
      });
    } catch (err: any) {
      alert(err.message || 'Failed to update featured flag');
    }
  };

  const handleStatusChange = async (p: DbProject, newStatus: ProjectStatus) => {
    try {
      await updateProject.mutateAsync({
        id: p.id,
        updates: { status: newStatus },
      });
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateProject.mutateAsync(id);
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate project');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteProject.mutateAsync(id);
      } catch (err: any) {
        alert(err.message || 'Failed to delete project');
      }
    }
  };

  const handleSeedProjects = async () => {
    try {
      setIsSeeding(true);
      await ProjectService.seedProjectsToDatabase();
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      await queryClient.refetchQueries({ queryKey: ['projects'] });
    } catch (err: any) {
      alert(err.message || 'Failed to seed sample projects');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-serif text-neutral-950 font-normal">Projects Directory</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Manage, publish, duplicate, and curate photographic works.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {(!projects || projects.length === 0) && (
            <button
              type="button"
              onClick={handleSeedProjects}
              disabled={isSeeding}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-700 text-xs font-medium hover:bg-neutral-50 transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSeeding ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-500" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-neutral-500" />
              )}
              Seed 3 Sample Works
            </button>
          )}

          <button
            type="button"
            onClick={onNewProject}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Project
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
            placeholder="Search projects by title, client, or narrative..."
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
            <option value="">All Categories</option>
            {(categories || []).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-neutral-400 font-mono">
            Loading projects...
          </div>
        ) : !projects || projects.length === 0 ? (
          <div className="py-20 text-center space-y-4 px-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-neutral-800">
                {search || categoryFilter || statusFilter !== 'all'
                  ? 'No projects match your active filter'
                  : 'No projects in directory'}
              </p>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                {search || categoryFilter || statusFilter !== 'all'
                  ? 'Try adjusting your search criteria or reset filters.'
                  : 'Your studio portfolio currently has no bespoke projects. You can create a new bespoke project or populate sample studio works.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSeedProjects}
                disabled={isSeeding}
                className="inline-flex items-center gap-2 px-3.5 py-2 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition cursor-pointer disabled:opacity-50"
              >
                {isSeeding ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-500" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-neutral-500" />
                )}
                Seed 3 Sample Projects
              </button>
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                  <th className="py-3 px-4">Plate</th>
                  <th className="py-3 px-4">Title & Client</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Featured</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {projects.map((p) => {
                  const thumb = p.preview_image || p.hero_image || '/assets/gideon_boadi_portrait.png';
                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/80 transition group">
                      {/* Thumbnail */}
                      <td className="py-3 px-4 w-16">
                        <div className="w-12 h-14 bg-neutral-900 rounded overflow-hidden flex-shrink-0 border border-neutral-200">
                          <img
                            src={thumb}
                            alt={p.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </td>

                      {/* Title & Client */}
                      <td className="py-3 px-4 min-w-[200px]">
                        <button
                          type="button"
                          onClick={() => onEditProject(p.id)}
                          className="font-semibold text-neutral-900 hover:underline text-left block truncate max-w-xs"
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
                          {p.status === 'published' && (
                            <button
                              type="button"
                              onClick={() => onViewPublicProject(p.slug)}
                              className="p-1.5 rounded text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition"
                              title="Preview on Public Portfolio"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onEditProject(p.id)}
                            className="p-1.5 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition"
                            title="Edit Project"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDuplicate(p.id)}
                            className="p-1.5 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition"
                            title="Duplicate Project"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.title)}
                            className="p-1.5 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 transition"
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
        )}
      </div>
    </div>
  );
};
