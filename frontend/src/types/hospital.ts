export interface HospitalRequest {
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  contact_phone?: string;
  contact_email?: string;
}

export interface Hospital extends HospitalRequest {
  id: number;
}
