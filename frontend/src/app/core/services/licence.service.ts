import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { LicenceModule, LicenceStatus } from '../models/licence.model';

@Injectable({ providedIn: 'root' })
export class LicenceService {
  private http = inject(HttpClient);
  private _status = signal<LicenceStatus | null>(null);

  readonly status = this._status.asReadonly();

  load(): Observable<LicenceStatus> {
    return this.http.get<LicenceStatus>('/api/licence').pipe(
      tap(s => this._status.set(s)),
      catchError(() => {
        const fallback: LicenceStatus = { valid: false, info: null, error: 'Impossible de charger la licence' };
        this._status.set(fallback);
        return of(fallback);
      })
    );
  }

  hasModule(module: LicenceModule): boolean {
    const s = this._status();
    if (!s?.valid || !s.info) return false;
    return s.info.modules.includes(module);
  }

  isValid(): boolean {
    return this._status()?.valid ?? false;
  }
}
