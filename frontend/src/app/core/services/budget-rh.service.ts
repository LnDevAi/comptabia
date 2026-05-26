import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BudgetRhUpsertRequest, ComparatifRh } from '../models/budget-rh.model';

@Injectable({ providedIn: 'root' })
export class BudgetRhService {
  private readonly base = '/api/budget-rh';
  constructor(private http: HttpClient) {}

  exercices() {
    return this.http.get<number[]>(`${this.base}/exercices`);
  }

  getComparatif(exercice: number) {
    return this.http.get<ComparatifRh>(`${this.base}/comparatif`,
      { params: new HttpParams().set('exercice', exercice) });
  }

  upsert(exercice: number, req: BudgetRhUpsertRequest) {
    return this.http.post<any>(`${this.base}/upsert`, req,
      { params: new HttpParams().set('exercice', exercice) });
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
