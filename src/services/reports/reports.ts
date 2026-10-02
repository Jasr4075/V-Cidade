import { supabase } from '@/services/supabase';
import {
  Report,
  Category,
  ReportUpdate,
  Support,
  ReportRelation,
  DuplicateCheckResult,
  NearbyReportsParams,
} from '@/types';
import { RESOLUTION_CONFIRMATION_THRESHOLD } from '@/constants';

type GeoPoint = Report['location'];

/**
 * Decodes an EWKB point, as returned by PostgREST for `geography` columns.
 * Layout: endianness byte, uint32 type (0x20000001 = Point + SRID flag),
 * optional uint32 SRID, then two float64 coordinates (x = longitude, y = latitude).
 */
function decodeEwkbPoint(hex: string): GeoPoint | null {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length < 42) return null;

  try {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }

    const view = new DataView(bytes.buffer);
    const littleEndian = view.getUint8(0) === 1;
    let offset = 1;

    const type = view.getUint32(offset, littleEndian);
    offset += 4;

    // EWKB sets the high bit to signal a trailing SRID.
    if ((type & 0x20000000) !== 0) offset += 4;
    if ((type & 0xffff) !== 1) return null;

    const longitude = view.getFloat64(offset, littleEndian);
    offset += 8;
    const latitude = view.getFloat64(offset, littleEndian);

    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;

    return { type: 'Point', coordinates: [longitude, latitude] };
  } catch {
    return null;
  }
}

function decodeWktPoint(wkt: string): GeoPoint | null {
  const match = wkt.match(/^\s*POINT\s*\(\s*([-+0-9.eE]+)\s+([-+0-9.eE]+)\s*\)\s*$/i);
  if (!match) return null;

  const longitude = Number(match[1]);
  const latitude = Number(match[2]);

  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;

  return { type: 'Point', coordinates: [longitude, latitude] };
}

/**
 * `location` is a `geography(POINT, 4326)` column. PostgREST serialises it as an
 * EWKB hex string, but the app works with GeoJSON, so every read is normalised
 * here. Accepts GeoJSON, EWKB hex and WKT so direct table selects and RPC
 * results behave the same.
 */
function normalizeLocation(value: unknown): GeoPoint | null {
  if (value === null || value === undefined) return null;

  if (typeof value === 'object') {
    const coordinates = (value as { coordinates?: unknown }).coordinates;
    if (Array.isArray(coordinates) && coordinates.length >= 2) {
      const longitude = Number(coordinates[0]);
      const latitude = Number(coordinates[1]);
      if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
        return { type: 'Point', coordinates: [longitude, latitude] };
      }
    }
    return null;
  }

  if (typeof value === 'string') {
    return decodeEwkbPoint(value) ?? decodeWktPoint(value);
  }

  return null;
}

function mapReportFromDb(dbReport: unknown): Report {
  const r = dbReport as Record<string, unknown>;

  // `get_report_with_details` returns flattened fields (category_name/icon/slug),
  // while direct table selects embed a `category:categories(*)` object.
  // Build the category from the flattened RPC columns when no nested object is present.
  const flattenedCategory: Category | undefined =
    r.category_name != null
      ? {
          id: r.category_id as string,
          name: r.category_name as string,
          slug: (r.category_slug as string) ?? '',
          icon: (r.category_icon as string) ?? '',
          label: r.category_name as string,
          active: true,
          created_at: '',
        }
      : undefined;

  return {
    id: r.id as string,
    category_id: r.category_id as string,
    title: r.title as string,
    description: r.description as string,
    status: r.status as Report['status'],
    location: normalizeLocation(r.location) as GeoPoint,
    anonymous_id: r.anonymous_id as string,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
    category: (r.category as Category | undefined) ?? flattenedCategory,
    supports_count: r.supports_count as number | undefined,
    user_has_supported: r.user_has_supported as boolean | undefined,
    resolution_confirmations_count: r.resolution_confirmations_count as number | undefined,
  };
}

function mapReportUpdateFromDb(dbUpdate: unknown): ReportUpdate {
  const u = dbUpdate as Record<string, unknown>;
  return {
    ...(u as unknown as ReportUpdate),
    location: normalizeLocation(u.location),
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
  if (!anonymousId) return false;

  const { data, error } = await supabase
    .from('supports')
    .select('id')
    .eq('report_id', reportId)
    .eq('anonymous_id', anonymousId)
    .limit(1);

  if (error) throw error;
  return (data?.length ?? 0) > 0;
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
  return mapReportUpdateFromDb(data);
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
  return ((data || []) as unknown[]).map(mapReportUpdateFromDb);
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
  if (!anonymousId) return false;

  const { data, error } = await supabase
    .from('resolution_confirmations')
    .select('id')
    .eq('report_id', reportId)
    .eq('anonymous_id', anonymousId)
    .limit(1);

  if (error) throw error;
  return (data?.length ?? 0) > 0;
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