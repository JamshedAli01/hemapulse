export interface AnalyzeRequest {
  request_id: number;
  description: string;
}

export interface CheckDuplicateRequest {
  request_id: number;
}

export interface AiAnalysisResult {
  summary?: string;
  urgency?: string;
  recommendations?: string[];
  [key: string]: unknown;
}

export interface DuplicateAnalysisResult {
  is_duplicate?: boolean;
  duplicate_request_ids?: number[];
  confidence_score?: number;
  reasoning?: string;
  [key: string]: unknown;
}
