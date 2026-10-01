import { apiClient } from './apiClient';
import { AnalyzeRequest, CheckDuplicateRequest, AiAnalysisResult, DuplicateAnalysisResult } from '../types/ai';

export const aiService = {
  analyzeRequest: async (data: AnalyzeRequest): Promise<AiAnalysisResult> => {
    const response = await apiClient.post<AiAnalysisResult>('/api/ai/analyze-request', data);
    return response.data;
  },

  checkDuplicate: async (data: CheckDuplicateRequest): Promise<DuplicateAnalysisResult> => {
    const response = await apiClient.post<DuplicateAnalysisResult>('/api/ai/check-duplicate', data);
    return response.data;
  },
};
