export type AlerteNiveau = 'INFO' | 'WARNING' | 'DANGER';

export interface Alerte {
  id: string;
  niveau: AlerteNiveau;
  titre: string;
  message: string;
  module: string;
  lien: string;
}

export interface AlerteResponse {
  alertes: Alerte[];
  countDanger: number;
  countWarning: number;
  countInfo: number;
  total: number;
}
