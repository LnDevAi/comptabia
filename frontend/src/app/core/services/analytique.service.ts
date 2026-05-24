import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AxeAnalytique, RapportAnalytique } from '../models/analytique.model';

@Injectable({ providedIn: 'root' })
export class AnalytiqueService {
  constructor(private http: HttpClient) {}

  listerAxes() {
    return this.http.get<AxeAnalytique[]>('/api/analytique/axes');
  }

  creerAxe(code: string, intitule: string) {
    return this.http.post<AxeAnalytique>('/api/analytique/axes', { code, intitule });
  }

  modifierAxe(id: string, code: string, intitule: string) {
    return this.http.put<AxeAnalytique>(`/api/analytique/axes/${id}`, { code, intitule });
  }

  toggleActif(id: string) {
    return this.http.patch<void>(`/api/analytique/axes/${id}/toggle`, {});
  }

  supprimerAxe(id: string) {
    return this.http.delete<void>(`/api/analytique/axes/${id}`);
  }

  ventiler(ligneIds: string[], axeId: string | null) {
    return this.http.post<void>('/api/analytique/ventiler', { ligneIds, axeId });
  }

  rapport(debut: string, fin: string) {
    return this.http.get<RapportAnalytique>('/api/analytique/rapport',
      { params: new HttpParams().set('debut', debut).set('fin', fin) });
  }
}
