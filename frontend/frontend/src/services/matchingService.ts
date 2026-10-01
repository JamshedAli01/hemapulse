import { apiClient } from './apiClient';
import { DonorMatch, MatchListOut } from '../types/matching';

export const matchingService = {
  /**
   * GET /api/requests/{request_id}/matches
   * Retrieves (and generates if needed) donor matches for a blood request.
   */
  getMatches: async (requestId: number): Promise<MatchListOut> => {
    const response = await apiClient.get<MatchListOut>(
      `/api/requests/${requestId}/matches`
    );
    return response.data;
  },

  /**
   * POST /api/matches/{match_id}/accept
   * Donor accepts a match (must be authenticated as the matched donor's user).
   */
  acceptMatch: async (matchId: number): Promise<void> => {
    await apiClient.post(`/api/matches/${matchId}/accept`);
  },

  /**
   * POST /api/matches/{match_id}/reject
   * Donor rejects a match.
   */
  rejectMatch: async (matchId: number): Promise<void> => {
    await apiClient.post(`/api/matches/${matchId}/reject`);
  },
};

