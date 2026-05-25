import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { NotificationEvent, NotificationType } from '../models/notification.model';

const SSE_TYPES: NotificationType[] = [
  'HEARTBEAT', 'ALERTE', 'BROUILLON', 'FACTURE_EN_RETARD', 'BUDGET_DEPASSE', 'CONNECTED'
];

const MAX_NOTIFICATIONS = 30;
const RECONNECT_DELAY_MS = 10_000;

@Injectable({ providedIn: 'root' })
export class SseNotificationService implements OnDestroy {

  private auth   = inject(AuthService);
  private router = inject(Router);

  private es: EventSource | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  readonly notifications = signal<NotificationEvent[]>([]);
  readonly unread = computed(() => this.notifications().filter(n => !n.read).length);

  connect() {
    this.disconnect();
    const token = this.auth.getToken();
    if (!token) return;

    this.es = new EventSource(`/api/stream/events?token=${encodeURIComponent(token)}`);

    SSE_TYPES.forEach(type => {
      this.es!.addEventListener(type, (e) => this.handleEvent(type, (e as MessageEvent).data));
    });

    this.es.onerror = () => {
      this.es?.close();
      this.es = null;
      this.scheduleReconnect();
    };
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.es?.close();
    this.es = null;
  }

  markAllRead() {
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
  }

  navigate(link: string | null) {
    if (link) this.router.navigateByUrl(link);
  }

  ngOnDestroy() { this.disconnect(); }

  private handleEvent(type: NotificationType, raw: string) {
    if (type === 'HEARTBEAT' || type === 'CONNECTED') return;
    try {
      const event: NotificationEvent = { ...JSON.parse(raw), read: false };
      this.notifications.update(prev => [event, ...prev].slice(0, MAX_NOTIFICATIONS));
    } catch {}
  }

  private scheduleReconnect() {
    if (!this.auth.isLoggedIn()) return;
    this.reconnectTimer = setTimeout(() => this.connect(), RECONNECT_DELAY_MS);
  }
}
