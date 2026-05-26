import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ObjectifResponse, EvaluationResponse,
  ObjectifSaveRequest, EvaluationSaveRequest, EvaluationCreateRequest
} from '../models/evaluation.model';

@Injectable({ providedIn: 'root' })
export class EvaluationService {
  private http = inject(HttpClient);
  private base = '/api/evaluations';

  // Objectifs
  mesObjectifs(annee: number): Observable<ObjectifResponse[]> {
    return this.http.get<ObjectifResponse[]>(`${this.base}/objectifs`, { params: { annee } });
  }

  allObjectifs(annee: number): Observable<ObjectifResponse[]> {
    return this.http.get<ObjectifResponse[]>(`${this.base}/objectifs/all`, { params: { annee } });
  }

  createObjectif(collaborateurId: string, req: ObjectifSaveRequest): Observable<ObjectifResponse> {
    return this.http.post<ObjectifResponse>(`${this.base}/objectifs`, req, { params: { collaborateurId } });
  }

  updateObjectif(id: string, req: ObjectifSaveRequest): Observable<ObjectifResponse> {
    return this.http.put<ObjectifResponse>(`${this.base}/objectifs/${id}`, req);
  }

  deleteObjectif(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/objectifs/${id}`);
  }

  // Evaluations
  mesEvaluations(): Observable<EvaluationResponse[]> {
    return this.http.get<EvaluationResponse[]>(`${this.base}/mes-evaluations`);
  }

  allEvaluations(): Observable<EvaluationResponse[]> {
    return this.http.get<EvaluationResponse[]>(this.base);
  }

  soumises(): Observable<EvaluationResponse[]> {
    return this.http.get<EvaluationResponse[]>(`${this.base}/soumises`);
  }

  findOne(id: string): Observable<EvaluationResponse> {
    return this.http.get<EvaluationResponse>(`${this.base}/${id}`);
  }

  create(req: EvaluationCreateRequest): Observable<EvaluationResponse> {
    return this.http.post<EvaluationResponse>(this.base, req);
  }

  saveLignes(id: string, req: EvaluationSaveRequest): Observable<EvaluationResponse> {
    return this.http.put<EvaluationResponse>(`${this.base}/${id}/lignes`, req);
  }

  soumettre(id: string): Observable<EvaluationResponse> {
    return this.http.post<EvaluationResponse>(`${this.base}/${id}/soumettre`, {});
  }

  valider(id: string): Observable<EvaluationResponse> {
    return this.http.post<EvaluationResponse>(`${this.base}/${id}/valider`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
