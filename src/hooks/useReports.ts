import { useState, useEffect, useCallback } from 'react';
import { getAnonymousId } from '@/utils';
import { Report, Category, ReportUpdate, ReportRelation, Photo } from '@/types';
import {
  getCategories,
  getNearbyReports,
  getReportById,
  createReport,
  checkDuplicates,
  supportReport,
  removeSupport,
  hasUserSupported,
  createReportUpdate,
  getReportUpdates,
  createReportRelation,
  getReportRelations,
  confirmResolution,
  hasUserConfirmedResolution,
  isReportResolved,
  searchReports,
  getResolutionConfirmationsCount,
} from '@/services/reports/reports';

export function useAnonymousId() {
  const [anonymousId, setAnonymousId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getAnonymousId()
      .then((id) => {
        if (active) setAnonymousId(id);
      })
      .catch(() => {
        // nothing to report: anonymous actions simply become ownerless
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { anonymousId, loading };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.warn('[useCategories] falha ao carregar', err);
      setError('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return { categories, loading, error, refresh: loadCategories };
}

export function useNearbyReports(
  latitude: number,
  longitude: number,
  options?: {
    radius?: number;
    categoryId?: string;
    status?: Report['status'][];
    enabled?: boolean;
  }
) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const radius = options?.radius;
  const categoryId = options?.categoryId;
  const status = options?.status;
  const enabled = options?.enabled;

  const loadReports = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      const data = await getNearbyReports({
        latitude,
        longitude,
        radius,
        category_id: categoryId,
        status,
      });
      setReports(data);
    } catch {
      setError('Erro ao carregar problemas próximos');
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, radius, categoryId, status, enabled]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return { reports, loading, error, refresh: loadReports };
}

export function useReport(reportId: string, anonymousId: string) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getReportById(reportId, anonymousId);
      setReport(data);
    } catch {
      setError('Erro ao carregar problema');
    } finally {
      setLoading(false);
    }
  }, [reportId, anonymousId]);

  useEffect(() => {
    if (reportId && anonymousId) {
      loadReport();
    }
  }, [loadReport, reportId, anonymousId]);

  return { report, loading, error, refresh: loadReport };
}

export function useCreateReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (
    categoryId: string,
    title: string,
    description: string,
    latitude: number,
    longitude: number,
    anonymousId: string
  ): Promise<Report | null> => {
    try {
      setLoading(true);
      setError(null);
      const report = await createReport(categoryId, title, description, latitude, longitude, anonymousId);
      return report;
    } catch {
      setError('Erro ao criar problema');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
}

export function useCheckDuplicates() {
  const [loading, setLoading] = useState(false);
  const [duplicates, setDuplicates] = useState<{ report: Report; distance: number }[]>([]);

  const check = async (
    categoryId: string,
    latitude: number,
    longitude: number,
    radiusMeters = 100
  ) => {
    try {
      setLoading(true);
      const data = await checkDuplicates(categoryId, latitude, longitude, radiusMeters);
      setDuplicates(data);
      return data;
    } catch {
      setDuplicates([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { check, loading, duplicates };
}

export function useSupportReport(reportId: string, anonymousId: string) {
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);
  const [supportsCount, setSupportsCount] = useState(0);

  const loadSupportStatus = useCallback(async () => {
    try {
      const hasSupported = await hasUserSupported(reportId, anonymousId);
      setSupported(hasSupported);
    } catch {
      // ignore
    }
  }, [reportId, anonymousId]);

  useEffect(() => {
    if (reportId && anonymousId) {
      loadSupportStatus();
    }
  }, [loadSupportStatus, reportId, anonymousId]);

  const toggleSupport = async (currentCount: number): Promise<boolean> => {
    try {
      setLoading(true);
      if (supported) {
        await removeSupport(reportId, anonymousId);
        setSupported(false);
        setSupportsCount(currentCount - 1);
        return false;
      } else {
        await supportReport(reportId, anonymousId);
        setSupported(true);
        setSupportsCount(currentCount + 1);
        return true;
      }
    } catch {
      return supported;
    } finally {
      setLoading(false);
    }
  };

  return { supported, supportsCount, loading, toggleSupport, setSupportsCount };
}

export function useReportUpdates(reportId: string) {
  const [updates, setUpdates] = useState<(ReportUpdate & { photos?: Photo[] })[]>([]);
  const [loading, setLoading] = useState(false);

  const loadUpdates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getReportUpdates(reportId);
      setUpdates(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    if (reportId) {
      loadUpdates();
    }
  }, [loadUpdates, reportId]);

  const addUpdate = async (
    status: 'SAME' | 'WORSE' | 'BETTER' | 'RESOLVED',
    description: string,
    anonymousId: string,
    latitude?: number,
    longitude?: number
  ) => {
    try {
      const update = await createReportUpdate(reportId, status, description, anonymousId, latitude, longitude);
      setUpdates(prev => [update, ...prev]);
      return update;
    } catch {
      return null;
    }
  };

  return { updates, loading, addUpdate, refresh: loadUpdates };
}

export function useReportRelations(reportId: string) {
  const [relations, setRelations] = useState<(ReportRelation & { related_report?: Report })[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRelations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getReportRelations(reportId);
      setRelations(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    if (reportId) {
      loadRelations();
    }
  }, [loadRelations, reportId]);

  const addRelation = async (
    relatedReportId: string,
    relationType: 'DUPLICATE' | 'RELATED' | 'CONTINUATION',
    anonymousId: string
  ) => {
    try {
      const relation = await createReportRelation(reportId, relatedReportId, relationType, anonymousId);
      setRelations(prev => [...prev, relation]);
      return relation;
    } catch {
      return null;
    }
  };

  return { relations, loading, addRelation, refresh: loadRelations };
}

export function useResolutionConfirmation(reportId: string, anonymousId: string) {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [count, setCount] = useState(0);
  const [resolved, setResolved] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const hasConfirmed = await hasUserConfirmedResolution(reportId, anonymousId);
      const confirmationsCount = await getResolutionConfirmationsCount(reportId);
      const isResolved = await isReportResolved(reportId);
      setConfirmed(hasConfirmed);
      setCount(confirmationsCount);
      setResolved(isResolved);
    } catch {
      // ignore
    }
  }, [reportId, anonymousId]);

  useEffect(() => {
    if (reportId && anonymousId) {
      loadStatus();
    }
  }, [loadStatus, reportId, anonymousId]);

  const confirm = async (): Promise<boolean> => {
    try {
      setLoading(true);
      const success = await confirmResolution(reportId, anonymousId);
      if (success) {
        setConfirmed(true);
        setCount(prev => prev + 1);
        const isResolved = await isReportResolved(reportId);
        setResolved(isResolved);
      }
      return success;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { confirmed, count, resolved, loading, confirm, refresh: loadStatus };
}

export function useSearchReports() {
  const [results, setResults] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await searchReports(query);
      setResults(data);
    } catch {
      setError('Erro ao buscar');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, error, search };
}