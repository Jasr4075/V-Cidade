import { supabase } from '@/services/supabase';
import {
  Report,
  Category,
  ReportUpdate,
  Photo,
  Support,
  ReportRelation,
  DuplicateCheckResult,
  NearbyReportsParams,
} from '@/types';
import { RESOLUTION_CONFIRMATION_THRESHOLD } from '@/constants';

function mapReportFromDb(dbReport: unknown): Report {
  const r = dbReport as Record<string, unknown>;
  return {
    id: r.id as string,
    category_id: r.category_id as string,
    title: r.title as string,
    description: r.description as string,
    status: r.status as Report['status'],
    location: r.location as Report['location'],
    anonymous_id: r.anonymous_id as string,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
    category: r.category as Category | undefined,
    supports_count: r.supports_count as number | undefined,
    user_has_supported: r.user_has_supported as boolean | undefined,
    resolution_confirmations_count: r.resolution_confirmations_count as number | undefined,
  };
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('active', true)
    .order('name');

  if (error) throw error;
  return (data || []) as Category[];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .single();

  if (error) return null;
  return data as Category | null;
}

export async function getNearbyReports(params: NearbyReportsParams): Promise<Report[]> {
  const {
    latitude,
    longitude,
    radius = 2000,
    category_id,
    status,
    limit = 50,
    offset = 0,
  } = params;

  const { data, error } = await supabase.rpc('find_nearby_reports', {
    p_latitude: latitude,
    p_longitude: longitude,
    p_radius_meters: radius,
    p_category_id: category_id,
    p_statuses: status,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) throw error;
  return ((data || []) as unknown[]).map(mapReportFromDb);
}

export async function getReportById(reportId: string, anonymousId: string): Promise<Report | null> {
  const { data, error } = await supabase.rpc('get_report_with_details', {
    p_report_id: reportId,
    p_anonymous_id: anonymousId,
  });

  if (error) throw error;
  if (!data || (data as unknown[]).length === 0) return null;
  return mapReportFromDb((data as unknown[])[0]);
}

export async function createReport(
  categoryId: string,
  title: string,
  description: string,
  latitude: number,
  longitude: number,
  anonymousId: string
): Promise<Report> {
  const { data, error } = await supabase
    .from('reports')
    .insert({
      category_id: categoryId,
      title,
      description,
      status: 'ACTIVE',
      location: `POINT(${longitude} ${latitude})`,
      anonymous_id: anonymousId,
    })
    .select()
    .single();

  if (error) throw error;
  return mapReportFromDb(data);
}

export async function checkDuplicates(
  categoryId: string,
  latitude: number,
  longitude: number,
  radiusMeters = 100
): Promise<DuplicateCheckResult[]> {
  const { data, error } = await supabase.rpc('check_duplicates', {
    p_category_id: categoryId,
    p_latitude: latitude,
    p_longitude: longitude,
    p_radius_meters: radiusMeters,
  });

  if (error) throw error;
  return ((data || []) as unknown[]).map((r) => ({
    report: mapReportFromDb(r),
    distance: (r as Record<string, unknown>).distance as number,
  }));
}

export async function supportReport(reportId: string, anonymousId: string): Promise<Support> {
  const { data, error } = await supabase
    .from('supports')
    .insert({
      report_id: reportId,
      anonymous_id: anonymousId,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Support;
}

export async function removeSupport(reportId: string, anonymousId: string): Promise<void> {
  const { error } = await supabase
    .from('supports')
    .delete()
    .eq('report_id', reportId)
    .eq('anonymous_id', anonymousId);

  if (error) throw error;
}

export async function hasUserSupported(reportId: string, anonymousId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('supports')
    .select('id')
    .eq('report_id', reportId)
    .eq('anonymous_id', anonymousId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

export async function createReportUpdate(
  reportId: string,
  status: ReportUpdate['status'],
  description: string,
  anonymousId: string,
  latitude?: number,
  longitude?: number
): Promise<ReportUpdate> {
  const { data, error } = await supabase
    .from('report_updates')
    .insert({
      report_id: reportId,
      status,
      description,
      anonymous_id: anonymousId,
      location: latitude && longitude ? `POINT(${longitude} ${latitude})` : null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ReportUpdate;
}

export async function getReportUpdates(reportId: string): Promise<ReportUpdate[]> {
  const { data, error } = await supabase
    .from('report_updates')
    .select(`
      *,
      photos (*)
    `)
    .eq('report_id', reportId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as ReportUpdate[];
}

export async function createReportRelation(
  reportId: string,
  relatedReportId: string,
  relationType: ReportRelation['relation_type'],
  anonymousId: string
): Promise<ReportRelation> {
  const { data, error } = await supabase
    .from('report_relations')
    .insert({
      report_id: reportId,
      related_report_id: relatedReportId,
      relation_type: relationType,
      created_by_anonymous_id: anonymousId,
      status: 'PENDING',
    })
    .select()
    .single();

  if (error) throw error;
  return data as ReportRelation;
}

export async function getReportRelations(reportId: string): Promise<ReportRelation[]> {
  const { data, error } = await supabase
    .from('report_relations')
    .select(`
      *,
      related_report:reports!report_relations_related_report_id_fkey (
        *,
        category:categories (*)
      )
    `)
    .eq('report_id', reportId)
    .eq('status', 'APPROVED');

  if (error) throw error;
  return (data || []) as ReportRelation[];
}

export async function confirmResolution(reportId: string, anonymousId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('confirm_resolution', {
    p_report_id: reportId,
    p_anonymous_id: anonymousId,
  });

  if (error) throw error;
  return data as boolean;
}

export async function hasUserConfirmedResolution(reportId: string, anonymousId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('resolution_confirmations')
    .select('id')
    .eq('report_id', reportId)
    .eq('anonymous_id', anonymousId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

export async function getResolutionConfirmationsCount(reportId: string): Promise<number> {
  const { count, error } = await supabase
    .from('resolution_confirmations')
    .select('*', { count: 'exact', head: true })
    .eq('report_id', reportId);

  if (error) throw error;
  return count || 0;
}

export async function isReportResolved(reportId: string): Promise<boolean> {
  const count = await getResolutionConfirmationsCount(reportId);
  return count >= RESOLUTION_CONFIRMATION_THRESHOLD;
}

export async function searchReports(query: string): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select(`
      *,
      category:categories (*)
    `)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .eq('status', 'ACTIVE')
    .limit(20);

  if (error) throw error;
  return ((data || []) as unknown[]).map(mapReportFromDb);
}