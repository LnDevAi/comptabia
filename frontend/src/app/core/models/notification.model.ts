export type NotificationType =
  | 'HEARTBEAT' | 'CONNECTED'
  | 'ALERTE' | 'BROUILLON' | 'APPROBATION'
  | 'FACTURE_EN_RETARD' | 'BUDGET_DEPASSE';

export type NotificationSeverity = 'INFO' | 'WARNING' | 'DANGER';

export interface NotificationEvent {
  type:      NotificationType;
  message:   string;
  count:     number;
  severity:  NotificationSeverity;
  link:      string | null;
  timestamp: string;
  read?:     boolean;
}

export interface NotificationHistoryItem {
  id:        string;
  type:      string;
  message:   string;
  severity:  NotificationSeverity;
  link:      string | null;
  lu:        boolean;
  createdAt: string;
}

export interface NotificationRule {
  id:      string;
  type:    string;
  libelle: string;
  seuil:   number | null;
  enabled: boolean;
}

export interface PageResponse<T> {
  content:       T[];
  totalElements: number;
  totalPages:    number;
  number:        number;
  size:          number;
}

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  ALERTE:           'Alerte comptable',
  BROUILLON:        'Brouillon',
  APPROBATION:      'Approbation',
  FACTURE_EN_RETARD:'Facture en retard',
  BUDGET_DEPASSE:   'Budget dépassé',
};

export const NOTIFICATION_TYPE_COLORS: Record<string, string> = {
  ALERTE:           'bg-red-100 text-red-700',
  BROUILLON:        'bg-amber-100 text-amber-700',
  APPROBATION:      'bg-blue-100 text-blue-700',
  FACTURE_EN_RETARD:'bg-orange-100 text-orange-700',
  BUDGET_DEPASSE:   'bg-purple-100 text-purple-700',
};

export const RULE_NEEDS_SEUIL: Record<string, boolean> = {
  TRESORERIE_CRITIQUE: true,
  FACTURES_ECHEANCE:   true,
};
