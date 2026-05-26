import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { LiasseFiscale } from '../models/liasse-fiscale.model';

@Injectable({ providedIn: 'root' })
export class LiasseFiscaleService {
  constructor(private http: HttpClient) {}

  get(exercice: number) {
    return this.http.get<LiasseFiscale>('/api/liasse-fiscale',
      { params: new HttpParams().set('exercice', exercice) });
  }
}
