import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { InstancierRequest, ModeleRequest, ModeleResponse } from '../models/modele.model';

@Injectable({ providedIn: 'root' })
export class ModeleService {
  constructor(private http: HttpClient) {}

  lister()                                   { return this.http.get<ModeleResponse[]>('/api/modeles'); }
  creer(req: ModeleRequest)                  { return this.http.post<ModeleResponse>('/api/modeles', req); }
  modifier(id: string, req: ModeleRequest)   { return this.http.put<ModeleResponse>(`/api/modeles/${id}`, req); }
  supprimer(id: string)                      { return this.http.delete(`/api/modeles/${id}`); }
  instancier(id: string, req: InstancierRequest) {
    return this.http.post<ModeleResponse>(`/api/modeles/${id}/instancier`, req);
  }
}
