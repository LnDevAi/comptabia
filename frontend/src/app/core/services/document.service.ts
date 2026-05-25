import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentItem, EntiteType } from '../models/document.model';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private http = inject(HttpClient);
  private base = '/api/documents';

  list(type: EntiteType, entiteId: string): Observable<DocumentItem[]> {
    return this.http.get<DocumentItem[]>(`${this.base}/${type}/${entiteId}`);
  }

  upload(type: EntiteType, entiteId: string, file: File): Observable<DocumentItem> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<DocumentItem>(`${this.base}/${type}/${entiteId}`, form);
  }

  downloadUrl(id: string): string {
    return `${this.base}/${id}/download`;
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
