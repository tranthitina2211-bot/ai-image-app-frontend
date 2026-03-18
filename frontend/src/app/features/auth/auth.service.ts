import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppSettings } from '@models/app-settings.model';
import { environment } from 'src/environments/environment';

export interface AuthApiUser {
  id: number;
  name: string;
  email: string;
  plan?: string;
}

export interface AuthApiPayload {
  token: string;
  token_type: string;
  user: AuthApiUser;
  settings?: AppSettings | null;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta: Record<string, unknown>;
  errors?: Record<string, string[] | string>;
}

export interface MePayload {
  id: number;
  name: string;
  email: string;
  plan?: string;
  settings?: AppSettings | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  login(payload: { email: string; password: string; device_name?: string }): Observable<ApiEnvelope<AuthApiPayload>> {
    return this.http.post<ApiEnvelope<AuthApiPayload>>('/api/auth/login', payload);
  }

  register(payload: { name: string; email: string; password: string; password_confirmation: string; device_name?: string }): Observable<ApiEnvelope<AuthApiPayload>> {
    return this.http.post<ApiEnvelope<AuthApiPayload>>('/api/auth/register', payload);
  }

  me(): Observable<ApiEnvelope<MePayload>> {
    return this.http.get<ApiEnvelope<MePayload>>('/api/me');
  }

  logout(): Observable<ApiEnvelope<null>> {
    return this.http.post<ApiEnvelope<null>>('/api/auth/logout', {});
  }

  getSocialLoginUrl(provider: 'google' | 'github' | 'facebook'): string {
    const frontendUrl = `${window.location.origin}/auth/login`;
    return `${environment.apiBaseUrl}/api/auth/oauth/${provider}/redirect?frontend_url=${encodeURIComponent(frontendUrl)}`;
  }
}
