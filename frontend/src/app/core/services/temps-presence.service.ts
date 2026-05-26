import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  PointageResponse, AbsenceResponse, EtatMensuel,
  PointageRequest, AbsenceRequest
} from '../models/temps-presence.model';

@Injectable({ providedIn: 'root' })
export class TempsPresenceService {
  private base = '/api/temps-presences';
  constructor(private http: HttpClient) {}

  findPointages(mois: number, annee: number) {
    const params = new HttpParams().set('mois', mois).set('annee', annee);
    return this.http.get<PointageResponse[]>(`${this.base}/pointages`, { params });
  }

  createPointage(req: PointageRequest) {
    return this.http.post<PointageResponse>(`${this.base}/pointages`, req);
  }

  patchPointage(id: string, heureDepart: string | null, notes?: string) {
    return this.http.patch<PointageResponse>(`${this.base}/pointages/${id}`, { heureDepart, notes });
  }

  deletePointage(id: string) {
    return this.http.delete<void>(`${this.base}/pointages/${id}`);
  }

  findAbsences() {
    return this.http.get<AbsenceResponse[]>(`${this.base}/absences`);
  }

  createAbsence(req: AbsenceRequest) {
    return this.http.post<AbsenceResponse>(`${this.base}/absences`, req);
  }

  approuver(id: string) {
    return this.http.post<AbsenceResponse>(`${this.base}/absences/${id}/approuver`, {});
  }

  rejeter(id: string) {
    return this.http.post<AbsenceResponse>(`${this.base}/absences/${id}/rejeter`, {});
  }

  deleteAbsence(id: string) {
    return this.http.delete<void>(`${this.base}/absences/${id}`);
  }

  etatMensuel(mois: number, annee: number) {
    const params = new HttpParams().set('mois', mois).set('annee', annee);
    return this.http.get<EtatMensuel>(`${this.base}/etat-mensuel`, { params });
  }
}
