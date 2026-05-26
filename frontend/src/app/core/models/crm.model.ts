export type CrmSource = 'MANUEL' | 'IMPORT' | 'FORMULAIRE' | 'LINKEDIN' | 'REFERRAL' | 'AUTRE';
export type CrmStatutContact = 'ACTIF' | 'INACTIF' | 'DESABONNE';
export type CrmEtape = 'NOUVEAU' | 'QUALIFIE' | 'PROPOSITION' | 'NEGOCIATION' | 'GAGNE' | 'PERDU';
export type CrmTypeActivite = 'APPEL' | 'EMAIL_ENVOYE' | 'REUNION' | 'NOTE' | 'TACHE';
export type CrmTypeCampagne = 'EMAIL' | 'SMS';
export type CrmStatutCampagne = 'BROUILLON' | 'EN_COURS' | 'TERMINE' | 'ANNULE';
export type CrmStatutDestinataire = 'EN_ATTENTE' | 'ENVOYE' | 'OUVERT' | 'CLIQUE' | 'ECHEC';

export interface ContactRequest {
  nom: string; email?: string; telephone?: string;
  societe?: string; poste?: string; source?: string;
  tags?: string; statut?: string; score: number; notes?: string;
}

export interface ContactResponse {
  id: string; nom: string; email: string; telephone: string;
  societe: string; poste: string; source: string; tags: string;
  statut: CrmStatutContact; score: number; notes: string; createdAt: string;
}

export interface LeadRequest {
  contactId?: string; titre: string; valeur: number; probabilite: number;
  etape: CrmEtape; dateCloturePrevue?: string; produit?: string; notes?: string;
}

export interface LeadResponse {
  id: string; contact: ContactResponse | null; titre: string; valeur: number;
  probabilite: number; etape: CrmEtape; dateCloturePrevue: string;
  produit: string; notes: string; createdAt: string; updatedAt: string;
}

export interface EtapeStats { etape: CrmEtape; nbLeads: number; valeurTotale: number; }

export interface ActiviteRequest {
  leadId?: string; contactId?: string; type: CrmTypeActivite; contenu: string; dateActivite?: string;
}

export interface ActiviteResponse {
  id: string; type: CrmTypeActivite; contenu: string;
  dateActivite: string; auteurNom: string; createdAt: string;
}

export interface TemplateRequest {
  nom: string; type: CrmTypeCampagne; sujet?: string; contenu: string; variables?: string;
}

export interface TemplateResponse {
  id: string; nom: string; type: CrmTypeCampagne; sujet: string;
  contenu: string; variables: string; createdAt: string;
}

export interface CampagneRequest {
  nom: string; type: CrmTypeCampagne; sujet?: string; contenu: string;
  templateId?: string; contactIds?: string[]; filtreTag?: string;
  filtreStatut?: string; tousContacts: boolean;
}

export interface CampagneResponse {
  id: string; nom: string; type: CrmTypeCampagne; sujet: string;
  statut: CrmStatutCampagne; nbDestinataires: number; nbEnvoyes: number;
  nbOuverts: number; nbCliques: number; nbEchecs: number;
  dateEnvoiReel: string; createdAt: string;
}

export interface DestinataireResponse {
  id: string; nom: string; email: string; telephone: string;
  statut: CrmStatutDestinataire; erreur: string; sentAt: string;
}

export interface DashboardCrm {
  nbContacts: number; nbLeadsActifs: number;
  valeurPipelinePonderee: number; nbLeadsGagnes: number;
  tauxConversion: number; pipeline: EtapeStats[]; dernieresCampagnes: CampagneResponse[];
}

export const ETAPES_PIPELINE: { value: CrmEtape; label: string; color: string }[] = [
  { value: 'NOUVEAU',      label: 'Nouveau',      color: 'bg-gray-100 text-gray-700'   },
  { value: 'QUALIFIE',     label: 'Qualifié',     color: 'bg-blue-100 text-blue-700'   },
  { value: 'PROPOSITION',  label: 'Proposition',  color: 'bg-amber-100 text-amber-700' },
  { value: 'NEGOCIATION',  label: 'Négociation',  color: 'bg-orange-100 text-orange-700'},
  { value: 'GAGNE',        label: 'Gagné',        color: 'bg-green-100 text-green-700' },
  { value: 'PERDU',        label: 'Perdu',        color: 'bg-red-100 text-red-700'     },
];

export const TYPES_ACTIVITE: { value: CrmTypeActivite; label: string; icon: string }[] = [
  { value: 'APPEL',        label: 'Appel',       icon: '📞' },
  { value: 'EMAIL_ENVOYE', label: 'Email',       icon: '📧' },
  { value: 'REUNION',      label: 'Réunion',     icon: '🤝' },
  { value: 'NOTE',         label: 'Note',        icon: '📝' },
  { value: 'TACHE',        label: 'Tâche',       icon: '✅' },
];
