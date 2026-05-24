import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { InvoiceAnalysis, ChatRequest, ChatResponse } from '../models/ia.model';

@Injectable({ providedIn: 'root' })
export class IaService {
  constructor(private http: HttpClient) {}

  analyserFacture(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<InvoiceAnalysis>('/api/ia/analyser-facture', form);
  }

  chat(req: ChatRequest) {
    return this.http.post<ChatResponse>('/api/ia/chat', req);
  }
}
