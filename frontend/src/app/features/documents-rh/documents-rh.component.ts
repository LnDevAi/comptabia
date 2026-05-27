import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentRhService } from '../../core/services/document-rh.service';
import { AuthService } from '../../core/services/auth.service';
import {
  DocumentRhResponse, DocumentRhRequest,
  TypeDocument, StatutDocument,
  TYPE_DOC_LABELS, STATUT_DOC_LABELS
} from '../../core/models/document-rh.model';

type Tab = 'tous' | 'expirant';

const STATUT_CSS: Record<StatutDocument, string> = {
  VALIDE:  'bg-green-100 text-green-700',
  EXPIRE:  'bg-red-100 text-red-700',
  ARCHIVE: 'bg-gray-100 text-gray-500',
};

@Component({
  selector: 'app-documents-rh',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
<div class="p-6 space-y-5">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold text-gray-800">Gestion documentaire RH</h1>
      <p class="text-xs text-gray-400 mt-0.5">Contrats · Attestations · Documents collaborateurs</p>
    </div>
    @if (isAdmin) {
      <button (click)="openModal()" class="bg-rose-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-rose-700 transition">
        + Ajouter document
      </button>
    }
  </div>

  <!-- Alerte expiration -->
  @if (nbExpirant > 0) {
    <div class="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
      <span class="text-amber-500 text-lg">⚠️</span>
      <p class="text-sm text-amber-700">
        <strong>{{ nbExpirant }}</strong> document(s) expire(nt) dans les 30 prochains jours.
        <button (click)="activeTab.set('expirant')" class="underline ml-1">Voir</button>
      </p>
    </div>
  }

  <!-- Onglets -->
  <div class="flex gap-1 border-b border-gray-200">
    <button (click)="activeTab.set('tous')"
            class="px-4 py-2 text-sm font-medium border-b-2 transition"
            [class]="activeTab() === 'tous' ? 'border-rose-600 text-rose-700' : 'border-transparent text-gray-500 hover:text-gray-700'">
      Tous ({{ docs.length }})
    </button>
    <button (click)="activeTab.set('expirant')"
            class="px-4 py-2 text-sm font-medium border-b-2 transition"
            [class]="activeTab() === 'expirant' ? 'border-rose-600 text-rose-700' : 'border-transparent text-gray-500 hover:text-gray-700'">
      Expiration proche ({{ nbExpirant }})
    </button>
  </div>

  <!-- Filtre type document -->
  @if (activeTab() === 'tous') {
    <div class="flex gap-2 flex-wrap">
      <button (click)="filterType = null"
              class="text-xs px-3 py-1.5 rounded-full border transition"
              [class]="filterType === null ? 'bg-rose-600 text-white border-rose-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'">
        Tous
      </button>
      @for (t of typesDoc; track t.val) {
        <button (click)="filterType = t.val"
                class="text-xs px-3 py-1.5 rounded-full border transition"
                [class]="filterType === t.val ? 'bg-rose-600 text-white border-rose-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'">
          {{ t.label }}
        </button>
      }
    </div>
  }

  <!-- Liste documents -->
  @if (loading) {
    <p class="text-sm text-gray-400 text-center py-10">Chargement...</p>
  } @else {
    @if ((activeTab() === 'expirant' ? expirants : filteredDocs).length === 0) {
      <div class="text-center py-12 text-gray-400">
        <div class="text-4xl mb-2">📁</div>
        <p class="text-sm">Aucun document.</p>
      </div>
    } @else {
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        @for (d of (activeTab() === 'expirant' ? expirants : filteredDocs); track d.id) {
          <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-2"
               [class]="d.statut === 'EXPIRE' ? 'border-red-200 bg-red-50/30' : ''">
            <div class="flex items-start justify-between gap-2">
              <div class="space-y-0.5 flex-1">
                <p class="text-sm font-semibold text-gray-800 truncate">{{ d.titre }}</p>
                <p class="text-xs text-gray-400">{{ typeLabel(d.typeDocument) }}</p>
                @if (d.collaborateurNom) {
                  <p class="text-xs text-blue-600">{{ d.collaborateurNom }}</p>
                }
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0"
                    [class]="statutCss(d.statut)">
                {{ statutLabel(d.statut) }}
              </span>
            </div>
            @if (d.reference) {
              <p class="text-xs text-gray-400">Réf. : {{ d.reference }}</p>
            }
            <div class="flex gap-3 text-xs text-gray-400">
              @if (d.dateDocument) {
                <span>Date : {{ d.dateDocument | date:'dd/MM/yyyy' }}</span>
              }
              @if (d.dateExpiration) {
                <span [class]="d.joursAvantExpiration <= 30 && d.statut === 'VALIDE' ? 'text-amber-600 font-medium' : ''">
                  Exp. : {{ d.dateExpiration | date:'dd/MM/yyyy' }}
                  @if (d.statut === 'VALIDE' && d.joursAvantExpiration >= 0) {
                    ({{ d.joursAvantExpiration }}j)
                  }
                </span>
              }
            </div>
            @if (isAdmin && d.statut !== 'ARCHIVE') {
              <div class="flex gap-2 pt-1 border-t border-gray-100">
                <button (click)="openEdit(d)"
                        class="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50">Modifier</button>
                <button (click)="archiver(d)"
                        class="text-xs text-gray-500 hover:text-amber-600 px-2 py-1 rounded hover:bg-amber-50">Archiver</button>
                <button (click)="deleteDoc(d)"
                        class="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 ml-auto">Suppr.</button>
              </div>
            }
          </div>
        }
      </div>
    }
  }
</div>

<!-- Modal -->
@if (showModal) {
  <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
      <h2 class="font-bold text-gray-800">{{ editDoc ? 'Modifier' : 'Ajouter' }} un document RH</h2>
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2">
          <label class="block text-xs text-gray-500 mb-1">Titre *</label>
          <input [(ngModel)]="form.titre" placeholder="Ex : Contrat CDI — Nom Prénom"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400">
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Type de document</label>
          <select [(ngModel)]="form.typeDocument"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400">
            @for (t of typesDoc; track t.val) {
              <option [value]="t.val">{{ t.label }}</option>
            }
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Référence</label>
          <input [(ngModel)]="form.reference" placeholder="N° de document"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400">
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Date du document</label>
          <input type="date" [(ngModel)]="form.dateDocument"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400">
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Date d'expiration</label>
          <input type="date" [(ngModel)]="form.dateExpiration"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400">
        </div>
        <div class="col-span-2">
          <label class="block text-xs text-gray-500 mb-1">ID Collaborateur</label>
          <input [(ngModel)]="form.collaborateurId" placeholder="UUID du collaborateur (optionnel)"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400">
        </div>
        <div class="col-span-2">
          <label class="block text-xs text-gray-500 mb-1">Description</label>
          <textarea [(ngModel)]="form.description" rows="2"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"></textarea>
        </div>
      </div>
      @if (error) { <p class="text-xs text-red-500">{{ error }}</p> }
      <div class="flex justify-end gap-3 pt-2">
        <button (click)="closeModal()" class="text-sm text-gray-500 hover:text-gray-700">Annuler</button>
        <button (click)="submit()" [disabled]="saving"
                class="bg-rose-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-rose-700 disabled:opacity-50 transition">
          {{ saving ? 'Enregistrement...' : (editDoc ? 'Modifier' : 'Ajouter') }}
        </button>
      </div>
    </div>
  </div>
}
`,
})
export class DocumentsRhComponent implements OnInit {
  private svc  = inject(DocumentRhService);
  private auth = inject(AuthService);
  private cdr  = inject(ChangeDetectorRef);

  docs:      DocumentRhResponse[] = [];
  expirants: DocumentRhResponse[] = [];
  loading    = false;
  saving     = false;
  error      = '';
  showModal  = false;
  editDoc:   DocumentRhResponse | null = null;
  filterType: TypeDocument | null = null;
  activeTab  = signal<Tab>('tous');

  form: DocumentRhRequest = { titre: '', typeDocument: 'AUTRE' };

  get isAdmin() { return this.auth.user()?.role === 'ADMIN'; }
  get nbExpirant() { return this.expirants.length; }

  get filteredDocs() {
    return this.filterType ? this.docs.filter(d => d.typeDocument === this.filterType) : this.docs;
  }

  readonly typesDoc = (Object.entries(TYPE_DOC_LABELS) as [TypeDocument, string][])
    .map(([val, label]) => ({ val, label }));

  ngOnInit() { this.load(); }

  private load() {
    this.loading = true;
    this.svc.findAll().subscribe({
      next: d => { this.docs = d; this.loading = false; this.cdr.markForCheck(); }
    });
    this.svc.findExpirant(30).subscribe({
      next: d => { this.expirants = d; this.cdr.markForCheck(); }
    });
  }

  typeLabel(t: TypeDocument)     { return TYPE_DOC_LABELS[t]; }
  statutCss(s: StatutDocument)   { return STATUT_CSS[s]; }
  statutLabel(s: StatutDocument) { return STATUT_DOC_LABELS[s]; }

  openModal() { this.editDoc = null; this.form = { titre: '', typeDocument: 'AUTRE' }; this.error = ''; this.showModal = true; }
  closeModal() { this.showModal = false; this.editDoc = null; }

  openEdit(d: DocumentRhResponse) {
    this.editDoc = d;
    this.form = {
      titre: d.titre, typeDocument: d.typeDocument,
      description: d.description ?? undefined, reference: d.reference ?? undefined,
      dateDocument: d.dateDocument ?? undefined, dateExpiration: d.dateExpiration ?? undefined,
      collaborateurId: d.collaborateurId ?? undefined
    };
    this.error = ''; this.showModal = true;
  }

  submit() {
    if (!this.form.titre.trim()) { this.error = 'Titre obligatoire.'; return; }
    this.saving = true; this.error = '';
    const req = { ...this.form, collaborateurId: this.form.collaborateurId || undefined };
    const obs = this.editDoc
      ? this.svc.update(this.editDoc.id, req)
      : this.svc.create(req);
    obs.subscribe({
      next: d => {
        if (this.editDoc) {
          const idx = this.docs.findIndex(x => x.id === d.id);
          if (idx >= 0) this.docs[idx] = d;
        } else {
          this.docs.unshift(d);
        }
        this.saving = false; this.showModal = false;
        this.svc.findExpirant(30).subscribe({ next: e => { this.expirants = e; } });
        this.cdr.markForCheck();
      },
      error: () => { this.saving = false; this.error = 'Erreur lors de l\'enregistrement.'; }
    });
  }

  archiver(d: DocumentRhResponse) {
    this.svc.archiver(d.id).subscribe({
      next: updated => {
        const idx = this.docs.findIndex(x => x.id === d.id);
        if (idx >= 0) this.docs[idx] = updated;
        this.cdr.markForCheck();
      }
    });
  }

  deleteDoc(d: DocumentRhResponse) {
    if (!confirm(`Supprimer "${d.titre}" ?`)) return;
    this.svc.delete(d.id).subscribe({
      next: () => { this.docs = this.docs.filter(x => x.id !== d.id); this.cdr.markForCheck(); }
    });
  }
}
