import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  NoteFraisResume, NoteFraisResponse,
  NoteFraisSaveRequest, RejeterRequest
} from '../models/note-frais.model';

@Injectable({ providedIn: 'root' })
export class NoteFraisService {
  private http = inject(HttpClient);
  private base = '/api/notes-frais';

  findAll(): Observable<NoteFraisResume[]> {
    return this.http.get<NoteFraisResume[]>(this.base);
  }

  mesNotes(): Observable<NoteFraisResume[]> {
    return this.http.get<NoteFraisResume[]>(`${this.base}/mes-notes`);
  }

  soumises(): Observable<NoteFraisResume[]> {
    return this.http.get<NoteFraisResume[]>(`${this.base}/soumises`);
  }

  findOne(id: string): Observable<NoteFraisResponse> {
    return this.http.get<NoteFraisResponse>(`${this.base}/${id}`);
  }

  create(req: NoteFraisSaveRequest): Observable<NoteFraisResponse> {
    return this.http.post<NoteFraisResponse>(this.base, req);
  }

  update(id: string, req: NoteFraisSaveRequest): Observable<NoteFraisResponse> {
    return this.http.put<NoteFraisResponse>(`${this.base}/${id}`, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  soumettre(id: string): Observable<NoteFraisResponse> {
    return this.http.post<NoteFraisResponse>(`${this.base}/${id}/soumettre`, {});
  }

  approuver(id: string): Observable<NoteFraisResponse> {
    return this.http.post<NoteFraisResponse>(`${this.base}/${id}/approuver`, {});
  }

  rejeter(id: string, req: RejeterRequest): Observable<NoteFraisResponse> {
    return this.http.post<NoteFraisResponse>(`${this.base}/${id}/rejeter`, req);
  }

  rembourser(id: string): Observable<NoteFraisResponse> {
    return this.http.post<NoteFraisResponse>(`${this.base}/${id}/rembourser`, {});
  }
}
