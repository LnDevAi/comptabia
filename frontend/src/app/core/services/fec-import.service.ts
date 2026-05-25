import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FecImportResult } from '../models/fec-import.model';

@Injectable({ providedIn: 'root' })
export class FecImportService {
  constructor(private http: HttpClient) {}

  importer(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<FecImportResult>('/api/import/fec', form);
  }
}
