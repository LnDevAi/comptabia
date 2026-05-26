export interface NotesAnnexesDocument {
  entrepriseNom:   string;
  pays:            string;
  referentiel:     string;
  devise:          string;
  exercice:        number;
  dateGeneration:  string;
  sections:        NotesAnnexesSection[];
}

export interface NotesAnnexesSection {
  numero:          number;
  titre:           string;
  type:            'TEXTE' | 'TABLEAU';
  texteIntro:      string;
  tableau:         { cellules: string[] }[];
  colonnes:        string[];
  texteConclusif:  string | null;
}
