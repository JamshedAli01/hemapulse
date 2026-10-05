export interface HospitalRequest {
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  phone?: string;
}

export interface Hospital extends HospitalRequest {
  id: number;
}

export interface LocationResult {
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  hospital_id?: number;
}
