export interface DonationCreate {
  request_id: number;
  donor_id: number;
  units: number;
}

export enum ConfirmationMethod {
  MANUAL = 'MANUAL',
  HOSPITAL = 'HOSPITAL',
  QR = 'QR',
}

export interface ConfirmDonation {
  confirmation_method: ConfirmationMethod;
}

export interface ConfirmQRRequest {
  qr_token: string;
}

/**
 * Donation record returned after creation or QR generation.
 * YAML does not define a strict response schema.
 */
export interface Donation {
  id: number;
  request_id: number;
  donor_id: number;
  units: number;
  status?: string;
  confirmation_method?: ConfirmationMethod | string;
  confirmed?: boolean;
  created_at?: string;
  [key: string]: unknown;
}

export interface QRTokenResponse {
  qr_token?: string;
  token?: string;
  qr_code?: string;
  donation_id?: number;
  [key: string]: unknown;
}
