// Matches the backend DonorCreate schema
export interface DonorRequest {
  blood_group: string;
  date_of_birth: string; // YYYY-MM-DD
  city: string;
  latitude: number;
  longitude: number;
  is_available?: boolean;
  last_donation_date?: string | null;
}

// Matches the backend DonorOut schema
export interface DonorProfile {
  id: number;
  user_id: number;
  blood_group: string;
  date_of_birth: string;
  city: string;
  latitude: number;
  longitude: number;
  is_available: boolean;
  is_eligible: boolean;
  last_donation_date: string | null;
  created_at: string;
  updated_at: string;
}

// Matches DonorUpdate (all fields optional for PUT)
export interface UpdateDonorAvailability {
  city?: string;
  latitude?: number;
  longitude?: number;
  is_available?: boolean;
  last_donation_date?: string | null;
}
