import { statusTone, type StatusToneKey } from './tokens';
import type { ReportStatus, UpdateStatus } from '@/types';

/**
 * Mapeamento de estado -> tom semântico.
 * Fica no theme (não no componente) para evitar import circular
 * entre `theme/status` e `components/ReportStatus`.
 */
export const STATUS_TONE: Record<ReportStatus, StatusToneKey> = {
  ACTIVE: 'danger',
  IMPROVING: 'warning',
  RESOLVED: 'success',
  ARCHIVED: 'neutral',
};

/** Situação reportada numa atualização do histórico. */
export const UPDATE_STATUS_TONE: Record<UpdateStatus, StatusToneKey> = {
  SAME: 'neutral',
  WORSE: 'danger',
  BETTER: 'warning',
  RESOLVED: 'success',
};

export function getStatusTone(status: ReportStatus | string | undefined | null): StatusToneKey {
  return STATUS_TONE[status as ReportStatus] ?? 'neutral';
}

export function getUpdateStatusTone(status: UpdateStatus | string | undefined | null): StatusToneKey {
  return UPDATE_STATUS_TONE[status as UpdateStatus] ?? 'neutral';
}

/** Paleta completa do tom (fg, bg e borda). */
export function getStatusPalette(status: ReportStatus | string) {
  return statusTone[getStatusTone(status)];
}

export function getUpdateStatusPalette(status: UpdateStatus | string) {
  return statusTone[getUpdateStatusTone(status)];
}

/** Cor principal — usada em marcador de mapa e afins. */
export function getStatusColor(status: ReportStatus | string): string {
  return getStatusPalette(status).fg;
}

export function getUpdateStatusColor(status: UpdateStatus | string): string {
  return getUpdateStatusPalette(status).fg;
}

/** Fundo suave — círculos de timeline, marcadores. */
export function getStatusSoftColor(status: ReportStatus | string): string {
  return getStatusPalette(status).bg;
}