import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import {
  UtilisateurAdmin, EntrepriseSettings, ROLE_LABELS, UserRole
} from '../../core/models/admin.model';
import { OHADA_PAYS } from '../../core/models/auth.model';

type Tab = 'utilisateurs' | 'entreprise';

@Component({
  selector: 'app-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 max-w-5xl mx-auto space-y-5">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <h1 class="text-xl font-bold text-gray-800">Administration</h1>
    <span class="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-semibold">ADMIN</span>
  </div>

  <!-- Tabs -->
  <div class="flex gap-1 border-b border-gray-200">
    <button (click)="activeTab.set('utilisateurs')"
            [class]="tabClass('utilisateurs')"
            class="px-4 py-2 text-sm font-medium rounded-t-lg -mb-px border border-b-0 transition-colors">
      Utilisateurs
    </button>
    <button (click)="loadSettings(); activeTab.set('entreprise')"
            [class]="tabClass('entreprise')"
            class="px-4 py-2 text-sm font-medium rounded-t-lg -mb-px border border-b-0 transition-colors">
      Paramètres entreprise
    </button>
  </div>

  <!-- ── Tab Utilisateurs ─────────────────────────────────────── -->
  @if (activeTab() === 'utilisateurs') {
    <div class="space-y-4">

      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-500">{{ utilisateurs().length }} utilisateur(s) dans votre entreprise</p>
        <button (click)="inviteOpen.set(true)"
                class="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
          + Inviter un utilisateur
        </button>
      </div>

      <!-- Invite form -->
      @if (inviteOpen()) {
        <div class="border border-blue-200 bg-blue-50 rounded-2xl p-5 space-y-4">
          <h3 class="font-semibold text-gray-700 text-sm">Inviter un utilisateur</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs text-gray-500 mb-1 block">Nom *</label>
              <input [(ngModel)]="inviteForm.nom" placeholder="Nom complet"
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">Email *</label>
              <input [(ngModel)]="inviteForm.email" type="email" placeholder="email@exemple.com"
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">Rôle *</label>
              <select [(ngModel)]="inviteForm.role"
                      class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="COMPTABLE">Comptable</option>
                <option value="LECTEUR">Lecteur</option>
              </select>
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">Mot de passe provisoire *</label>
              <input [(ngModel)]="inviteForm.motDePasse" type="text" placeholder="À communiquer à l'utilisateur"
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
          </div>
          @if (inviteError()) {
            <p class="text-sm text-red-600">{{ inviteError() }}</p>
          }
          <div class="flex gap-3">
            <button (click)="inviter()" [disabled]="inviteSaving()"
                    class="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 disabled:opacity-50">
              {{ inviteSaving() ? 'Envoi…' : 'Créer l\'accès' }}
            </button>
            <button (click)="inviteOpen.set(false); inviteError.set(null)"
                    class="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">
              Annuler
            </button>
          </div>
        </div>
      }

      <!-- Users table -->
      <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th class="px-4 py-3 text-left">Utilisateur</th>
              <th class="px-4 py-3 text-left">Email</th>
              <th class="px-4 py-3 text-left">Rôle</th>
              <th class="px-4 py-3 text-left">Statut</th>
              <th class="px-4 py-3 text-left">Depuis</th>
              <th class="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (u of utilisateurs(); track u.id) {
              <tr class="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 font-medium text-gray-800">{{ u.nom }}</td>
                <td class="px-4 py-3 text-gray-500">{{ u.email }}</td>
                <td class="px-4 py-3">
                  @if (u.role !== 'ADMIN' && u.email !== myEmail()) {
                    <select [ngModel]="u.role" (ngModelChange)="changerRole(u, $event)"
                            class="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option value="COMPTABLE">Comptable</option>
                      <option value="LECTEUR">Lecteur</option>
                    </select>
                  } @else {
                    <span [class]="roleBadge(u.role)">{{ roleLabel(u.role) }}</span>
                  }
                </td>
                <td class="px-4 py-3">
                  <span [class]="u.actif ? 'text-green-700 bg-green-100' : 'text-gray-500 bg-gray-100'"
                        class="px-2 py-0.5 rounded-full text-xs font-semibold">
                    {{ u.actif ? 'Actif' : 'Désactivé' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-xs text-gray-400">{{ u.createdAt | date:'dd/MM/yyyy' }}</td>
                <td class="px-4 py-3 text-center">
                  @if (u.email !== myEmail() && u.role !== 'ADMIN') {
                    <button (click)="changerActif(u)"
                            class="text-xs px-2 py-1 rounded-lg border transition-colors"
                            [class]="u.actif
                              ? 'border-red-200 text-red-600 hover:bg-red-50'
                              : 'border-green-200 text-green-600 hover:bg-green-50'">
                      {{ u.actif ? 'Désactiver' : 'Réactiver' }}
                    </button>
                  } @else {
                    <span class="text-xs text-gray-300">–</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
        @if (utilisateurs().length === 0) {
          <div class="py-10 text-center text-gray-400 text-sm">Aucun utilisateur</div>
        }
      </div>
    </div>
  }

  <!-- ── Tab Entreprise ───────────────────────────────────────── -->
  @if (activeTab() === 'entreprise' && settings()) {
    <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
      <h2 class="font-semibold text-gray-700">Informations de l'entreprise</h2>

      <div class="grid grid-cols-2 gap-5">
        <div>
          <label class="text-xs text-gray-500 mb-1 block">Nom de l'entreprise *</label>
          <input [(ngModel)]="settingsForm.nom"
                 class="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
        <div>
          <label class="text-xs text-gray-500 mb-1 block">NIF / Numéro fiscal</label>
          <input [(ngModel)]="settingsForm.nif" placeholder="Optionnel"
                 class="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
        <div>
          <label class="text-xs text-gray-500 mb-1 block">Pays *</label>
          <select [(ngModel)]="settingsForm.pays"
                  class="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            @for (p of pays; track p.code) {
              <option [value]="p.label">{{ p.label }}</option>
            }
          </select>
        </div>
        <div>
          <label class="text-xs text-gray-500 mb-1 block">Système comptable</label>
          <select [(ngModel)]="settingsForm.systemeComptable"
                  class="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="NORMAL">Système Normal (SN)</option>
            <option value="SMT">Système Minimal de Trésorerie (SMT)</option>
          </select>
          <p class="text-xs text-gray-400 mt-1">
            Détermine les états financiers disponibles
          </p>
        </div>
      </div>

      <div class="pt-2 border-t border-gray-100">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-xs text-gray-500">Plan :</span>
          <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
            {{ settings()!.plan }}
          </span>
        </div>
        @if (settingsError()) {
          <p class="text-sm text-red-600 mb-3">{{ settingsError() }}</p>
        }
        @if (settingsSaved()) {
          <p class="text-sm text-green-600 mb-3">✓ Paramètres enregistrés</p>
        }
        <button (click)="saveSettings()" [disabled]="settingsSaving()"
                class="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50">
          {{ settingsSaving() ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </div>
    </div>
  }

</div>
  `
})
export class AdminComponent implements OnInit {
  private svc  = inject(AdminService);
  private auth = inject(AuthService);

  activeTab    = signal<Tab>('utilisateurs');
  utilisateurs = signal<UtilisateurAdmin[]>([]);
  settings     = signal<EntrepriseSettings | null>(null);

  inviteOpen   = signal(false);
  inviteSaving = signal(false);
  inviteError  = signal<string | null>(null);
  inviteForm   = { nom: '', email: '', role: 'COMPTABLE', motDePasse: '' };

  settingsSaving = signal(false);
  settingsSaved  = signal(false);
  settingsError  = signal<string | null>(null);
  settingsForm   = { nom: '', nif: '', pays: '', systemeComptable: 'NORMAL' };

  readonly pays = OHADA_PAYS;

  myEmail() { return this.auth.user()?.email; }
  roleLabel(r: UserRole) { return ROLE_LABELS[r]; }

  roleBadge(r: UserRole): string {
    if (r === 'ADMIN')     return 'px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700';
    if (r === 'COMPTABLE') return 'px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700';
    return 'px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600';
  }

  tabClass(tab: Tab): string {
    return this.activeTab() === tab
      ? 'bg-white border-gray-200 text-blue-700'
      : 'border-transparent text-gray-500 hover:bg-gray-100';
  }

  ngOnInit() {
    this.svc.listerUtilisateurs().subscribe(list => this.utilisateurs.set(list));
  }

  loadSettings() {
    if (this.settings()) return;
    this.svc.getSettings().subscribe(s => {
      this.settings.set(s);
      this.settingsForm = { nom: s.nom, nif: s.nif ?? '', pays: s.pays, systemeComptable: s.systemeComptable };
    });
  }

  // ─── Invite ───────────────────────────────────────────────────────────────

  inviter() {
    if (!this.inviteForm.nom || !this.inviteForm.email || !this.inviteForm.motDePasse) {
      this.inviteError.set('Tous les champs obligatoires doivent être remplis.'); return;
    }
    this.inviteError.set(null);
    this.inviteSaving.set(true);
    this.svc.inviterUtilisateur(this.inviteForm).subscribe({
      next: u => {
        this.utilisateurs.update(list => [...list, u]);
        this.inviteOpen.set(false);
        this.inviteForm = { nom: '', email: '', role: 'COMPTABLE', motDePasse: '' };
        this.inviteSaving.set(false);
      },
      error: (e: any) => {
        this.inviteError.set(e?.error?.message ?? 'Erreur lors de la création.');
        this.inviteSaving.set(false);
      }
    });
  }

  // ─── Role & actif ─────────────────────────────────────────────────────────

  changerRole(u: UtilisateurAdmin, role: string) {
    this.svc.changerRole(u.id, role).subscribe({
      next: updated => this.utilisateurs.update(list => list.map(x => x.id === u.id ? updated : x)),
      error: (e: any) => alert(e?.error?.message ?? 'Erreur')
    });
  }

  changerActif(u: UtilisateurAdmin) {
    this.svc.changerActif(u.id, !u.actif).subscribe({
      next: updated => this.utilisateurs.update(list => list.map(x => x.id === u.id ? updated : x)),
      error: (e: any) => alert(e?.error?.message ?? 'Erreur')
    });
  }

  // ─── Settings ─────────────────────────────────────────────────────────────

  saveSettings() {
    this.settingsError.set(null);
    this.settingsSaved.set(false);
    this.settingsSaving.set(true);
    this.svc.updateSettings(this.settingsForm).subscribe({
      next: s => {
        this.settings.set(s);
        this.settingsSaved.set(true);
        this.settingsSaving.set(false);
      },
      error: (e: any) => {
        this.settingsError.set(e?.error?.message ?? 'Erreur lors de la sauvegarde.');
        this.settingsSaving.set(false);
      }
    });
  }
}
