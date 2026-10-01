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

export interface UpdateDonorAvailability {
  is_available: boolean;
}

export interface DonorListParams {
  blood_group?: string;
  city?: string;
  available?: boolean;
  page?: number;
  page_size?: number;
}
