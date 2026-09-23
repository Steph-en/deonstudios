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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Trash2,
  Plus,
  Layers,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
} from 'lucide-react';
import { DbProjectSection, SectionType } from '../../types/database';
import { MediaUploader } from './MediaUploader';

const SECTION_TYPE_LABELS: Record<SectionType, { label: string; desc: string }> = {
  overview: { label: 'Creative Overview', desc: 'High-level editorial narrative and core thesis' },
  challenge: { label: 'The Challenge', desc: 'Creative, cultural, or logistical constraints' },
  research: { label: 'Visual Research', desc: 'Moodboards, historical references, archive studies' },
  strategy: { label: 'Creative Strategy', desc: 'Lighting concept, casting, location, set design' },
  wireframes: { label: 'Storyboards & Layouts', desc: 'Framing blueprints, shot lists, lighting diagrams' },
  design_system: { label: 'Color & Tone Palette', desc: 'Color grading, grain profiles, typography' },
  process: { label: 'Production Process', desc: 'Behind-the-scenes on set, lighting rigs, gear' },
  solution: { label: 'The Solution', desc: 'Final execution and editorial creative breakthrough' },
  results: { label: 'Impact & Recognition', desc: 'Press coverage, global distribution, cultural imprint' },
  gallery: { label: 'Curated Photo Grid', desc: 'Full-bleed photographic plates' },
  video: { label: 'Motion / Video Feature', desc: 'Embedded campaign reel or behind-the-scenes video' },
};

interface SortableSectionCardProps {
  section: DbProjectSection;
  index: number;
  projectId: string;
  onUpdate: (id: string, updates: Partial<DbProjectSection>) => void;
  onDelete: (id: string) => void;
}

const SortableSectionCard: React.FC<SortableSectionCardProps> = ({
  section,
  index,
  projectId,
  onUpdate,
  onDelete,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const [isExpanded, setIsExpanded] = useState(true);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 40 : 1,
    opacity: isDragging ? 0.7 : 1,
  };

  const typeMeta = SECTION_TYPE_LABELS[section.section_type] || {
    label: section.section_type,
    desc: '',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg bg-white overflow-hidden shadow-sm transition ${
        isDragging ? 'border-neutral-900 ring-2 ring-neutral-900/10' : 'border-neutral-200'
      }`}
    >
      <div className="flex items-center justify-between p-3 bg-neutral-50 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            className="p-1 rounded text-neutral-400 hover:text-neutral-900 cursor-grab active:cursor-grabbing transition"
            title="Drag to reorder section"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          <span className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-800 text-xs font-semibold flex items-center justify-center">
            {index + 1}
          </span>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                {typeMeta.label}
              </h4>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-700">
                {section.section_type}
              </span>
            </div>
            {section.title && (
              <p className="text-xs font-medium text-neutral-600 mt-0.5">{section.title}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-neutral-400 hover:text-neutral-700 transition"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => onDelete(section.id)}
            className="p-1 text-red-500 hover:text-red-700 transition"
            title="Delete section"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Section Type
              </label>
              <select
                value={section.section_type}
                onChange={(e) =>
                  onUpdate(section.id, { section_type: e.target.value as SectionType })
                }
                className="w-full text-xs border border-neutral-300 rounded px-2.5 py-2 bg-white focus:outline-none focus:border-neutral-900"
              >
                {Object.entries(SECTION_TYPE_LABELS).map(([type, meta]) => (
                  <option key={type} value={type}>
                    {meta.label} ({type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Section Heading / Title
              </label>
              <input
                type="text"
                value={section.title || ''}
                onChange={(e) => onUpdate(section.id, { title: e.target.value })}
                placeholder="e.g. Sculpting Ancestral Metal in Tungsten Light"
                className="w-full text-xs border border-neutral-300 rounded px-2.5 py-2 focus:outline-none focus:border-neutral-900"
              >
              </input>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Narrative Content / Deep Dive
            </label>
            <textarea
              rows={4}
              value={section.content || ''}
              onChange={(e) => onUpdate(section.id, { content: e.target.value })}
              placeholder="Describe the creative intent, techniques, technical setup, and outcomes for this phase of the case study..."
              className="w-full text-xs border border-neutral-300 rounded p-2.5 focus:outline-none focus:border-neutral-900 font-sans"
            />
          </div>

          {/* Optional Media for this Section */}
          <div>
            <MediaUploader
              label="Accompanying Section Media (Optional)"
              description="Visual plate, lighting diagram, or behind-the-scenes video clip"
              accept="both"
              currentUrl={section.media_url}
              projectId={projectId}
              folder="sections"
              onUploadComplete={(res) => onUpdate(section.id, { media_url: res.url })}
              onRemove={() => onUpdate(section.id, { media_url: null })}
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface CaseStudyBuilderProps {
  projectId: string;
  sections: DbProjectSection[];
  onSectionsChange: (sections: DbProjectSection[]) => void;
  onAddSection: (section: Partial<DbProjectSection>) => void;
  onDeleteSection: (id: string) => void;
  onUpdateSection: (id: string, updates: Partial<DbProjectSection>) => void;
}

export const CaseStudyBuilder: React.FC<CaseStudyBuilderProps> = ({
  projectId,
  sections,
  onSectionsChange,
  onAddSection,
  onDeleteSection,
  onUpdateSection,
}) => {
  const [selectedNewType, setSelectedNewType] = useState<SectionType>('overview');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      const reordered = (arrayMove(sections, oldIndex, newIndex) as DbProjectSection[]).map((s: DbProjectSection, idx: number) => ({
        ...s,
        display_order: idx + 1,
      }));

      onSectionsChange(reordered);
    }
  };

  const handleCreateSection = () => {
    onAddSection({
      project_id: projectId,
      section_type: selectedNewType,
      title: SECTION_TYPE_LABELS[selectedNewType]?.label || 'New Section',
      content: '',
      media_url: null,
      display_order: sections.length + 1,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">
            Case Study Narrative Builder ({sections.length} sections)
          </h3>
          <p className="text-xs text-neutral-500">
            Compose deep-dive editorial case studies with custom phases, stories, and technical details.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedNewType}
            onChange={(e) => setSelectedNewType(e.target.value as SectionType)}
            className="text-xs border border-neutral-300 rounded px-2.5 py-1.5 bg-white font-medium focus:outline-none focus:border-neutral-900"
          >
            {Object.entries(SECTION_TYPE_LABELS).map(([type, meta]) => (
              <option key={type} value={type}>
                + {meta.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleCreateSection}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-neutral-900 text-white hover:bg-neutral-800 transition"
          >
            <Plus className="w-4 h-4" />
            Add Section
          </button>
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-neutral-200 rounded-lg">
          <Layers className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-xs font-medium text-neutral-600">No case study sections yet</p>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Add Overview, Challenge, Solution, or Visual Research sections to create an in-depth editorial profile.
          </p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {sections.map((section, idx) => (
                <SortableSectionCard
                  key={section.id}
                  section={section}
                  index={idx}
                  projectId={projectId}
                  onUpdate={onUpdateSection}
                  onDelete={onDeleteSection}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};
