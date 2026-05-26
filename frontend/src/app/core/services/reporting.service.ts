import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  SyntheseRh, RapportConges, RapportPresences,
  RapportNotesFrais, RapportPrets
} from '../models/reporting.model';

@Injectable({ providedIn: 'root' })
export class ReportingService {
  private base = '/api/reporting';
  constructor(private http: HttpClient) {}

  synthese()                             { return this.http.get<SyntheseRh>(`${this.base}/synthese`); }
  conges(annee: number)                  { return this.http.get<RapportConges>(`${this.base}/conges`, { params: new HttpParams().set('annee', annee) }); }
  presences(mois: number, annee: number) { return this.http.get<RapportPresences>(`${this.base}/presences`, { params: new HttpParams().set('mois', mois).set('annee', annee) }); }
  notesFrais(annee: number)              { return this.http.get<RapportNotesFrais>(`${this.base}/notes-frais`, { params: new HttpParams().set('annee', annee) }); }
  prets()                                { return this.http.get<RapportPrets>(`${this.base}/prets`); }
}
