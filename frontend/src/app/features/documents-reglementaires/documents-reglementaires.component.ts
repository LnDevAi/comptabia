import {
  ChangeDetectionStrategy, Component, OnInit, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DocumentReglementaireService } from '../../core/services/document-reglementaire.service';
import {
  DocumentReglementaireResponse,
  StatutDoc,
  CATEGORIES_DOC
} from '../../core/models/document-reglementaire.model';

@Component({
  selector: 'app-documents-reglementaires',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-6 max-w-6xl mx-auto space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900">Documents réglementaires</h1>
          <p class="text-sm text-gray-500 mt-0.5">
            Gestion des obligations légales — Décret n° 2025-0959 / CVECA
          </p>
        </div>
        <button (click)="openCreate()"
                class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
                       px-4 py-2 rounded-lg transition">
          + Nouveau document
        </button>
      </div>

      <!-- Deadlines alert -->
      @if (echeancesProches().length > 0) {
        <div class="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p class="text-sm font-semibold text-orange-800 mb-2">
            Échéances dans les 30 prochains jours ({{ echeancesProches().length }})
          </p>
          <div class="flex flex-wrap gap-2">
            @for (d of echeancesProches(); track d.id) {
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                    [class]="d.joursRestants <= 7 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'">
                {{ d.categorieLabel }}
                <span class="font-bold">J–{{ d.joursRestants }}</span>
              </span>
            }
          </div>
        </div>
      }

      <!-- Table -->
      @if (loading()) {
        <div class="text-center py-12 text-gray-400 text-sm">Chargement…</div>
      } @else if (docs().length === 0) {
        <div class="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <p class="text-gray-400 text-sm">Aucun document réglementaire</p>
          <p class="text-gray-300 text-xs mt-1">Cliquez sur « Nouveau document » pour commencer</p>
        </div>
      } @else {
        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Catégorie</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nom</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dépôt</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Échéance</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fichier</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (doc of docs(); track doc.id) {
                <tr class="hover:bg-gray-50 transition">
                  <td class="px-4 py-3 text-xs text-gray-600">{{ doc.categorieLabel }}</td>
                  <td class="px-4 py-3 font-medium text-gray-900 max-w-48 truncate" [title]="doc.nom">{{ doc.nom }}</td>
                  <td class="px-4 py-3 text-gray-500 text-xs">{{ doc.dateDepot ?? '—' }}</td>
                  <td class="px-4 py-3 text-xs">
                    @if (doc.dateEcheance) {
                      <span class="font-medium" [class]="echeanceClass(doc)">
                        {{ doc.dateEcheance }}
                        @if (doc.joursRestants >= 0 && doc.joursRestants <= 30) {
                          <span class="ml-1">(J–{{ doc.joursRestants }})</span>
                        }
                      </span>
                    } @else {
                      <span class="text-gray-400">—</span>
                    }
                  </td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                          [class]="statutClass(doc.statut)">
                      {{ statutLabel(doc.statut) }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    @if (doc.hasFichier) {
                      <button (click)="download(doc)"
                              class="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 truncate max-w-32">
                        ↓ {{ doc.nomFichierOriginal ?? 'Fichier' }}
                      </button>
                    } @else {
                      <label class="cursor-pointer text-xs text-gray-400 hover:text-blue-600 transition">
                        + Joindre
                        <input type="file" class="hidden"
                               (change)="onFileSelected($event, doc.id)"
                               accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx">
                      </label>
                    }
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <button (click)="openEdit(doc)"
                              class="text-xs text-gray-500 hover:text-blue-600 transition">
                        Modifier
                      </button>
                      @if (doc.hasFichier) {
                        <label class="cursor-pointer text-xs text-gray-400 hover:text-blue-600 transition">
                          Remplacer
                          <input type="file" class="hidden"
                                 (change)="onFileSelected($event, doc.id)"
                                 accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx">
                        </label>
                      }
                      <button (click)="confirmDelete(doc)"
                              class="text-xs text-red-400 hover:text-red-600 transition">
                        Suppr.
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- Create / Edit modal -->
    @if (showModal()) {
      <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4"
             (click)="$event.stopPropagation()">
          <h2 class="text-base font-bold text-gray-900">
            {{ editingId() ? 'Modifier le document' : 'Nouveau document réglementaire' }}
          </h2>

          <form [formGroup]="form" (ngSubmit)="save()" class="space-y-3">

            @if (!editingId()) {
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Catégorie *</label>
                <select formControlName="categorie"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                               focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Choisir --</option>
                  @for (c of categories; track c.value) {
                    <option [value]="c.value">{{ c.label }}</option>
                  }
                </select>
              </div>
            }

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
              <input type="text" formControlName="nom"
                     placeholder="Ex : Récépissé n° 1234/2025"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                            focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea formControlName="description" rows="2"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none
                               focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Date de dépôt</label>
                <input type="date" formControlName="dateDepot"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                              focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Date d'échéance</label>
                <input type="date" formControlName="dateEcheance"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                              focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
            </div>

            @if (editingId()) {
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Statut</label>
                <select formControlName="statut"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                               focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="EN_ATTENTE">En attente</option>
                  <option value="DEPOSE">Déposé</option>
                  <option value="VALIDE">Validé</option>
                  <option value="EXPIRE">Expiré</option>
                </select>
              </div>
            }

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea formControlName="notes" rows="2"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none
                               focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
            </div>

            @if (formError()) {
              <p class="text-xs text-red-600">{{ formError() }}</p>
            }

            <div class="flex justify-end gap-3 pt-2">
              <button type="button" (click)="closeModal()"
                      class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition">
                Annuler
              </button>
              <button type="submit" [disabled]="form.invalid || saving()"
                      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                             text-white text-sm font-medium rounded-lg transition">
                {{ saving() ? 'Enregistrement…' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Delete confirm -->
    @if (deletingDoc()) {
      <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <h2 class="text-base font-bold text-gray-900">Supprimer le document ?</h2>
          <p class="text-sm text-gray-600">
            « {{ deletingDoc()!.nom }} » et son fichier associé seront définitivement supprimés.
          </p>
          <div class="flex justify-end gap-3">
            <button (click)="deletingDoc.set(null)"
                    class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition">
              Annuler
            </button>
            <button (click)="deleteConfirmed()"
                    class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition">
              Supprimer
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class DocumentsReglementairesComponent implements OnInit {

  docs        = signal<DocumentReglementaireResponse[]>([]);
  loading     = signal(true);
  showModal   = signal(false);
  editingId   = signal<string | null>(null);
  saving      = signal(false);
  formError   = signal('');
  deletingDoc = signal<DocumentReglementaireResponse | null>(null);

  echeancesProches = computed(() =>
    this.docs().filter(d =>
      d.dateEcheance != null &&
      d.joursRestants >= 0 &&
      d.joursRestants <= 30 &&
      d.statut !== 'VALIDE' &&
      d.statut !== 'EXPIRE'
    )
  );

  categories = CATEGORIES_DOC;

  form = this.fb.nonNullable.group({
    categorie:    [''],
    nom:          ['', Validators.required],
    description:  [''],
    dateDepot:    [''],
    dateEcheance: [''],
    statut:       ['EN_ATTENTE' as StatutDoc],
    notes:        [''],
  });

  constructor(
    private fb:     FormBuilder,
    private docSvc: DocumentReglementaireService
  ) {}

  ngOnInit() {
    this.charger();
  }

  charger() {
    this.loading.set(true);
    this.docSvc.lister().subscribe({
      next:  list => { this.docs.set(list); this.loading.set(false); },
      error: ()   => this.loading.set(false)
    });
  }

  openCreate() {
    this.editingId.set(null);
    this.form.reset({ statut: 'EN_ATTENTE' as StatutDoc });
    this.form.get('categorie')!.setValidators(Validators.required);
    this.form.get('categorie')!.updateValueAndValidity();
    this.formError.set('');
    this.showModal.set(true);
  }

  openEdit(doc: DocumentReglementaireResponse) {
    this.editingId.set(doc.id);
    this.form.get('categorie')!.clearValidators();
    this.form.get('categorie')!.updateValueAndValidity();
    this.form.patchValue({
      nom:          doc.nom,
      description:  doc.description ?? '',
      dateDepot:    doc.dateDepot ?? '',
      dateEcheance: doc.dateEcheance ?? '',
      statut:       doc.statut,
      notes:        doc.notes ?? '',
    });
    this.formError.set('');
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingId.set(null);
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.formError.set('');
    const v  = this.form.getRawValue();
    const id = this.editingId();

    if (id) {
      this.docSvc.mettrAJour(id, {
        nom:          v.nom      || undefined,
        description:  v.description  || undefined,
        dateDepot:    v.dateDepot    || undefined,
        dateEcheance: v.dateEcheance || undefined,
        statut:       (v.statut as StatutDoc) || undefined,
        notes:        v.notes        || undefined,
      }).subscribe({
        next: updated => {
          this.docs.update(list => list.map(d => d.id === id ? updated : d));
          this.saving.set(false);
          this.closeModal();
        },
        error: e => {
          this.formError.set(e?.error?.detail ?? 'Erreur lors de la mise à jour');
          this.saving.set(false);
        }
      });
    } else {
      this.docSvc.creer({
        categorie:    v.categorie as any,
        nom:          v.nom,
        description:  v.description  || undefined,
        dateDepot:    v.dateDepot    || undefined,
        dateEcheance: v.dateEcheance || undefined,
        notes:        v.notes        || undefined,
      }).subscribe({
        next: created => {
          this.docs.update(list => [created, ...list]);
          this.saving.set(false);
          this.closeModal();
        },
        error: e => {
          this.formError.set(e?.error?.detail ?? 'Erreur lors de la création');
          this.saving.set(false);
        }
      });
    }
  }

  onFileSelected(event: Event, docId: string) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.docSvc.uploadFichier(docId, file).subscribe({
      next: updated => this.docs.update(list => list.map(d => d.id === docId ? updated : d)),
      error: () => {}
    });
    input.value = '';
  }

  download(doc: DocumentReglementaireResponse) {
    this.docSvc.downloadFichier(doc.id).subscribe(resp => {
      const blob = resp.body!;
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = doc.nomFichierOriginal ?? 'document';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  confirmDelete(doc: DocumentReglementaireResponse) {
    this.deletingDoc.set(doc);
  }

  deleteConfirmed() {
    const doc = this.deletingDoc();
    if (!doc) return;
    this.docSvc.supprimer(doc.id).subscribe({
      next: () => {
        this.docs.update(list => list.filter(d => d.id !== doc.id));
        this.deletingDoc.set(null);
      },
      error: () => this.deletingDoc.set(null)
    });
  }

  echeanceClass(doc: DocumentReglementaireResponse): string {
    if (doc.statut === 'EXPIRE' || doc.joursRestants < 0) return 'text-red-600';
    if (doc.joursRestants <= 7)  return 'text-red-600';
    if (doc.joursRestants <= 30) return 'text-orange-600';
    return 'text-gray-700';
  }

  statutClass(s: StatutDoc): string {
    switch (s) {
      case 'EN_ATTENTE': return 'bg-gray-100 text-gray-600';
      case 'DEPOSE':     return 'bg-blue-100 text-blue-700';
      case 'VALIDE':     return 'bg-green-100 text-green-700';
      case 'EXPIRE':     return 'bg-red-100 text-red-700';
    }
  }

  statutLabel(s: StatutDoc): string {
    switch (s) {
      case 'EN_ATTENTE': return 'En attente';
      case 'DEPOSE':     return 'Déposé';
      case 'VALIDE':     return 'Validé';
      case 'EXPIRE':     return 'Expiré';
    }
  }
}
