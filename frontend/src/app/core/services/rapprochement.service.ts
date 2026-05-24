import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { EtatRapprochement, ImportResult } from '../models/rapprochement.model';

@Injectable({ providedIn: 'root' })
export class RapprochementService {
  constructor(private http: HttpClient) {}

  getComptes() {
    return this.http.get<string[]>('/api/rapprochement/comptes');
  }

  getEtat(compte: string) {
    return this.http.get<EtatRapprochement>('/api/rapprochement',
      { params: new HttpParams().set('compte', compte) });
  }

  importerReleve(compte: string, file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ImportResult>('/api/rapprochement/import', form,
      { params: new HttpParams().set('compte', compte) });
  }

  rapprocher(releveLigneId: string, ecritureLigneId: string) {
    return this.http.post<void>('/api/rapprochement/rapprocher', { releveLigneId, ecritureLigneId });
  }

  derapprocher(releveLigneId: string) {
    return this.http.post<void>(`/api/rapprochement/derapprocher/${releveLigneId}`, {});
  }

  supprimerReleve(id: string) {
    return this.http.delete<void>(`/api/rapprochement/releve/${id}`);
  }
}
