// From YAML schema (line 111-117)
export interface EscalateRequest {
  current_radius_km: number;
  next_radius_km: number;
  batch_size: number;
}

/**
 * A single ranked donor match returned by the backend.
 * The YAML response body is unspecified ({description: Matches}),
 * so we type based on what a smart-matching FastAPI backend typically returns.
 * Optional fields handle any fields the actual backend may or may not include.
 */
export interface DonorMatch {
  donor_id: number;
  rank?: number;
  score?: number;
  distance_km?: number;
  blood_group?: string;
  is_available?: boolean;
  is_eligible?: boolean;
  city?: string;
  latitude?: number;
  longitude?: number;
  // Nested donor profile if the backend embeds it
  donor?: {
    id: number;
    name?: string;
    blood_group?: string;
    city?: string;
    is_available?: boolean;
    is_eligible?: boolean;
    last_donation_date?: string;
  };
  // Nested user info if the backend embeds it
  user?: {
    id: number;
    name?: string;
    email?: string;
    phone?: string;
  };
}

/**
 * The response from POST /api/matching/{request_id}/run
 * or GET /api/matching/{request_id}
 * The YAML only specifies {description: Ranked donor matches / Matches}
 * so we handle both a plain array and a wrapped object.
 */
export interface MatchResult {
  matches?: DonorMatch[];
  total?: number;
  request_id?: number;
  status?: string;
  radius_km?: number;
  [key: string]: unknown;
}

export interface EscalateResult {
  matched_count?: number;
  notified_count?: number;
  next_radius_km?: number;
  [key: string]: unknown;
}

export interface MapDataResult {
  request_location?: { latitude: number; longitude: number };
  donors?: Array<{
    id: number;
    latitude: number;
    longitude: number;
    distance_km?: number;
    blood_group?: string;
  }>;
  hospitals?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    distance_km?: number;
  }>;
  [key: string]: unknown;
}
