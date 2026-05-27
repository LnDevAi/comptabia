export type GedStatut = 'BROUILLON' | 'EN_ATTENTE' | 'APPROUVE' | 'ARCHIVE';

export interface GedDocumentSummary {
  id: string;
  titre: string;
  statut: GedStatut;
  typeDocumentLibelle: string | null;
  referenceExterne: string | null;
  dateDocument: string | null;
  typeEntite: string | null;
  createdAt: string;
  createdByNom: string | null;
  nombreVersions: number;
  tailleBytes: number;
  tags: string[];
}

export interface GedDocumentDetail {
  id: string;
  titre: string;
  description: string | null;
  statut: GedStatut;
  typeDocumentLibelle: string | null;
  typeDocumentId: string | null;
  referenceExterne: string | null;
  dateDocument: string | null;
  typeEntite: string | null;
  entiteId: string | null;
  createdAt: string;
  updatedAt: string;
  createdByNom: string | null;
  versions: GedVersionInfo[];
  tags: string[];
  workflow: GedWorkflowEntry[];
}

export interface GedVersionInfo {
  id: string;
  numero: number;
  nomFichier: string;
  contentType: string;
  taille: number;
  createdAt: string;
  uploadedByNom: string | null;
}

export interface GedWorkflowEntry {
  statutAvant: string | null;
  statutApres: string;
  commentaire: string | null;
  faitLe: string;
  faitParNom: string | null;
}

export interface GedTypeDocument {
  id: string;
  code: string;
  libelle: string;
  description: string | null;
  actif: boolean;
}

export interface GedTag {
  id: string;
  libelle: string;
  couleur: string;
}

export interface GedStats {
  totalDocuments: number;
  brouillons: number;
  enAttente: number;
  approuves: number;
  archives: number;
  totalVersions: number;
  tailleStockageMo: number;
}

export interface GedMoisGed {
  mois: number;
  label: string;
  nb: number;
}

export interface GedStatsMensuel {
  exercice: number;
  totalCreations: number;
  mensuel: GedMoisGed[];
}

export interface GedAuditEntry {
  id: string;
  documentId: string;
  action: string;
  details: string | null;
  faitParEmail: string | null;
  createdAt: string;
}

export interface GedDocumentRequest {
  titre: string;
  description?: string;
  typeDocumentId?: string | null;
  typeEntite?: string | null;
  entiteId?: string | null;
  referenceExterne?: string | null;
  dateDocument?: string | null;
  tagIds?: string[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
