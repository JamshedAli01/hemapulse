export enum UserRole {
  ADMIN = 'ADMIN',
  REQUESTER = 'REQUESTER',
  DONOR = 'DONOR',
  HOSPITAL = 'HOSPITAL',
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
}

export interface AuthResponse {
  access_token: string;
  token_type?: string;
}
