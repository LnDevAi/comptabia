import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  GedDocumentSummary, GedDocumentDetail, GedTypeDocument, GedTag,
  GedStats, GedStatsMensuel, GedAuditEntry, GedDocumentRequest, PageResponse
} from '../models/ged.model';

@Injectable({ providedIn: 'root' })
export class GedService {
  private http = inject(HttpClient);
  private base = '/api/ged';

  stats(): Observable<GedStats> {
    return this.http.get<GedStats>(`${this.base}/stats`);
  }

  list(statut?: string, typeId?: string, search?: string, page = 0, size = 20):
      Observable<PageResponse<GedDocumentSummary>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (statut) params = params.set('statut', statut);
    if (typeId) params = params.set('typeId', typeId);
    if (search) params = params.set('search', search);
    return this.http.get<PageResponse<GedDocumentSummary>>(this.base, { params });
  }

  getById(id: string): Observable<GedDocumentDetail> {
    return this.http.get<GedDocumentDetail>(`${this.base}/${id}`);
  }

  create(dto: GedDocumentRequest, file?: File): Observable<GedDocumentDetail> {
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(dto)], { type: 'application/json' }));
    if (file) form.append('file', file);
    return this.http.post<GedDocumentDetail>(this.base, form);
  }

  updateMeta(id: string, dto: GedDocumentRequest): Observable<GedDocumentDetail> {
    return this.http.put<GedDocumentDetail>(`${this.base}/${id}/meta`, dto);
  }

  addVersion(id: string, file: File): Observable<GedDocumentDetail> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<GedDocumentDetail>(`${this.base}/${id}/versions`, form);
  }

  changeStatut(id: string, statut: string, commentaire?: string): Observable<GedDocumentDetail> {
    return this.http.patch<GedDocumentDetail>(`${this.base}/${id}/statut`, { statut, commentaire });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  downloadUrl(docId: string, versionId?: string): string {
    if (versionId) return `${this.base}/${docId}/versions/${versionId}/download`;
    return `${this.base}/${docId}/download`;
  }

  listTypes(): Observable<GedTypeDocument[]> {
    return this.http.get<GedTypeDocument[]>(`${this.base}/types`);
  }

  createType(dto: { code: string; libelle: string; description?: string }): Observable<GedTypeDocument> {
    return this.http.post<GedTypeDocument>(`${this.base}/types`, dto);
  }

  toggleType(id: string): Observable<GedTypeDocument> {
    return this.http.patch<GedTypeDocument>(`${this.base}/types/${id}/toggle`, {});
  }

  listTags(): Observable<GedTag[]> {
    return this.http.get<GedTag[]>(`${this.base}/tags`);
  }

  createTag(dto: { libelle: string; couleur?: string }): Observable<GedTag> {
    return this.http.post<GedTag>(`${this.base}/tags`, dto);
  }

  deleteTag(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/tags/${id}`);
  }

  getStatsMensuel(exercice: number): Observable<GedStatsMensuel> {
    return this.http.get<GedStatsMensuel>(`${this.base}/stats-mensuel`, {
      params: new HttpParams().set('exercice', exercice)
    });
  }

  listAudit(page = 0, size = 50): Observable<PageResponse<GedAuditEntry>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<GedAuditEntry>>(`${this.base}/audit`, { params });
  }
}
