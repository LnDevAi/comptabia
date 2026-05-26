import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CoursResume, CoursDetail, InscriptionResume,
  CertificatResponse, QuizSubmission, QuizResult, DashboardStats
} from '../models/academie.model';

@Injectable({ providedIn: 'root' })
export class AcademeService {
  private http = inject(HttpClient);
  private base = '/api/academie';

  stats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.base}/stats`);
  }

  catalogue(categorie?: string, niveau?: string): Observable<CoursResume[]> {
    let params = new HttpParams();
    if (categorie) params = params.set('categorie', categorie);
    if (niveau)    params = params.set('niveau', niveau);
    return this.http.get<CoursResume[]>(`${this.base}/cours`, { params });
  }

  detail(id: string): Observable<CoursDetail> {
    return this.http.get<CoursDetail>(`${this.base}/cours/${id}`);
  }

  inscrire(coursId: string): Observable<InscriptionResume> {
    return this.http.post<InscriptionResume>(`${this.base}/cours/${coursId}/inscrire`, {});
  }

  mesFormations(): Observable<InscriptionResume[]> {
    return this.http.get<InscriptionResume[]>(`${this.base}/mes-formations`);
  }

  marquerChapitre(inscriptionId: string, chapitreId: string): Observable<InscriptionResume> {
    return this.http.patch<InscriptionResume>(
      `${this.base}/inscriptions/${inscriptionId}/chapitres/${chapitreId}`, {});
  }

  soumettreQuiz(inscriptionId: string, body: QuizSubmission): Observable<QuizResult> {
    return this.http.post<QuizResult>(`${this.base}/inscriptions/${inscriptionId}/quiz`, body);
  }

  mesCertificats(): Observable<CertificatResponse[]> {
    return this.http.get<CertificatResponse[]>(`${this.base}/certificats`);
  }

  verifier(numero: string): Observable<CertificatResponse> {
    return this.http.get<CertificatResponse>(`${this.base}/certificats/verify/${numero}`);
  }
}
