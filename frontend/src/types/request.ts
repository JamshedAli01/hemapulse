export interface BloodRequestCreate {
  hospital_id: number;
  blood_group: string;
  units_required: number;
  units_fulfilled?: number;
  units_committed?: number;
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
  units_fulfilled?: number;
  current_user_response_status: 'ACCEPTED' | 'DECLINED' | null;
  committed_donor_count: number;
  units_scheduled: number;
  units_remaining_capacity: number;
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
  is_requester?: boolean;
  is_matched_donor?: boolean;
  current_user_donation?: {
    id: number;
    units: number;
    status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED';
    scheduled_at: string;
    confirmed_at: string | null;
  } | null;
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
