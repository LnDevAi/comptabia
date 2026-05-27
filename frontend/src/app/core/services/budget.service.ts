import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BudgetComparatif, BudgetUpsertRequest, LigneComparatif } from '../models/budget.model';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  constructor(private http: HttpClient) {}

  exercices() {
    return this.http.get<number[]>('/api/budgets/exercices');
  }

  getComparatif(exercice: number) {
    return this.http.get<BudgetComparatif>('/api/budgets',
      { params: new HttpParams().set('exercice', exercice) });
  }

  upsert(exercice: number, payload: BudgetUpsertRequest) {
    return this.http.post<LigneComparatif>(`/api/budgets/${exercice}`, payload);
  }

  delete(id: string) {
    return this.http.delete<void>(`/api/budgets/${id}`);
  }

  exportCsvUrl(exercice: number): string {
    return `/api/budgets/export-csv?exercice=${exercice}`;
  }
}
