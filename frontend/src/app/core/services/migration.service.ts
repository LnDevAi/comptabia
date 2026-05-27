import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ImportHistoriqueDto, ImportResultDto, PreviewDto } from '../models/migration.model';

@Injectable({ providedIn: 'root' })
export class MigrationService {
  private http = inject(HttpClient);
  private base = '/api/migration';

  preview(file: File, format: string): Observable<PreviewDto> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('format', format);
    return this.http.post<PreviewDto>(`${this.base}/preview`, fd);
  }

  importer(file: File, format: string, typeDonnees: string,
           mapping: Record<string, string>): Observable<ImportResultDto> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('format', format);
    fd.append('typeDonnees', typeDonnees);
    fd.append('mapping', JSON.stringify(mapping));
    return this.http.post<ImportResultDto>(`${this.base}/importer`, fd);
  }

  historique(): Observable<ImportHistoriqueDto[]> {
    return this.http.get<ImportHistoriqueDto[]>(`${this.base}/historique`);
  }
}
