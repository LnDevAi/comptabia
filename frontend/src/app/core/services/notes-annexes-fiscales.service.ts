import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NotesAnnexesDocument } from '../models/notes-annexes.model';

@Injectable({ providedIn: 'root' })
export class NotesAnnexesFiscalesService {
  private http = inject(HttpClient);
  private base = '/api/notes-annexes-fiscales';

  generer(exercice: number): Observable<NotesAnnexesDocument> {
    return this.http.get<NotesAnnexesDocument>(`${this.base}/${exercice}`);
  }
}
