import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ContactRequest, ContactResponse,
  LeadRequest, LeadResponse,
  ActiviteRequest, ActiviteResponse,
  TemplateRequest, TemplateResponse,
  CampagneRequest, CampagneResponse,
  DestinataireResponse, DashboardCrm
} from '../models/crm.model';

@Injectable({ providedIn: 'root' })
export class CrmService {
  private http = inject(HttpClient);
  private base = '/api/crm';

  // Dashboard
  getDashboard(): Observable<DashboardCrm> {
    return this.http.get<DashboardCrm>(`${this.base}/dashboard`);
  }

  // Contacts
  listerContacts(q?: string): Observable<ContactResponse[]> {
    const params = q ? new HttpParams().set('q', q) : undefined;
    return this.http.get<ContactResponse[]>(`${this.base}/contacts`, { params });
  }

  creerContact(req: ContactRequest): Observable<ContactResponse> {
    return this.http.post<ContactResponse>(`${this.base}/contacts`, req);
  }

  importerContacts(contacts: ContactRequest[]): Observable<ContactResponse[]> {
    return this.http.post<ContactResponse[]>(`${this.base}/contacts/import`, contacts);
  }

  mettreAJourContact(id: string, req: ContactRequest): Observable<ContactResponse> {
    return this.http.patch<ContactResponse>(`${this.base}/contacts/${id}`, req);
  }

  supprimerContact(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/contacts/${id}`);
  }

  activitesDuContact(id: string): Observable<ActiviteResponse[]> {
    return this.http.get<ActiviteResponse[]>(`${this.base}/contacts/${id}/activites`);
  }

  // Leads
  listerLeads(): Observable<LeadResponse[]> {
    return this.http.get<LeadResponse[]>(`${this.base}/leads`);
  }

  creerLead(req: LeadRequest): Observable<LeadResponse> {
    return this.http.post<LeadResponse>(`${this.base}/leads`, req);
  }

  mettreAJourLead(id: string, req: LeadRequest): Observable<LeadResponse> {
    return this.http.patch<LeadResponse>(`${this.base}/leads/${id}`, req);
  }

  changerEtape(id: string, etape: string): Observable<LeadResponse> {
    return this.http.patch<LeadResponse>(`${this.base}/leads/${id}/etape`, null, {
      params: new HttpParams().set('etape', etape)
    });
  }

  supprimerLead(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/leads/${id}`);
  }

  activitesDuLead(id: string): Observable<ActiviteResponse[]> {
    return this.http.get<ActiviteResponse[]>(`${this.base}/leads/${id}/activites`);
  }

  ajouterActivite(req: ActiviteRequest): Observable<ActiviteResponse> {
    return this.http.post<ActiviteResponse>(`${this.base}/activites`, req);
  }

  // Templates
  listerTemplates(): Observable<TemplateResponse[]> {
    return this.http.get<TemplateResponse[]>(`${this.base}/templates`);
  }

  creerTemplate(req: TemplateRequest): Observable<TemplateResponse> {
    return this.http.post<TemplateResponse>(`${this.base}/templates`, req);
  }

  mettreAJourTemplate(id: string, req: TemplateRequest): Observable<TemplateResponse> {
    return this.http.patch<TemplateResponse>(`${this.base}/templates/${id}`, req);
  }

  supprimerTemplate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/templates/${id}`);
  }

  // Campagnes
  listerCampagnes(): Observable<CampagneResponse[]> {
    return this.http.get<CampagneResponse[]>(`${this.base}/campagnes`);
  }

  creerCampagne(req: CampagneRequest): Observable<CampagneResponse> {
    return this.http.post<CampagneResponse>(`${this.base}/campagnes`, req);
  }

  listerDestinataires(id: string): Observable<DestinataireResponse[]> {
    return this.http.get<DestinataireResponse[]>(`${this.base}/campagnes/${id}/destinataires`);
  }

  lancerEnvoi(id: string): Observable<CampagneResponse> {
    return this.http.post<CampagneResponse>(`${this.base}/campagnes/${id}/envoyer`, null);
  }

  supprimerCampagne(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/campagnes/${id}`);
  }
}
