export interface DonorResponseRequest {
  donor_id: number;
}

export interface DeclineRequest {
  donor_id: number;
  reason?: string;
}
