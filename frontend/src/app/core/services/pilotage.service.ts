import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PilotageData } from '../models/pilotage.model';

@Injectable({ providedIn: 'root' })
export class PilotageService {
  constructor(private http: HttpClient) {}

  get(exercice: number) {
    return this.http.get<PilotageData>('/api/pilotage',
      { params: new HttpParams().set('exercice', exercice) });
  }
}
