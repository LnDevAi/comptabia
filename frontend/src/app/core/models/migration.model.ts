export type FormatImport = 'FEC' | 'EXCEL_CSV' | 'SAGE' | 'EBP' | 'WAVESOFT' | 'SOLDES';
export type TypeDonnees = 'ECRITURES' | 'TIERS' | 'PLAN_COMPTABLE' | 'SOLDES';

export interface ColonneMapping {
  colonneSource: string;
  champCible: string;
}

export interface PreviewDto {
  colonnes: string[];
  lignes: string[][];
  totalLignes: number;
  separateurDetecte: string;
  mappingSuggere: ColonneMapping[];
}

export interface LigneErreur {
  ligne: number;
  reference: string;
  message: string;
}

export interface ImportResultDto {
  nbImportes: number;
  nbIgnores: number;
  nbErreurs: number;
  erreurs: LigneErreur[];
  historiquId: string | null;
}

export interface ImportHistoriqueDto {
  id: string;
  format: string;
  typeDonnees: string;
  statut: string;
  nbImportes: number;
  nbIgnores: number;
  nbErreurs: number;
  nomFichier: string;
  createdAt: string;
  utilisateurNom: string;
}

export const FORMATS_LOGICIEL: { value: FormatImport; label: string; extensions: string[] }[] = [
  { value: 'FEC',       label: 'FEC (Fichier d\'Écritures Comptables)',    extensions: ['.txt', '.csv'] },
  { value: 'SAGE',      label: 'Sage Comptabilité',                        extensions: ['.csv', '.txt'] },
  { value: 'EBP',       label: 'EBP Comptabilité',                         extensions: ['.csv', '.txt'] },
  { value: 'WAVESOFT',  label: 'WaveSoft Compta',                          extensions: ['.csv', '.txt'] },
  { value: 'EXCEL_CSV', label: 'Excel / CSV générique',                    extensions: ['.xlsx', '.xls', '.csv'] },
  { value: 'SOLDES',    label: 'Soldes d\'ouverture',                      extensions: ['.xlsx', '.csv'] },
];

export const TYPES_DONNEES: { value: TypeDonnees; label: string; formats: FormatImport[] }[] = [
  { value: 'ECRITURES',     label: 'Écritures comptables',   formats: ['FEC', 'SAGE', 'EBP', 'WAVESOFT', 'EXCEL_CSV'] },
  { value: 'TIERS',         label: 'Tiers (clients/fournisseurs)', formats: ['EXCEL_CSV', 'SAGE', 'EBP', 'WAVESOFT'] },
  { value: 'PLAN_COMPTABLE',label: 'Plan comptable',          formats: ['EXCEL_CSV', 'SAGE', 'EBP', 'WAVESOFT'] },
  { value: 'SOLDES',        label: 'Soldes d\'ouverture',     formats: ['SOLDES', 'EXCEL_CSV'] },
];

export const CHAMPS_CIBLES: Record<TypeDonnees, { value: string; label: string }[]> = {
  ECRITURES: [
    { value: 'journal',  label: 'Code journal' },
    { value: 'date',     label: 'Date' },
    { value: 'piece',    label: 'N° pièce' },
    { value: 'compte',   label: 'Compte' },
    { value: 'libelle',  label: 'Libellé' },
    { value: 'debit',    label: 'Débit' },
    { value: 'credit',   label: 'Crédit' },
  ],
  TIERS: [
    { value: 'code',      label: 'Code tiers' },
    { value: 'nom',       label: 'Nom / Raison sociale' },
    { value: 'email',     label: 'Email' },
    { value: 'telephone', label: 'Téléphone' },
    { value: 'adresse',   label: 'Adresse' },
    { value: 'typeTiers', label: 'Type (CLIENT/FOURNISSEUR)' },
  ],
  PLAN_COMPTABLE: [
    { value: 'compte',  label: 'Numéro de compte' },
    { value: 'libelle', label: 'Intitulé' },
  ],
  SOLDES: [
    { value: 'compte',     label: 'Numéro de compte' },
    { value: 'libelle',    label: 'Intitulé' },
    { value: 'soldeDebit', label: 'Solde débiteur' },
    { value: 'soldeCredit',label: 'Solde créditeur' },
  ],
};
