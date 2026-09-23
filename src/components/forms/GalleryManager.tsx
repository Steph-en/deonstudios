import React, { useState } from 'react';
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
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Edit3, Image as ImageIcon, Video as VideoIcon, Plus, Check } from 'lucide-react';
import { DbProjectMedia } from '../../types/database';
import { MediaUploader } from './MediaUploader';
import { formatFileSize } from '../../lib/utils';

interface GalleryItemProps {
  item: DbProjectMedia;
  onUpdateAlt: (id: string, alt: string) => void;
  onDelete: (id: string, path: string) => void;
}

const SortableGalleryCard: React.FC<GalleryItemProps> = ({ item, onUpdateAlt, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const [isEditingAlt, setIsEditingAlt] = useState(false);
  const [altText, setAltText] = useState(item.alt_text || '');

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.7 : 1,
  };

  const isVideo = item.media_type === 'video' || item.media_url?.endsWith('.mp4');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg bg-white overflow-hidden shadow-sm transition ${
        isDragging ? 'border-neutral-900 ring-2 ring-neutral-900/10' : 'border-neutral-200 hover:border-neutral-400'
      }`}
    >
      <div className="relative aspect-[4/3] bg-neutral-900 group">
        {isVideo ? (
          <video src={item.media_url} className="w-full h-full object-cover" muted />
        ) : (
          <img src={item.media_url} alt={item.alt_text || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        )}

        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 p-1.5 rounded bg-black/60 text-white cursor-grab active:cursor-grabbing hover:bg-black/80 transition"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Media Type Badge */}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-black/60 text-white backdrop-blur-sm">
          {item.media_type}
        </div>

        {/* Delete button */}
        <button
          type="button"
          onClick={() => onDelete(item.id, item.storage_path)}
          className="absolute bottom-2 right-2 p-1.5 rounded bg-red-600/90 text-white opacity-0 group-hover:opacity-100 hover:bg-red-700 transition"
          title="Remove media"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-2.5 bg-neutral-50 border-t border-neutral-100">
        {isEditingAlt ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Caption / Alt text"
              className="flex-1 text-xs border border-neutral-300 rounded px-2 py-1 focus:outline-none focus:border-neutral-900 bg-white"
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                onUpdateAlt(item.id, altText);
                setIsEditingAlt(false);
              }}
              className="p-1 rounded bg-neutral-900 text-white hover:bg-neutral-800"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-1">
            <p className="text-xs text-neutral-600 truncate" title={item.alt_text || 'No caption'}>
              {item.alt_text || <span className="text-neutral-400 italic">No caption</span>}
            </p>
            <button
              type="button"
              onClick={() => setIsEditingAlt(true)}
              className="p-1 text-neutral-400 hover:text-neutral-900 transition"
              title="Edit caption"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface GalleryManagerProps {
  projectId: string;
  items: DbProjectMedia[];
  onItemsChange: (items: DbProjectMedia[]) => void;
  onAddItem: (item: Partial<DbProjectMedia>) => void;
  onDeleteItem: (id: string, path: string) => void;
  onUpdateAlt: (id: string, alt: string) => void;
}

export const GalleryManager: React.FC<GalleryManagerProps> = ({
  projectId,
  items,
  onItemsChange,
  onAddItem,
  onDeleteItem,
  onUpdateAlt,
}) => {
  const [showUploader, setShowUploader] = useState(false);

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const reordered = (arrayMove(items, oldIndex, newIndex) as DbProjectMedia[]).map((item: DbProjectMedia, idx: number) => ({
        ...item,
        display_order: idx + 1,
      }));

      onItemsChange(reordered);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">
            Project Gallery ({items.length} assets)
          </h3>
          <p className="text-xs text-neutral-500">
            Drag items using the grip handle to reorder the public gallery presentation.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowUploader(!showUploader)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-neutral-900 text-white hover:bg-neutral-800 transition"
        >
          <Plus className="w-4 h-4" />
          {showUploader ? 'Close Uploader' : 'Add Media'}
        </button>
      </div>

      {showUploader && (
        <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
          <MediaUploader
            label="Upload Gallery Asset"
            description="Images (JPG, PNG, WebP) or Videos (MP4) uploaded directly to your gallery"
            accept="both"
            projectId={projectId}
            folder="gallery"
            onUploadComplete={(result) => {
              onAddItem({
                project_id: projectId,
                media_type: result.mimeType.startsWith('video') ? 'video' : 'image',
                storage_path: result.path,
                media_url: result.url,
                file_name: result.fileName,
                file_size: result.fileSize,
                mime_type: result.mimeType,
                width: result.width || null,
                height: result.height || null,
                alt_text: result.fileName,
                display_order: items.length + 1,
              });
              setShowUploader(false);
            }}
          />
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-neutral-200 rounded-lg">
          <ImageIcon className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-xs font-medium text-neutral-600">No media assets in gallery yet</p>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Click "Add Media" above to upload high-res images and videos
          </p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {items.map((item) => (
                <SortableGalleryCard
                  key={item.id}
                  item={item}
                  onUpdateAlt={onUpdateAlt}
                  onDelete={onDeleteItem}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};
