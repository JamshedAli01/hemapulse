import { apiClient } from './apiClient';
import { EscalateRequest, DonorMatch, MatchResult, EscalateResult, MapDataResult } from '../types/matching';

/**
 * Normalises the backend response to a flat DonorMatch array.
 * The YAML does not define a strict schema so the backend may return:
 *   - DonorMatch[]  (plain array)
 *   - { matches: DonorMatch[] }  (wrapped object)
 *   - { items: DonorMatch[] }
 * We handle all three shapes gracefully.
 */
function extractMatches(raw: unknown): DonorMatch[] {
  if (Array.isArray(raw)) return raw as DonorMatch[];
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.matches)) return obj.matches as DonorMatch[];
    if (Array.isArray(obj.items)) return obj.items as DonorMatch[];
  }
  return [];
}

export const matchingService = {
  /** POST /api/matching/{request_id}/run — trigger matching, returns ranked matches */
  runMatching: async (requestId: number): Promise<DonorMatch[]> => {
    const response = await apiClient.post<MatchResult | DonorMatch[]>(
      `/api/matching/${requestId}/run`
    );
    return extractMatches(response.data);
  },

  /** GET /api/matching/{request_id} — retrieve existing matches */
  getMatches: async (requestId: number): Promise<DonorMatch[]> => {
    const response = await apiClient.get<MatchResult | DonorMatch[]>(
      `/api/matching/${requestId}`
    );
    return extractMatches(response.data);
  },

  /** POST /api/matching/{request_id}/escalate — expand search radius + notify next batch */
  escalate: async (requestId: number, data: EscalateRequest): Promise<EscalateResult> => {
    const response = await apiClient.post<EscalateResult>(
      `/api/matching/${requestId}/escalate`,
      data
    );
    return response.data;
  },

  /** POST /api/matching/{request_id}/stop — terminate matching */
  stopMatching: async (requestId: number): Promise<void> => {
    await apiClient.post(`/api/matching/${requestId}/stop`);
  },

  /** GET /api/matching/{request_id}/map — map/geo data for visualisation */
  getMapData: async (requestId: number): Promise<MapDataResult> => {
    const response = await apiClient.get<MapDataResult>(`/api/matching/${requestId}/map`);
    return response.data;
  },
};
