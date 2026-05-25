import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RatiosData } from '../models/ratios.model';

@Injectable({ providedIn: 'root' })
export class RatiosService {
  constructor(private http: HttpClient) {}

  calculer(exercice: number) {
    return this.http.get<RatiosData>('/api/ratios',
      { params: new HttpParams().set('exercice', exercice) });
  }
}
