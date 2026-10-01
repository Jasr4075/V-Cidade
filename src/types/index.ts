export type ReportStatus = 'ACTIVE' | 'IMPROVING' | 'RESOLVED' | 'ARCHIVED';

export type UpdateStatus = 'SAME' | 'WORSE' | 'BETTER' | 'RESOLVED';

export type RelationType = 'DUPLICATE' | 'RELATED' | 'CONTINUATION';

export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  label: string;
  active: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  category_id: string;
  title: string;
  description: string;
  status: ReportStatus;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  anonymous_id: string;
  created_at: string;
  updated_at: string;
  category?: Category;
  supports_count?: number;
  user_has_supported?: boolean;
  resolution_confirmations_count?: number;
}

export interface ReportUpdate {
  id: string;
  report_id: string;
  status: UpdateStatus;
  description: string;
  anonymous_id: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  } | null;
  created_at: string;
  photos?: Photo[];
}

export interface Photo {
  id: string;
  report_id: string;
  update_id: string | null;
  storage_path: string;
  moderation_status: ModerationStatus;
  created_at: string;
}

export interface Support {
  id: string;
  report_id: string;
  anonymous_id: string;
  created_at: string;
}

export interface ReportRelation {
  id: string;
  report_id: string;
  related_report_id: string;
  relation_type: RelationType;
  created_by_anonymous_id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  related_report?: Report;
}

export interface ResolutionConfirmation {
  id: string;
  report_id: string;
  anonymous_id: string;
  created_at: string;
}

export interface DuplicateCheckResult {
  report: Report;
  distance: number;
}

export interface NearbyReportsParams {
  latitude: number;
  longitude: number;
  radius?: number;
  category_id?: string;
  status?: ReportStatus[];
  limit?: number;
  offset?: number;
}