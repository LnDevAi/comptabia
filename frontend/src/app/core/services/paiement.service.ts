import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  InitPaiementRequest, InitPaiementResponse,
  PlanPublic, SouscriptionSaas
} from '../models/paiement.model';

@Injectable({ providedIn: 'root' })
export class PaiementService {
  constructor(private http: HttpClient) {}

  getPlans() {
    return this.http.get<PlanPublic[]>('/api/public/plans');
  }

  initier(req: InitPaiementRequest) {
    return this.http.post<InitPaiementResponse>('/api/paiement/init', req);
  }

  mesSouscriptions() {
    return this.http.get<SouscriptionSaas[]>('/api/paiement/mes-souscriptions');
  }

  // Admin
  listAll() {
    return this.http.get<SouscriptionSaas[]>('/api/admin/souscriptions');
  }

  listEnAttente() {
    return this.http.get<SouscriptionSaas[]>('/api/admin/souscriptions/en-attente');
  }

  confirmerVirement(id: string) {
    return this.http.post<SouscriptionSaas>(`/api/admin/souscriptions/${id}/confirmer-virement`, null);
  }
}
