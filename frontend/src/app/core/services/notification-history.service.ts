import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  NotificationHistoryItem, NotificationRule, PageResponse
} from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationHistoryService {
  constructor(private http: HttpClient) {}

  lister(lu?: boolean, page = 0, size = 30) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (lu !== undefined) params = params.set('lu', String(lu));
    return this.http.get<PageResponse<NotificationHistoryItem>>('/api/notifications', { params });
  }

  unreadCount() {
    return this.http.get<number>('/api/notifications/unread-count');
  }

  markRead(id: string) {
    return this.http.post<void>(`/api/notifications/${id}/lire`, {});
  }

  markAllRead() {
    return this.http.post<void>('/api/notifications/lire-tout', {});
  }

  getRules() {
    return this.http.get<NotificationRule[]>('/api/notifications/regles');
  }

  updateRule(id: string, enabled: boolean, seuil: number | null) {
    return this.http.put<NotificationRule>(`/api/notifications/regles/${id}`, { enabled, seuil });
  }
}
