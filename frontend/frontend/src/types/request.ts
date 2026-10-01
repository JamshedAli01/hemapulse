export interface BloodRequestCreate {
  hospital_id: number;
  blood_group: string;
  units_required: number;
  required_before: string; // ISO 8601 date-time
  description: string;
  latitude: number;
  longitude: number;
}

export interface BloodRequest {
  id: number;
  hospital_id: number;
  blood_group: string;
  units_required: number;
  required_before: string;
  description: string;
  latitude: number;
  longitude: number;
  status?: string;
  urgency?: string;
  verified?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Some backends also return nested hospital/user info
  hospital?: { id: number; name: string; city?: string };
  requester?: { id: number; name: string };
}

export interface VerifyRequest {
  verified: boolean;
  notes?: string;
}

export interface RequestListParams {
  status?: string;
  blood_group?: string;
  urgency?: string;
  page?: number;
  page_size?: number;
}
