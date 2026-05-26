import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  FormationResponse, FormationSaveRequest, FormationUpdateRequest,
  SessionResponse, SessionSaveRequest, SessionUpdateRequest,
  InscriptionResponse, BilanCollaborateur
} from '../models/formation.model';

@Injectable({ providedIn: 'root' })
export class FormationService {
  private http = inject(HttpClient);
  private base = '/api/formation';

  findAll(): Observable<FormationResponse[]> {
    return this.http.get<FormationResponse[]>(this.base);
  }

  findByAnnee(annee: number): Observable<FormationResponse[]> {
    return this.http.get<FormationResponse[]>(`${this.base}/annee/${annee}`);
  }

  createFormation(req: FormationSaveRequest): Observable<FormationResponse> {
    return this.http.post<FormationResponse>(this.base, req);
  }

  updateFormation(id: string, req: FormationUpdateRequest): Observable<FormationResponse> {
    return this.http.put<FormationResponse>(`${this.base}/${id}`, req);
  }

  deleteFormation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  findSessions(): Observable<SessionResponse[]> {
    return this.http.get<SessionResponse[]>(`${this.base}/sessions`);
  }

  findSessionsByFormation(formationId: string): Observable<SessionResponse[]> {
    return this.http.get<SessionResponse[]>(`${this.base}/${formationId}/sessions`);
  }

  createSession(req: SessionSaveRequest): Observable<SessionResponse> {
    return this.http.post<SessionResponse>(`${this.base}/sessions`, req);
  }

  updateSession(id: string, req: SessionUpdateRequest): Observable<SessionResponse> {
    return this.http.put<SessionResponse>(`${this.base}/sessions/${id}`, req);
  }

  deleteSession(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/sessions/${id}`);
  }

  findInscriptions(sessionId: string): Observable<InscriptionResponse[]> {
    return this.http.get<InscriptionResponse[]>(`${this.base}/sessions/${sessionId}/inscriptions`);
  }

  mesFormations(): Observable<InscriptionResponse[]> {
    return this.http.get<InscriptionResponse[]>(`${this.base}/mes-formations`);
  }

  inscrire(sessionId: string, collaborateurId: string): Observable<InscriptionResponse> {
    return this.http.post<InscriptionResponse>(`${this.base}/sessions/${sessionId}/inscrire`, { collaborateurId });
  }

  updateInscription(id: string, req: { statut?: string; note?: number | null; commentaire?: string | null }): Observable<InscriptionResponse> {
    return this.http.put<InscriptionResponse>(`${this.base}/inscriptions/${id}`, req);
  }

  desinscrire(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/inscriptions/${id}`);
  }

  bilan(): Observable<BilanCollaborateur[]> {
    return this.http.get<BilanCollaborateur[]>(`${this.base}/bilan`);
  }
}
