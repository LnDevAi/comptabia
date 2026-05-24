import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AlerteResponse } from '../models/alerte.model';

@Injectable({ providedIn: 'root' })
export class AlerteService {
  readonly alertes = signal<AlerteResponse | null>(null);

  constructor(private http: HttpClient) {}

  charger() {
    this.http.get<AlerteResponse>('/api/alertes').subscribe({
      next: r => this.alertes.set(r),
    });
  }

  get total() {
    return this.alertes()?.total ?? 0;
  }
}
