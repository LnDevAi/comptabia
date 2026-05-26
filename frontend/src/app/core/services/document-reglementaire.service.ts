import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  DocumentReglementaireResponse,
  CreateDocumentRequest,
  UpdateDocumentRequest
} from '../models/document-reglementaire.model';

@Injectable({ providedIn: 'root' })
export class DocumentReglementaireService {
  private base = '/api/documents-reglementaires';

  constructor(private http: HttpClient) {}

  lister() {
    return this.http.get<DocumentReglementaireResponse[]>(this.base);
  }

  echeances() {
    return this.http.get<DocumentReglementaireResponse[]>(`${this.base}/echeances`);
  }

  creer(req: CreateDocumentRequest) {
    return this.http.post<DocumentReglementaireResponse>(this.base, req);
  }

  mettrAJour(id: string, req: UpdateDocumentRequest) {
    return this.http.patch<DocumentReglementaireResponse>(`${this.base}/${id}`, req);
  }

  uploadFichier(id: string, fichier: File) {
    const fd = new FormData();
    fd.append('fichier', fichier);
    return this.http.post<DocumentReglementaireResponse>(`${this.base}/${id}/fichier`, fd);
  }

  downloadFichier(id: string) {
    return this.http.get(`${this.base}/${id}/fichier`, {
      responseType: 'blob',
      observe: 'response'
    });
  }

  supprimer(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
