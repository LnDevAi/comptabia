import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  BalanceData, BilanData, CompteResultatData, GrandLivreData,
  JournalLivreData, EtatRecettesDepensesData, EtatTresorerieData,
  FluxTresorerieData, EvcapData,
  NoteAnnexe, NoteAnnexeCreate, NoteAnnexeUpdate,
  NoteCatalogue, NoteComputeeData, EtatsDepuisBalance
} from '../models/etats.model';

@Injectable({ providedIn: 'root' })
export class EtatFinancierService {
  private readonly base = '/api/etats';
  constructor(private http: HttpClient) {}

  private params(exercice: number): HttpParams {
    return new HttpParams().set('exercice', exercice);
  }

  getBalance(exercice: number)         { return this.http.get<BalanceData>(`${this.base}/balance`, { params: this.params(exercice) }); }
  getBilan(exercice: number)            { return this.http.get<BilanData>(`${this.base}/bilan`, { params: this.params(exercice) }); }
  getCompteResultat(exercice: number)   { return this.http.get<CompteResultatData>(`${this.base}/compte-resultat`, { params: this.params(exercice) }); }
  getGrandLivre(exercice: number, compte: string) {
    const p = this.params(exercice).set('compte', compte);
    return this.http.get<GrandLivreData>(`${this.base}/grand-livre`, { params: p });
  }
  getJournal(exercice: number)          { return this.http.get<JournalLivreData>(`${this.base}/journal`, { params: this.params(exercice) }); }
  getRecettesDepenses(exercice: number) { return this.http.get<EtatRecettesDepensesData>(`${this.base}/smt/recettes-depenses`, { params: this.params(exercice) }); }
  getTresorerie(exercice: number)       { return this.http.get<EtatTresorerieData>(`${this.base}/smt/tresorerie`, { params: this.params(exercice) }); }
  getFluxTresorerie(exercice: number)   { return this.http.get<FluxTresorerieData>(`${this.base}/flux-tresorerie`, { params: this.params(exercice) }); }
  getEvcap(exercice: number)            { return this.http.get<EvcapData>(`${this.base}/evcap`, { params: this.params(exercice) }); }

  getNotes(exercice: number)                        { return this.http.get<NoteAnnexe[]>(`${this.base}/notes`, { params: this.params(exercice) }); }
  createNote(req: NoteAnnexeCreate)                 { return this.http.post<NoteAnnexe>(`${this.base}/notes`, req); }
  updateNote(id: string, req: NoteAnnexeUpdate)     { return this.http.put<NoteAnnexe>(`${this.base}/notes/${id}`, req); }
  deleteNote(id: string)                            { return this.http.delete<void>(`${this.base}/notes/${id}`); }

  getCatalogue()                                    { return this.http.get<NoteCatalogue[]>(`${this.base}/notes-catalogue`); }
  getNoteData(numero: number, exercice: number)     { return this.http.get<NoteComputeeData>(`${this.base}/notes-catalogue/${numero}/data`, { params: this.params(exercice) }); }

  importBalance(file: File, exercice: number) {
    const form = new FormData();
    form.append('file', file);
    form.append('exercice', String(exercice));
    return this.http.post<EtatsDepuisBalance>(`${this.base}/import-balance`, form);
  }
}
