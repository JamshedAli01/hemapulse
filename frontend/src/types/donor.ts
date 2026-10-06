export interface DonorRequest {
  user_id: number;
  blood_group: string;
  date_of_birth: string;
  city: string;
  latitude: number;
  longitude: number;
  is_available?: boolean;
  is_eligible?: boolean;
  last_donation_date?: string | null;
}

export interface DonorProfile extends DonorRequest {
  id: number;
}

export interface DonorProfileUpdate {
  city?: string;
  latitude?: number;
  longitude?: number;
  is_available?: boolean;
  last_donation_date?: string | null;
}

export type UpdateDonorAvailability = Pick<DonorProfileUpdate, 'is_available'> & {
  is_available: boolean;
};

export interface DonorListParams {
  blood_group?: string;
  city?: string;
  available?: boolean;
  page?: number;
  page_size?: number;
}

export interface DonorMatch {
  request_id: number;
  blood_group: string;
  urgency: string;
  units_required: number;
  units_fulfilled: number;
  hospital: string;
  city: string;
  address: string;
  distance_km: number | null;
  request_status: string;
  response_status: string | null;
  is_committed: boolean;
  is_active_match: boolean;
  is_history_match: boolean;
}
