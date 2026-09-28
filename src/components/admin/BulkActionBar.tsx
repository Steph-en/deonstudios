import React from 'react';
import { Trash2, X, CheckSquare, Sparkles, CheckCircle2 } from 'lucide-react';

export interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  deleteLabel?: string;
  customActions?: React.ReactNode;
  entityName?: string; // e.g. "projects", "shots", "products", "media", "categories"
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  totalCount,
  onClearSelection,
  onSelectAll,
  onDelete,
  isDeleting = false,
  deleteLabel,
  customActions,
  entityName = 'items',
}) => {
  if (selectedCount === 0) return null;

  const isAllSelected = selectedCount >= totalCount;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] w-[95%] max-w-2xl animate-in slide-in-from-bottom-5 fade-in duration-200">
      <div className="bg-white/95 text-neutral-900 backdrop-blur-xl border border-neutral-200/90 rounded-xl shadow-2xl p-2.5 sm:p-3 px-4 flex flex-wrap items-center justify-between gap-3 ring-1 ring-black/5">
        {/* Left Section: Count & Select All */}
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-900 font-mono text-xs font-bold border border-neutral-200">
            {selectedCount}
          </span>
          <span className="text-xs text-neutral-600 font-medium">
            selected <span className="hidden sm:inline">of {totalCount} {entityName}</span>
          </span>

          {!isAllSelected && onSelectAll && (
            <button
              type="button"
              onClick={onSelectAll}
              className="text-[8px] text-neutral-500 hover:text-neutral-900 underline decoration-neutral-300 hover:decoration-neutral-900 transition ml-1 cursor-pointer font-medium"
            >
              Select all
            </button>
          )}
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {customActions}

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white text-xs font-semibold uppercase tracking-wider transition shadow-sm shadow-rose-600/20 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deleteLabel || `Delete`}</span>
            </button>
          )}

          <div className="h-4 w-[1px] bg-neutral-200 hidden sm:block" />

          <button
            type="button"
            onClick={onClearSelection}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
            title="Deselect all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
