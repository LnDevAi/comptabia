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
}

export interface BudgetSynthese {
  totalBudget:      number;
  totalReel:        number;
  tauxConsommation: number;
  nbDepassements:   number;
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
}
