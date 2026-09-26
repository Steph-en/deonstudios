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
      <div className="bg-neutral-950/95 text-neutral-100 backdrop-blur-xl border border-neutral-700/80 rounded-2xl shadow-2xl p-2.5 sm:p-3 px-4 flex flex-wrap items-center justify-between gap-3">
        {/* Left Section: Count & Select All */}
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center px-2 py-0.5 rounded-md bg-white/10 text-white font-mono text-xs font-bold border border-white/15">
            {selectedCount}
          </span>
          <span className="text-xs text-neutral-300 font-medium">
            selected <span className="hidden sm:inline">of {totalCount} {entityName}</span>
          </span>

          {!isAllSelected && onSelectAll && (
            <button
              type="button"
              onClick={onSelectAll}
              className="text-[11px] text-neutral-400 hover:text-white underline decoration-neutral-600 hover:decoration-white transition ml-1 cursor-pointer"
            >
              Select all ({totalCount})
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white text-xs font-semibold uppercase tracking-wider transition shadow-lg shadow-rose-600/20 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deleteLabel || `Delete (${selectedCount})`}</span>
            </button>
          )}

          <div className="h-4 w-[1px] bg-neutral-800 hidden sm:block" />

          <button
            type="button"
            onClick={onClearSelection}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            title="Deselect all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
