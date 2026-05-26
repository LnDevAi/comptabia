import {
  ChangeDetectionStrategy, Component, OnInit, inject, signal, computed
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UtilisateursAdminService } from '../../core/services/utilisateurs-admin.service';
import { UtilisateurAdminResponse } from '../../core/models/utilisateurs-admin.model';
import { AuthService } from '../../core/services/auth.service';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin', COMPTABLE: 'Comptable', LECTEUR: 'Lecteur'
};
const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  COMPTABLE: 'bg-blue-100 text-blue-700',
  LECTEUR: 'bg-gray-100 text-gray-600'
};

@Component({
  selector: 'app-utilisateurs-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-6 max-w-5xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-gray-900">Utilisateurs</h2>
          <p class="text-sm text-gray-500 mt-0.5">Gérez les membres de votre espace comptable</p>
        </div>
        <button (click)="toggleInviteForm()"
                class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700
                       text-white text-sm font-medium rounded-lg transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Inviter un utilisateur
        </button>
      </div>

      <!-- Invite form -->
      @if (showInvite()) {
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 class="text-sm font-semibold text-blue-900 mb-4">Nouvelle invitation</h3>
          <form [formGroup]="inviteForm" (ngSubmit)="inviter()" class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Nom complet</label>
              <input type="text" formControlName="nom"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="Jean Dupont">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input type="email" formControlName="email"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="jean@entreprise.com"
                     [class.border-red-400]="inviteForm.get('email')!.invalid && inviteForm.get('email')!.touched">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Rôle</label>
              <select formControlName="role"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="COMPTABLE">Comptable</option>
                <option value="LECTEUR">Lecteur</option>
                <option value="ADMIN">Administrateur</option>
              </select>
            </div>
            @if (inviteError()) {
              <p class="col-span-3 text-sm text-red-500">{{ inviteError() }}</p>
            }
            @if (inviteSuccess()) {
              <p class="col-span-3 text-sm text-green-600">Invitation envoyée à {{ inviteSuccess() }}</p>
            }
            <div class="col-span-3 flex gap-3 justify-end">
              <button type="button" (click)="toggleInviteForm()"
                      class="px-4 py-2 border border-gray-300 hover:bg-gray-50
                             text-gray-700 text-sm font-medium rounded-lg transition">
                Annuler
              </button>
              <button type="submit" [disabled]="inviteForm.invalid || inviting()"
                      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                             text-white text-sm font-medium rounded-lg transition">
                {{ inviting() ? 'Envoi...' : 'Envoyer l\'invitation' }}
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Users table -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        @if (loading()) {
          <div class="flex items-center justify-center h-32 text-gray-400 text-sm">
            Chargement...
          </div>
        } @else if (utilisateurs().length === 0) {
          <div class="flex items-center justify-center h-32 text-gray-400 text-sm">
            Aucun utilisateur
          </div>
        } @else {
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Utilisateur</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rôle</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">2FA</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Depuis</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (u of utilisateurs(); track u.id) {
                <tr class="hover:bg-gray-50 transition" [class.opacity-50]="!u.actif && !u.invitePending">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center
                                  text-blue-700 font-semibold text-xs shrink-0">
                        {{ initials(u.nom) }}
                      </div>
                      <div>
                        <p class="font-medium text-gray-900">{{ u.nom }}</p>
                        <p class="text-xs text-gray-400">{{ u.email }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    @if (editingRoleId() === u.id && !isSelf(u)) {
                      <select [value]="u.role" (change)="changeRole(u, $event)"
                              (blur)="editingRoleId.set(null)"
                              class="px-2 py-1 border border-blue-300 rounded text-xs
                                     focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="ADMIN">Admin</option>
                        <option value="COMPTABLE">Comptable</option>
                        <option value="LECTEUR">Lecteur</option>
                      </select>
                    } @else {
                      <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
                            [class]="roleColor(u.role)"
                            [title]="isSelf(u) ? '' : 'Cliquer pour modifier'"
                            (click)="isSelf(u) ? null : editingRoleId.set(u.id)"
                            [class.cursor-pointer]="!isSelf(u)">
                        {{ roleLabel(u.role) }}
                      </span>
                    }
                  </td>
                  <td class="px-4 py-3">
                    @if (u.invitePending) {
                      <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                        Invitation en attente
                      </span>
                    } @else if (u.actif) {
                      <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        Actif
                      </span>
                    } @else {
                      <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                        Désactivé
                      </span>
                    }
                  </td>
                  <td class="px-4 py-3">
                    @if (u.totpEnabled) {
                      <span class="text-green-600 text-xs font-medium">Activée</span>
                    } @else {
                      <span class="text-gray-400 text-xs">—</span>
                    }
                  </td>
                  <td class="px-4 py-3 text-xs text-gray-400">
                    {{ formatDate(u.createdAt) }}
                  </td>
                  <td class="px-4 py-3">
                    @if (!isSelf(u)) {
                      <div class="flex items-center justify-end gap-1">
                        @if (u.actif && !u.invitePending) {
                          <button (click)="desactiver(u)"
                                  title="Désactiver"
                                  class="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50
                                         rounded transition">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                            </svg>
                          </button>
                        }
                        @if (!u.actif && !u.invitePending) {
                          <button (click)="activer(u)"
                                  title="Activer"
                                  class="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50
                                         rounded transition">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                          </button>
                        }
                        <button (click)="confirmerSuppression(u)"
                                title="Supprimer"
                                class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50
                                       rounded transition">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Error banner -->
      @if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {{ error() }}
        </div>
      }

      <!-- Delete confirmation modal -->
      @if (deleteTarget()) {
        <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full space-y-4">
            <h3 class="font-semibold text-gray-900">Confirmer la suppression</h3>
            <p class="text-sm text-gray-600">
              Supprimer définitivement <strong>{{ deleteTarget()!.nom }}</strong> ({{ deleteTarget()!.email }}) ?
              Cette action est irréversible.
            </p>
            <div class="flex gap-3 justify-end">
              <button (click)="deleteTarget.set(null)"
                      class="px-4 py-2 border border-gray-300 hover:bg-gray-50
                             text-gray-700 text-sm font-medium rounded-lg transition">
                Annuler
              </button>
              <button (click)="supprimer()" [disabled]="actionLoading()"
                      class="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50
                             text-white text-sm font-medium rounded-lg transition">
                {{ actionLoading() ? 'Suppression...' : 'Supprimer' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class UtilisateursAdminComponent implements OnInit {

  private readonly svc  = inject(UtilisateursAdminService);
  private readonly auth = inject(AuthService);
  private readonly fb   = inject(FormBuilder);

  utilisateurs  = signal<UtilisateurAdminResponse[]>([]);
  loading       = signal(true);
  error         = signal('');
  showInvite    = signal(false);
  inviting      = signal(false);
  inviteError   = signal('');
  inviteSuccess = signal('');
  editingRoleId = signal<string | null>(null);
  deleteTarget  = signal<UtilisateurAdminResponse | null>(null);
  actionLoading = signal(false);

  inviteForm = this.fb.nonNullable.group({
    nom:   ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role:  ['COMPTABLE' as 'ADMIN' | 'COMPTABLE' | 'LECTEUR', Validators.required],
  });

  ngOnInit() {
    this.charger();
  }

  charger() {
    this.loading.set(true);
    this.svc.lister().subscribe({
      next: (list) => { this.utilisateurs.set(list); this.loading.set(false); },
      error: () => { this.error.set('Impossible de charger les utilisateurs.'); this.loading.set(false); }
    });
  }

  toggleInviteForm() {
    this.showInvite.update(v => !v);
    this.inviteForm.reset({ role: 'COMPTABLE' });
    this.inviteError.set('');
    this.inviteSuccess.set('');
  }

  inviter() {
    if (this.inviteForm.invalid) return;
    this.inviting.set(true);
    this.inviteError.set('');
    this.inviteSuccess.set('');
    const { nom, email, role } = this.inviteForm.getRawValue();
    this.svc.inviter({ nom, email, role }).subscribe({
      next: (u) => {
        this.utilisateurs.update(list => [u, ...list]);
        this.inviteSuccess.set(email);
        this.inviting.set(false);
        this.inviteForm.reset({ role: 'COMPTABLE' });
      },
      error: (e) => {
        this.inviteError.set(e?.error?.detail ?? 'Erreur lors de l\'invitation');
        this.inviting.set(false);
      }
    });
  }

  changeRole(u: UtilisateurAdminResponse, event: Event) {
    const role = (event.target as HTMLSelectElement).value as 'ADMIN' | 'COMPTABLE' | 'LECTEUR';
    this.editingRoleId.set(null);
    this.svc.changerRole(u.id, { role }).subscribe({
      next: (updated) => this.updateInList(updated),
      error: (e) => this.error.set(e?.error?.detail ?? 'Erreur')
    });
  }

  activer(u: UtilisateurAdminResponse) {
    this.svc.activer(u.id).subscribe({
      next: (updated) => this.updateInList(updated),
      error: (e) => this.error.set(e?.error?.detail ?? 'Erreur')
    });
  }

  desactiver(u: UtilisateurAdminResponse) {
    this.svc.desactiver(u.id).subscribe({
      next: (updated) => this.updateInList(updated),
      error: (e) => this.error.set(e?.error?.detail ?? 'Erreur')
    });
  }

  confirmerSuppression(u: UtilisateurAdminResponse) {
    this.deleteTarget.set(u);
  }

  supprimer() {
    const u = this.deleteTarget();
    if (!u) return;
    this.actionLoading.set(true);
    this.svc.supprimer(u.id).subscribe({
      next: () => {
        this.utilisateurs.update(list => list.filter(x => x.id !== u.id));
        this.deleteTarget.set(null);
        this.actionLoading.set(false);
      },
      error: (e) => {
        this.error.set(e?.error?.detail ?? 'Erreur lors de la suppression');
        this.actionLoading.set(false);
        this.deleteTarget.set(null);
      }
    });
  }

  isSelf(u: UtilisateurAdminResponse): boolean {
    return u.email === this.auth.user()?.email;
  }

  private updateInList(updated: UtilisateurAdminResponse) {
    this.utilisateurs.update(list => list.map(u => u.id === updated.id ? updated : u));
  }

  roleLabel(role: string): string { return ROLE_LABELS[role] ?? role; }
  roleColor(role: string): string { return ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-600'; }

  initials(nom: string): string {
    return nom.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
