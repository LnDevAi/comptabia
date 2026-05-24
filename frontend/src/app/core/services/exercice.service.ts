import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ExerciceComptable, ClotureResponse } from '../models/exercice.model';

@Injectable({ providedIn: 'root' })
export class ExerciceService {
  constructor(private http: HttpClient) {}

  lister()                           { return this.http.get<ExerciceComptable[]>('/api/exercices'); }
  cloturer(annee: number)            { return this.http.post<ClotureResponse>(`/api/exercices/${annee}/cloturer`, {}); }
}
