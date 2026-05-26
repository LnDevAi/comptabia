import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import {
  AuthResponse, LoginPayload, RegisterPayload,
  TokenPayload, ProfileResponse, UpdateProfilePayload, TotpSetupResponse
} from '../models/auth.model';

const TOKEN_KEY = 'ec_token';
const USER_KEY  = 'ec_user';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly currentUser = signal<AuthResponse | null>(this.loadUser());

  readonly user = this.currentUser.asReadonly();

  constructor(private http: HttpClient, private router: Router) {}

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', payload).pipe(
      tap(res => {
        if (!res.requiresTwoFactor) {
          this.storeSession(res);
        }
      })
    );
  }

  verify2fa(tempToken: string, code: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/2fa/verify', { tempToken, code }).pipe(
      tap(res => this.storeSession(res))
    );
  }

  register(payload: RegisterPayload) {
    return this.http.post<AuthResponse>('/api/auth/register', payload).pipe(
      tap(res => this.storeSession(res))
    );
  }

  logout() {
    const token = this.getToken();
    if (token) {
      this.http.post('/api/auth/logout', {}).subscribe({ error: () => {} });
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getProfile() {
    return this.http.get<ProfileResponse>('/api/auth/me');
  }

  updateProfile(payload: UpdateProfilePayload) {
    return this.http.patch<ProfileResponse>('/api/auth/me', payload).pipe(
      tap(profile => {
        const current = this.currentUser();
        if (current) {
          const updated: AuthResponse = { ...current, nom: profile.nom, email: profile.email };
          localStorage.setItem(USER_KEY, JSON.stringify(updated));
          this.currentUser.set(updated);
        }
      })
    );
  }

  // ─── 2FA management ──────────────────────────────────────────────────────

  get2faStatus(): Observable<{ totpEnabled: boolean }> {
    return this.http.get<{ totpEnabled: boolean }>('/api/auth/2fa/status');
  }

  setup2fa(): Observable<TotpSetupResponse> {
    return this.http.get<TotpSetupResponse>('/api/auth/2fa/setup');
  }

  enable2fa(code: string): Observable<void> {
    return this.http.post<void>('/api/auth/2fa/enable', { code });
  }

  disable2fa(code: string): Observable<void> {
    return this.http.post<void>('/api/auth/2fa/disable', { code });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = this.decodeToken(token);
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  decodeToken(token: string): TokenPayload {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  }

  private storeSession(res: AuthResponse) {
    if (!res.token) return;
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res));
    this.currentUser.set(res);
  }

  private loadUser(): AuthResponse | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
