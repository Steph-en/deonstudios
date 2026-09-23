import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { DbProjectSection, SectionType } from '../../../types/database';

export class SectionService {
  /**
   * Fetch all case study sections for a project
   */
  static async getSectionsForProject(projectId: string): Promise<DbProjectSection[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data, error } = await supabase
      .from('project_sections')
      .select('*')
      .eq('project_id', projectId)
      .order('display_order', { ascending: true });

    if (error) {
      console.warn('Failed to fetch sections:', error.message);
      return [];
    }

    return (data as DbProjectSection[]) || [];
  }

  /**
   * Add a new section to case study
   */
  static async addSection(section: {
    project_id: string;
    section_type: SectionType;
    title?: string | null;
    content?: string | null;
    media_url?: string | null;
    display_order?: number;
  }): Promise<DbProjectSection> {
    if (!isSupabaseConfigured()) {
      return {
        id: `sec-${Date.now()}`,
        project_id: section.project_id,
        section_type: section.section_type,
        title: section.title ?? null,
        content: section.content ?? null,
        media_url: section.media_url ?? null,
        display_order: section.display_order ?? 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    const { data, error } = await supabase
      .from('project_sections')
      .insert({
        project_id: section.project_id,
        section_type: section.section_type,
        title: section.title,
        content: section.content,
        media_url: section.media_url,
        display_order: section.display_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to add case study section');
    }

    return data as DbProjectSection;
  }

  /**
   * Update section
   */
  static async updateSection(id: string, updates: Partial<DbProjectSection>): Promise<DbProjectSection> {
    if (!isSupabaseConfigured()) {
      return {
        id,
        ...updates,
      } as DbProjectSection;
    }

    const { data, error } = await supabase
      .from('project_sections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to update section');
    }

    return data as DbProjectSection;
  }

  /**
   * Delete section
   */
  static async deleteSection(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;

    const { error } = await supabase.from('project_sections').delete().eq('id', id);
    if (error) {
      throw new Error(error.message || 'Failed to delete section');
    }
    return true;
  }

  /**
   * Persist reordered sections in PostgreSQL
   */
  static async reorderSections(orderedItems: { id: string; display_order: number }[]): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;

    const updates = orderedItems.map((item) =>
      supabase
        .from('project_sections')
        .update({ display_order: item.display_order })
        .eq('id', item.id)
    );

    await Promise.all(updates);
    return true;
  }
}
