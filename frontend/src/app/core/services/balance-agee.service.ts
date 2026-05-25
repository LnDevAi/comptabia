import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BalanceAgeeResponse } from '../models/balance-agee.model';

@Injectable({ providedIn: 'root' })
export class BalanceAgeeService {
  constructor(private http: HttpClient) {}

  calculer(type: 'CLIENT' | 'FOURNISSEUR') {
    const params = new HttpParams().set('type', type);
    return this.http.get<BalanceAgeeResponse>('/api/balance-agee', { params });
  }
}
