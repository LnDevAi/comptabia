import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DeclarationTva, SimulationTva, StatAnnuelle } from '../models/tva.model';

@Injectable({ providedIn: 'root' })
export class TvaService {
  constructor(private http: HttpClient) {}

  lister() {
    return this.http.get<DeclarationTva[]>('/api/tva');
  }

  simuler(debut: string, fin: string) {
    return this.http.get<SimulationTva>('/api/tva/simuler',
      { params: new HttpParams().set('debut', debut).set('fin', fin) });
  }

  getAnnuel(exercice: number) {
    return this.http.get<StatAnnuelle>('/api/tva/annuel',
      { params: new HttpParams().set('exercice', exercice) });
  }

  exportCsvUrl(exercice: number): string {
    return `/api/tva/export-csv?exercice=${exercice}`;
  }

  valider(periodeDebut: string, periodeFin: string) {
    return this.http.post<DeclarationTva>('/api/tva/valider', { periodeDebut, periodeFin });
  }

  supprimer(id: string) {
    return this.http.delete<void>(`/api/tva/${id}`);
  }
}
