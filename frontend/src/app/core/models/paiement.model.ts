export interface PlanPublic {
  code: string;
  nom: string;
  description: string;
  prixMensuel: number;
  prixAnnuel: number;
  modules: string[];
  maxUtilisateurs: number;
  populaire: boolean;
}

export type ModePaiement = 'CINETPAY' | 'STRIPE' | 'VIREMENT';
export type Periodicite  = 'MENSUEL' | 'ANNUEL';

export interface InitPaiementRequest {
  planCode: string;
  periodicite: Periodicite;
  modePaiement: ModePaiement;
  customerName: string;
  customerEmail: string;
}

export interface VirementDetails {
  banque: string;
  titulaire: string;
  iban: string;
  swift: string;
  reference: string;
  montant: number;
  instructions: string;
}

export interface InitPaiementResponse {
  souscriptionId: string;
  statut: string;
  modePaiement: ModePaiement;
  paymentUrl: string | null;
  virementDetails: VirementDetails | null;
  montant: number;
  planCode: string;
  periodicite: Periodicite;
}

export interface SouscriptionSaas {
  id: string;
  entrepriseId: string;
  entrepriseNom: string;
  planCode: string;
  periodicite: string;
  montant: number;
  modePaiement: string;
  statut: string;
  customerName: string;
  customerEmail: string;
  referenceVirement: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  createdAt: string;
  confirmedAt: string | null;
}
