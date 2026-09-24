export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProjectStatus = 'draft' | 'published' | 'archived';
export type MediaType = 'image' | 'video';
export type SectionType =
  | 'overview'
  | 'challenge'
  | 'research'
  | 'strategy'
  | 'wireframes'
  | 'design_system'
  | 'process'
  | 'solution'
  | 'results'
  | 'gallery'
  | 'video';
export type UserRole = 'admin' | 'manager' | 'editor';
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          color: string | null;
          icon: string | null;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          color?: string | null;
          icon?: string | null;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          color?: string | null;
          icon?: string | null;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          title: string;
          slug: string;
          category_id: string | null;
          client: string | null;
          year: string | null;
          role: string | null;
          description: string;
          long_description: string | null;
          status: ProjectStatus;
          featured: boolean;
          preview_image: string | null;
          preview_video: string | null;
          hero_image: string | null;
          hero_video: string | null;
          og_image: string | null;
          seo_title: string | null;
          seo_description: string | null;
          seo_keywords: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          category_id?: string | null;
          client?: string | null;
          year?: string | null;
          role?: string | null;
          description: string;
          long_description?: string | null;
          status?: ProjectStatus;
          featured?: boolean;
          preview_image?: string | null;
          preview_video?: string | null;
          hero_image?: string | null;
          hero_video?: string | null;
          og_image?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_keywords?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          category_id?: string | null;
          client?: string | null;
          year?: string | null;
          role?: string | null;
          description?: string;
          long_description?: string | null;
          status?: ProjectStatus;
          featured?: boolean;
          preview_image?: string | null;
          preview_video?: string | null;
          hero_image?: string | null;
          hero_video?: string | null;
          og_image?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_keywords?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'projects_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          }
        ];
      };
      project_media: {
        Row: {
          id: string;
          project_id: string;
          media_type: MediaType;
          storage_path: string;
          media_url: string;
          thumbnail_path: string | null;
          thumbnail_url: string | null;
          file_name: string | null;
          file_size: number | null;
          mime_type: string | null;
          width: number | null;
          height: number | null;
          alt_text: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          media_type: MediaType;
          storage_path: string;
          media_url: string;
          thumbnail_path?: string | null;
          thumbnail_url?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          mime_type?: string | null;
          width?: number | null;
          height?: number | null;
          alt_text?: string | null;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          media_type?: MediaType;
          storage_path?: string;
          media_url?: string;
          thumbnail_path?: string | null;
          thumbnail_url?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          mime_type?: string | null;
          width?: number | null;
          height?: number | null;
          alt_text?: string | null;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'project_media_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      project_sections: {
        Row: {
          id: string;
          project_id: string;
          section_type: SectionType;
          title: string | null;
          content: string | null;
          media_url: string | null;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          section_type: SectionType;
          title?: string | null;
          content?: string | null;
          media_url?: string | null;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          section_type?: SectionType;
          title?: string | null;
          content?: string | null;
          media_url?: string | null;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'project_sections_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      analytics: {
        Row: {
          id: string;
          project_id: string | null;
          country: string | null;
          device: DeviceType | null;
          traffic_source: string | null;
          page_url: string | null;
          user_session_id: string | null;
          viewed_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          country?: string | null;
          device?: DeviceType | null;
          traffic_source?: string | null;
          page_url?: string | null;
          user_session_id?: string | null;
          viewed_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          country?: string | null;
          device?: DeviceType | null;
          traffic_source?: string | null;
          page_url?: string | null;
          user_session_id?: string | null;
          viewed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'analytics_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      portfolio_shots: {
        Row: {
          id: string;
          title: string;
          category: string | null;
          url: string;
          fallback_url: string | null;
          aspect_ratio: 'portrait' | 'landscape' | 'tall' | 'square' | 'wide';
          caption: string | null;
          client_or_brand: string | null;
          tag: string | null;
          camera: string | null;
          lens: string | null;
          iso: string | null;
          shutter: string | null;
          status: ProjectStatus;
          featured: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          category?: string | null;
          url: string;
          fallback_url?: string | null;
          aspect_ratio?: 'portrait' | 'landscape' | 'tall' | 'square' | 'wide';
          caption?: string | null;
          client_or_brand?: string | null;
          tag?: string | null;
          camera?: string | null;
          lens?: string | null;
          iso?: string | null;
          shutter?: string | null;
          status?: ProjectStatus;
          featured?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          category?: string | null;
          url?: string;
          fallback_url?: string | null;
          aspect_ratio?: 'portrait' | 'landscape' | 'tall' | 'square' | 'wide';
          caption?: string | null;
          client_or_brand?: string | null;
          tag?: string | null;
          camera?: string | null;
          lens?: string | null;
          iso?: string | null;
          shutter?: string | null;
          status?: ProjectStatus;
          featured?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      product_shots: {
        Row: {
          id: string;
          title: string;
          category: string | null;
          url: string;
          fallback_url: string | null;
          aspect_ratio: 'portrait' | 'landscape' | 'tall' | 'square' | 'wide';
          caption: string | null;
          client_or_brand: string | null;
          tag: string | null;
          camera: string | null;
          lens: string | null;
          iso: string | null;
          shutter: string | null;
          status: ProjectStatus;
          featured: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          category?: string | null;
          url: string;
          fallback_url?: string | null;
          aspect_ratio?: 'portrait' | 'landscape' | 'tall' | 'square' | 'wide';
          caption?: string | null;
          client_or_brand?: string | null;
          tag?: string | null;
          camera?: string | null;
          lens?: string | null;
          iso?: string | null;
          shutter?: string | null;
          status?: ProjectStatus;
          featured?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          category?: string | null;
          url?: string;
          fallback_url?: string | null;
          aspect_ratio?: 'portrait' | 'landscape' | 'tall' | 'square' | 'wide';
          caption?: string | null;
          client_or_brand?: string | null;
          tag?: string | null;
          camera?: string | null;
          lens?: string | null;
          iso?: string | null;
          shutter?: string | null;
          status?: ProjectStatus;
          featured?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_portfolio_stats: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Convenience Types
export type DbProfile = Database['public']['Tables']['profiles']['Row'];
export type DbCategory = Database['public']['Tables']['categories']['Row'];
export type DbProjectRow = Database['public']['Tables']['projects']['Row'];

export interface DbProject extends DbProjectRow {
  category?: DbCategory | null;
  media?: DbProjectMedia[];
  sections?: DbProjectSection[];
  viewsCount?: number;
}

export type DbProjectMedia = Database['public']['Tables']['project_media']['Row'];
export type DbProjectSection = Database['public']['Tables']['project_sections']['Row'];
export type DbAnalytics = Database['public']['Tables']['analytics']['Row'];
export type DbPortfolioShot = Database['public']['Tables']['portfolio_shots']['Row'];
export type DbProductShot = Database['public']['Tables']['product_shots']['Row'];

export interface ProjectWithDetails extends DbProject {}
