import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NotificationHistoryService } from '../../core/services/notification-history.service';
import { SseNotificationService } from '../../core/services/sse-notification.service';
import {
  NotificationHistoryItem, NotificationRule, PageResponse,
  NOTIFICATION_TYPE_LABELS, NOTIFICATION_TYPE_COLORS, RULE_NEEDS_SEUIL
} from '../../core/models/notification.model';

@Component({
  selector: 'app-notifications',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="p-6 max-w-5xl mx-auto space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold text-gray-800">Centre de notifications</h1>
      <p class="text-sm text-gray-500 mt-0.5">Historique persistant · Règles configurables</p>
    </div>
    <div class="flex items-center gap-2">
      @if (sseSvc.unread() > 0) {
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
          {{ sseSvc.unread() }} non lu(s) en temps réel
        </span>
      }
      <button (click)="markAllRead()"
              class="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">
        Tout marquer comme lu
      </button>
    </div>
  </div>

  <!-- Onglets -->
  <div class="flex gap-1 border-b border-gray-200">
    @for (tab of tabs; track tab.key) {
      <button (click)="activeTab = tab.key"
              class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
              [ngClass]="activeTab === tab.key
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'">
        {{ tab.label }}
        @if (tab.key === 'historique' && unreadCount() > 0) {
          <span class="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
            {{ unreadCount() }}
          </span>
        }
      </button>
    }
  </div>

  <!-- TAB: Historique -->
  @if (activeTab === 'historique') {

    <div class="flex items-center gap-3 mb-2">
      <button (click)="setLuFilter(undefined)"
              class="px-3 py-1.5 text-xs rounded-lg border"
              [ngClass]="luFilter === undefined
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'">
        Toutes
      </button>
      <button (click)="setLuFilter(false)"
              class="px-3 py-1.5 text-xs rounded-lg border"
              [ngClass]="luFilter === false
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'">
        Non lues
      </button>
      <button (click)="setLuFilter(true)"
              class="px-3 py-1.5 text-xs rounded-lg border"
              [ngClass]="luFilter === true
                ? 'bg-gray-600 text-white border-gray-600'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'">
        Lues
      </button>
    </div>

    @if (page()) {
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        @if (page()!.content.length === 0) {
          <div class="flex flex-col items-center justify-center py-12 text-gray-400">
            <span class="text-3xl mb-2">🔔</span>
            <p class="text-sm">Aucune notification</p>
          </div>
        } @else {
          <ul class="divide-y divide-gray-50">
            @for (n of page()!.content; track n.id) {
              <li class="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
                  [ngClass]="n.lu ? '' : 'bg-blue-50/40'">
                <div class="flex-shrink-0 mt-0.5">
                  <span class="inline-flex items-center justify-center w-2 h-2 rounded-full mt-1.5"
                        [ngClass]="severityDot(n.severity)"></span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-0.5">
                    <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
                          [ngClass]="typeColor(n.type)">
                      {{ typeLabel(n.type) }}
                    </span>
                    @if (!n.lu) {
                      <span class="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                    }
                  </div>
                  <p class="text-sm text-gray-800">{{ n.message }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ n.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  @if (n.link) {
                    <a [routerLink]="n.link"
                       (click)="onNavigate(n)"
                       class="text-xs text-blue-600 hover:underline">Voir →</a>
                  }
                  @if (!n.lu) {
                    <button (click)="markRead(n)"
                            class="text-xs text-gray-400 hover:text-gray-600">✓</button>
                  }
                </div>
              </li>
            }
          </ul>

          @if (page()!.totalPages > 1) {
            <div class="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <button (click)="chargerPage(page()!.number - 1)"
                      [disabled]="page()!.number === 0"
                      class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                ← Précédent
              </button>
              <span class="text-xs text-gray-500">
                Page {{ page()!.number + 1 }} / {{ page()!.totalPages }}
              </span>
              <button (click)="chargerPage(page()!.number + 1)"
                      [disabled]="page()!.number >= page()!.totalPages - 1"
                      class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                Suivant →
              </button>
            </div>
          }
        }
      </div>
    } @else {
      <div class="flex items-center justify-center h-32 text-gray-400 text-sm">Chargement…</div>
    }
  }

  <!-- TAB: Règles -->
  @if (activeTab === 'regles') {
    @if (rules()) {
      <div class="space-y-3">
        <p class="text-sm text-gray-500">
          Configurez les seuils et activez/désactivez chaque type d'alerte automatique.
          Les changements sont appliqués immédiatement au prochain cycle de détection.
        </p>
        @for (rule of rules()!; track rule.id) {
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <button (click)="toggleRule(rule)"
                        class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                        [ngClass]="rule.enabled ? 'bg-blue-600' : 'bg-gray-200'">
                  <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
                        [ngClass]="rule.enabled ? 'translate-x-4' : 'translate-x-1'"></span>
                </button>
                <div>
                  <p class="text-sm font-medium text-gray-800">{{ rule.libelle }}</p>
                  <p class="text-xs text-gray-400 font-mono">{{ rule.type }}</p>
                </div>
              </div>
              @if (needsSeuil(rule.type)) {
                <div class="flex items-center gap-2">
                  <label class="text-xs text-gray-500 whitespace-nowrap">Seuil :</label>
                  <input type="number" step="1"
                         [value]="rule.seuil ?? ''"
                         (change)="updateSeuil(rule, $event)"
                         [disabled]="!rule.enabled"
                         class="w-24 border border-gray-300 rounded px-2 py-1 text-sm disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <span class="text-xs text-gray-400">
                    {{ rule.type === 'FACTURES_ECHEANCE' ? 'jours' : 'FCFA' }}
                  </span>
                </div>
              }
            </div>
            @if (!rule.enabled) {
              <p class="text-xs text-gray-400 mt-2 pl-12">Cette règle est désactivée — aucune alerte ne sera générée.</p>
            }
          </div>
        }
      </div>
    } @else {
      <div class="flex items-center justify-center h-32 text-gray-400 text-sm">Chargement…</div>
    }
  }

  <!-- TAB: Temps réel -->
  @if (activeTab === 'realtime') {
    <div class="space-y-3">
      <div class="flex items-center gap-2 text-sm">
        <span class="w-2 h-2 rounded-full"
              [ngClass]="sseSvc.unread() >= 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-300'"></span>
        <span class="text-gray-600">Connexion SSE active · mise à jour toutes les 30 s</span>
      </div>

      @if (sseSvc.notifications().length === 0) {
        <div class="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-12 text-gray-400">
          <span class="text-3xl mb-2">📡</span>
          <p class="text-sm">En attente de notifications en temps réel…</p>
        </div>
      } @else {
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div class="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <span class="text-sm text-gray-600">{{ sseSvc.notifications().length }} notification(s) en session</span>
            <button (click)="sseSvc.markAllRead()"
                    class="text-xs text-blue-600 hover:underline">Tout marquer lu</button>
          </div>
          <ul class="divide-y divide-gray-50">
            @for (n of sseSvc.notifications(); track n.timestamp) {
              <li class="flex items-start gap-3 px-5 py-3"
                  [ngClass]="n.read ? '' : 'bg-blue-50/30'">
                <span class="flex-shrink-0 inline-flex items-center justify-center w-2 h-2 rounded-full mt-2"
                      [ngClass]="severityDot(n.severity)"></span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-800">{{ n.message }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ n.timestamp | date:'HH:mm:ss' }}</p>
                </div>
                @if (n.link) {
                  <a [routerLink]="n.link"
                     class="text-xs text-blue-600 hover:underline flex-shrink-0">Voir →</a>
                }
              </li>
            }
          </ul>
        </div>
      }
    </div>
  }

</div>
  `
})
export class NotificationsComponent implements OnInit {

  private svc = inject(NotificationHistoryService);
  readonly sseSvc = inject(SseNotificationService);

  activeTab: 'historique' | 'regles' | 'realtime' = 'historique';
  tabs = [
    { key: 'historique' as const, label: 'Historique' },
    { key: 'realtime'   as const, label: 'Temps réel' },
    { key: 'regles'     as const, label: 'Règles' },
  ];

  luFilter: boolean | undefined = undefined;
  page  = signal<PageResponse<NotificationHistoryItem> | null>(null);
  rules = signal<NotificationRule[] | null>(null);
  unreadCount = signal(0);

  ngOnInit() {
    this.chargerPage(0);
    this.chargerRules();
    this.loadUnreadCount();
  }

  chargerPage(pageNum: number) {
    this.page.set(null);
    this.svc.lister(this.luFilter, pageNum).subscribe({ next: p => this.page.set(p) });
  }

  setLuFilter(val: boolean | undefined) {
    this.luFilter = val;
    this.chargerPage(0);
  }

  chargerRules() {
    this.svc.getRules().subscribe({ next: r => this.rules.set(r) });
  }

  loadUnreadCount() {
    this.svc.unreadCount().subscribe({ next: n => this.unreadCount.set(n) });
  }

  markRead(n: NotificationHistoryItem) {
    this.svc.markRead(n.id).subscribe({
      next: () => {
        this.page.update(p => p ? {
          ...p,
          content: p.content.map(item => item.id === n.id ? { ...item, lu: true } : item)
        } : p);
        this.unreadCount.update(c => Math.max(0, c - 1));
      }
    });
  }

  markAllRead() {
    this.svc.markAllRead().subscribe({
      next: () => {
        this.sseSvc.markAllRead();
        this.page.update(p => p ? {
          ...p, content: p.content.map(item => ({ ...item, lu: true }))
        } : p);
        this.unreadCount.set(0);
      }
    });
  }

  onNavigate(n: NotificationHistoryItem) {
    if (!n.lu) this.markRead(n);
  }

  toggleRule(rule: NotificationRule) {
    const enabled = !rule.enabled;
    this.svc.updateRule(rule.id, enabled, rule.seuil).subscribe({
      next: updated => this.rules.update(list =>
        list ? list.map(r => r.id === rule.id ? updated : r) : list)
    });
  }

  updateSeuil(rule: NotificationRule, event: Event) {
    const val = Number((event.target as HTMLInputElement).value) || null;
    this.svc.updateRule(rule.id, rule.enabled, val).subscribe({
      next: updated => this.rules.update(list =>
        list ? list.map(r => r.id === rule.id ? updated : r) : list)
    });
  }

  needsSeuil(type: string): boolean { return !!RULE_NEEDS_SEUIL[type]; }

  typeLabel(type: string): string { return NOTIFICATION_TYPE_LABELS[type] ?? type; }
  typeColor(type: string):  string { return NOTIFICATION_TYPE_COLORS[type] ?? 'bg-gray-100 text-gray-600'; }

  severityDot(severity: string): string {
    if (severity === 'DANGER')  return 'bg-red-500';
    if (severity === 'WARNING') return 'bg-amber-400';
    return 'bg-blue-400';
  }
}
