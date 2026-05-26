export interface PlanResponse {
  id: string;
  nom: string;
  code: string;
  description: string;
  prixMensuel: number;
  prixAnnuel: number;
  modules: string[];
  maxUtilisateurs: number;
  actif: boolean;
  createdAt: string;
}

export interface PlanRequest {
  nom: string;
  code: string;
  description: string;
  prixMensuel: number;
  prixAnnuel: number;
  modules: string[];
  maxUtilisateurs: number;
  actif: boolean;
}

export interface AbonnementResponse {
  id: string;
  nomEntreprise: string;
  emailContact: string;
  telephone: string;
  pays: string;
  plan: PlanResponse | null;
  statut: 'ESSAI' | 'ACTIF' | 'SUSPENDU' | 'RESILIE';
  periodicite: 'MENSUEL' | 'ANNUEL';
  dateDebut: string;
  dateFin: string | null;
  dateProchainRenouvellement: string | null;
  montantActuel: number;
  notes: string;
  createdAt: string;
}

export interface AbonnementRequest {
  nomEntreprise: string;
  emailContact: string;
  telephone: string;
  pays: string;
  planId: string;
  statut: string;
  periodicite: string;
  dateDebut: string;
  dateFin?: string;
  dateProchainRenouvellement?: string;
  montantActuel: number;
  notes?: string;
}

export interface FactureResponse {
  id: string;
  numero: string;
  abonnement: AbonnementResponse;
  periodeDebut: string;
  periodeFin: string;
  montantHt: number;
  tauxTva: number;
  montantTtc: number;
  statut: 'BROUILLON' | 'EN_ATTENTE' | 'PAYEE' | 'EN_RETARD' | 'ANNULEE';
  dateEcheance: string;
  datePaiement: string | null;
  notes: string;
  createdAt: string;
}

export interface FactureRequest {
  abonnementId: string;
  periodeDebut: string;
  periodeFin: string;
  montantHt: number;
  tauxTva: number;
  dateEcheance: string;
  notes?: string;
}

export interface PaiementRequest {
  factureId: string;
  modePaiement: string;
  montant: number;
  datePaiement: string;
  reference?: string;
  notes?: string;
}

export interface PaiementResponse {
  id: string;
  factureId: string;
  factureNumero: string;
  modePaiement: string;
  montant: number;
  datePaiement: string;
  reference: string;
  notes: string;
  createdAt: string;
}

export interface RevenusParPlan {
  planNom: string;
  nbClients: number;
  revenuMensuel: number;
}

export interface DashboardCommercial {
  nbClientsActifs: number;
  nbClientsEssai: number;
  nbClientsSuspendus: number;
  nbClientsResilies: number;
  mrr: number;
  arr: number;
  facturesEnAttente: number;
  facturesEnRetard: number;
  renouvellements30jours: number;
  revenusParPlan: RevenusParPlan[];
}
