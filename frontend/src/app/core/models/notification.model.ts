export type NotificationType =
  | 'HEARTBEAT'
  | 'ALERTE'
  | 'BROUILLON'
  | 'FACTURE_EN_RETARD'
  | 'BUDGET_DEPASSE'
  | 'CONNECTED';

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
