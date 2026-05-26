import { BilanData, CompteResultatData, FluxTresorerieData, EvcapData, NoteAnnexe } from './etats.model';

export interface EnteteliasseFiscale {
  nomEntreprise: string;
  rccm: string | null;
  nif: string | null;
  ifu: string | null;
  adresse: string | null;
  pays: string;
  referentiel: string;
  exercice: number;
  dateGeneration: string;
}

export interface LiasseFiscale {
  entete: EnteteliasseFiscale;
  bilan: BilanData;
  compteResultat: CompteResultatData;
  tft: FluxTresorerieData;
  evcap: EvcapData;
  notes: NoteAnnexe[];
}
