export type Tendance = 'UP' | 'DOWN' | 'STABLE';

export interface KpiCard {
  label:        string;
  valeur:       number;
  precedent:    number | null;
  evolutionPct: number;
  tendance:     Tendance;
  unite:        string;
}

export interface MoisData {
  mois:      number;
  label:     string;
  ca:        number;
  charges:   number;
  resultat:  number;
  caN1:      number;
  chargesN1: number;
}

export interface BudgetSynthese {
  totalBudget:      number;
  totalReel:        number;
  tauxConsommation: number;
  nbDepassements:   number;
}

export interface CompteCharge {
  numero:   string;
  libelle:  string;
  montant:  number;
  partPct:  number;
}

export interface Ratios {
  margeNettePct:    number;
  tauxChargesPct:   number;
  dso:              number;
  tauxVariationCa:  number;
}

export interface Alerte {
  niveau:  'DANGER' | 'WARNING' | 'INFO';
  message: string;
}

export interface KpiExecutifResponse {
  exercice:          number;
  ca:                KpiCard;
  charges:           KpiCard;
  resultatNet:       KpiCard;
  tresorerie:        KpiCard;
  encoursClients:    KpiCard;
  budget:            BudgetSynthese;
  tendanceMensuelle: MoisData[];
  topCharges:        CompteCharge[];
  ratios:            Ratios;
  alertes:           Alerte[];
}
