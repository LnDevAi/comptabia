export interface AuditEvent {
  id: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityRef: string | null;
  details: string | null;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const ACTION_LABELS: Record<string, string> = {
  ECRITURE_CREEE:     'Écriture créée',
  ECRITURE_VALIDEE:   'Écriture validée',
  ECRITURE_SUPPRIMEE: 'Écriture supprimée',
  EXERCICE_CLOTURE:   'Exercice clôturé',
  LETTRAGE_APPLIQUE:  'Lettrage appliqué',
  LETTRAGE_ANNULE:    'Lettrage annulé',
};

export const ACTION_COLORS: Record<string, string> = {
  ECRITURE_CREEE:     'bg-blue-100 text-blue-700',
  ECRITURE_VALIDEE:   'bg-green-100 text-green-700',
  ECRITURE_SUPPRIMEE: 'bg-red-100 text-red-700',
  EXERCICE_CLOTURE:   'bg-purple-100 text-purple-700',
  LETTRAGE_APPLIQUE:  'bg-teal-100 text-teal-700',
  LETTRAGE_ANNULE:    'bg-orange-100 text-orange-700',
};
