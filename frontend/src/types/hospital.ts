export interface HospitalRequest {
  name: string;
  address: string;
  city: string;
  phone?: string;
  latitude: number;
  longitude: number;
}

export interface Hospital extends HospitalRequest {
  id: number;
}
