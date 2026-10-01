export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string;
          label: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          icon: string;
          label: string;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          icon?: string;
          label?: string;
          active?: boolean;
          created_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          category_id: string;
          title: string;
          description: string;
          status: 'ACTIVE' | 'IMPROVING' | 'RESOLVED' | 'ARCHIVED';
          location: string;
          anonymous_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          title: string;
          description: string;
          status?: 'ACTIVE' | 'IMPROVING' | 'RESOLVED' | 'ARCHIVED';
          location: string;
          anonymous_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          title?: string;
          description?: string;
          status?: 'ACTIVE' | 'IMPROVING' | 'RESOLVED' | 'ARCHIVED';
          location?: string;
          anonymous_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      report_updates: {
        Row: {
          id: string;
          report_id: string;
          status: 'SAME' | 'WORSE' | 'BETTER' | 'RESOLVED';
          description: string;
          anonymous_id: string;
          location: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          status: 'SAME' | 'WORSE' | 'BETTER' | 'RESOLVED';
          description: string;
          anonymous_id: string;
          location?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          status?: 'SAME' | 'WORSE' | 'BETTER' | 'RESOLVED';
          description?: string;
          anonymous_id?: string;
          location?: string | null;
          created_at?: string;
        };
      };
      photos: {
        Row: {
          id: string;
          report_id: string;
          update_id: string | null;
          storage_path: string;
          moderation_status: 'PENDING' | 'APPROVED' | 'REJECTED';
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          update_id?: string | null;
          storage_path: string;
          moderation_status?: 'PENDING' | 'APPROVED' | 'REJECTED';
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          update_id?: string | null;
          storage_path?: string;
          moderation_status?: 'PENDING' | 'APPROVED' | 'REJECTED';
          created_at?: string;
        };
      };
      supports: {
        Row: {
          id: string;
          report_id: string;
          anonymous_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          anonymous_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          anonymous_id?: string;
          created_at?: string;
        };
      };
      report_relations: {
        Row: {
          id: string;
          report_id: string;
          related_report_id: string;
          relation_type: 'DUPLICATE' | 'RELATED' | 'CONTINUATION';
          created_by_anonymous_id: string;
          status: 'PENDING' | 'APPROVED' | 'REJECTED';
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          related_report_id: string;
          relation_type: 'DUPLICATE' | 'RELATED' | 'CONTINUATION';
          created_by_anonymous_id: string;
          status?: 'PENDING' | 'APPROVED' | 'REJECTED';
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          related_report_id?: string;
          relation_type?: 'DUPLICATE' | 'RELATED' | 'CONTINUATION';
          created_by_anonymous_id?: string;
          status?: 'PENDING' | 'APPROVED' | 'REJECTED';
          created_at?: string;
        };
      };
      resolution_confirmations: {
        Row: {
          id: string;
          report_id: string;
          anonymous_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          anonymous_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          anonymous_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      nearby_reports: {
        Row: {
          id: string;
          category_id: string;
          title: string;
          description: string;
          status: 'ACTIVE' | 'IMPROVING' | 'RESOLVED' | 'ARCHIVED';
          location: string;
          anonymous_id: string;
          created_at: string;
          updated_at: string;
          category_name: string;
          category_icon: string;
          category_slug: string;
          supports_count: number;
          resolution_confirmations_count: number;
          distance: number;
        };
      };
    };
    Functions: {
      find_nearby_reports: {
        Args: {
          p_latitude: number;
          p_longitude: number;
          p_radius_meters?: number;
          p_category_id?: string;
          p_statuses?: string[];
          p_limit?: number;
          p_offset?: number;
        };
        Returns: Database['public']['Views']['nearby_reports']['Row'][];
      };
      check_duplicates: {
        Args: {
          p_category_id: string;
          p_latitude: number;
          p_longitude: number;
          p_radius_meters?: number;
        };
        Returns: Database['public']['Views']['nearby_reports']['Row'][];
      };
      get_report_with_details: {
        Args: {
          p_report_id: string;
          p_anonymous_id: string;
        };
        Returns: {
          report: Database['public']['Tables']['reports']['Row'];
          category: Database['public']['Tables']['categories']['Row'];
          supports_count: number;
          user_has_supported: boolean;
          resolution_confirmations_count: number;
          user_has_confirmed_resolution: boolean;
        }[];
      };
      confirm_resolution: {
        Args: {
          p_report_id: string;
          p_anonymous_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      report_status: 'ACTIVE' | 'IMPROVING' | 'RESOLVED' | 'ARCHIVED';
      update_status: 'SAME' | 'WORSE' | 'BETTER' | 'RESOLVED';
      relation_type: 'DUPLICATE' | 'RELATED' | 'CONTINUATION';
      moderation_status: 'PENDING' | 'APPROVED' | 'REJECTED';
    };
  };
}