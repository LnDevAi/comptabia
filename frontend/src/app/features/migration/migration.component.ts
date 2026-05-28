import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MigrationService } from '../../core/services/migration.service';
import {
  FORMATS_LOGICIEL, TYPES_DONNEES, CHAMPS_CIBLES,
  FormatImport, TypeDonnees,
  PreviewDto, ImportResultDto, ImportHistoriqueDto, ColonneMapping
} from '../../core/models/migration.model';

type Etape = 'choix' | 'upload' | 'mapping' | 'confirmation' | 'resultat' | 'historique';

@Component({
  selector: 'app-migration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 max-w-5xl mx-auto">

  <!-- Titre + onglet historique -->
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-800">Import & Migration de données</h1>
      <p class="text-gray-500 text-sm mt-1">Importez vos données depuis Sage, EBP, WaveSoft, FEC ou Excel/CSV</p>
    </div>
    <button (click)="toggleHistorique()"
            class="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
      <span>📋</span> Historique
    </button>
  </div>

  <!-- ── Historique ─────────────────────────────────────────────── -->
  @if (etape() === 'historique') {
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 class="font-semibold text-gray-700 mb-4">Historique des imports</h2>
      @if (historiqueCharge()) {
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-gray-600">
              <tr>
                <th class="px-3 py-2 text-left">Date</th>
                <th class="px-3 py-2 text-left">Format</th>
                <th class="px-3 py-2 text-left">Type</th>
                <th class="px-3 py-2 text-left">Fichier</th>
                <th class="px-3 py-2 text-right">Importés</th>
                <th class="px-3 py-2 text-right">Ignorés</th>
                <th class="px-3 py-2 text-right">Erreurs</th>
                <th class="px-3 py-2 text-left">Statut</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (h of historique(); track h.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-3 py-2 text-gray-500">{{ h.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td class="px-3 py-2 font-medium">{{ h.format }}</td>
                  <td class="px-3 py-2">{{ labelTypeDonnees(h.typeDonnees) }}</td>
                  <td class="px-3 py-2 text-gray-500 max-w-32 truncate">{{ h.nomFichier }}</td>
                  <td class="px-3 py-2 text-right text-green-600 font-medium">{{ h.nbImportes }}</td>
                  <td class="px-3 py-2 text-right text-gray-500">{{ h.nbIgnores }}</td>
                  <td class="px-3 py-2 text-right text-red-500">{{ h.nbErreurs }}</td>
                  <td class="px-3 py-2">
                    <span [class]="statutClass(h.statut)" class="px-2 py-0.5 rounded-full text-xs font-medium">
                      {{ h.statut }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="8" class="px-3 py-6 text-center text-gray-400">Aucun import enregistré</td></tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="text-center py-8 text-gray-400">Chargement...</div>
      }
      <button (click)="etape.set('choix')" class="mt-4 text-sm text-blue-600 hover:underline">← Nouveau import</button>
    </div>
  }

  <!-- ── Étape 1 : Choix format + type ─────────────────────────── -->
  @if (etape() === 'choix') {
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

      <!-- Format logiciel -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 class="font-semibold text-gray-700 mb-4">1. Logiciel source</h2>
        <div class="space-y-2">
          @for (f of formats; track f.value) {
            <label class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all"
                   [class]="formatSelectionne() === f.value
                     ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'">
              <input type="radio" name="format" [value]="f.value"
                     [checked]="formatSelectionne() === f.value"
                     (change)="onFormatChange(f.value)" class="accent-blue-600">
              <div>
                <div class="font-medium text-sm">{{ f.label }}</div>
                <div class="text-xs text-gray-400">{{ f.extensions.join(', ') }}</div>
              </div>
            </label>
          }
        </div>
      </div>

      <!-- Type de données -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 class="font-semibold text-gray-700 mb-4">2. Type de données</h2>
        <div class="space-y-2">
          @for (t of typesDonneesDisponibles(); track t.value) {
            <label class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all"
                   [class]="typeDonneesSelectionne() === t.value
                     ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'">
              <input type="radio" name="type" [value]="t.value"
                     [checked]="typeDonneesSelectionne() === t.value"
                     (change)="typeDonneesSelectionne.set(t.value)" class="accent-blue-600">
              <span class="font-medium text-sm">{{ t.label }}</span>
            </label>
          }
        </div>

        <button (click)="etape.set('upload')"
                [disabled]="!formatSelectionne() || !typeDonneesSelectionne()"
                class="mt-6 w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm
                       hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Continuer →
        </button>
      </div>
    </div>
  }

  <!-- ── Étape 2 : Upload ───────────────────────────────────────── -->
  @if (etape() === 'upload') {
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-lg">
      <h2 class="font-semibold text-gray-700 mb-2">Importer le fichier</h2>
      <p class="text-sm text-gray-500 mb-4">
        Format : <strong>{{ labelFormat() }}</strong> —
        Données : <strong>{{ labelType() }}</strong>
      </p>

      <!-- Zone drag & drop -->
      <div class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors"
           (dragover)="$event.preventDefault()" (drop)="onDrop($event)">
        @if (fichierSelectionne()) {
          <div class="text-green-600">
            <div class="text-3xl mb-2">✅</div>
            <div class="font-medium">{{ fichierSelectionne()!.name }}</div>
            <div class="text-sm text-gray-400">{{ formatTaille(fichierSelectionne()!.size) }}</div>
          </div>
        } @else {
          <div class="text-gray-400">
            <div class="text-4xl mb-3">📂</div>
            <div class="font-medium">Glisser-déposer le fichier ici</div>
            <div class="text-sm mt-1">ou</div>
          </div>
        }
        <label class="mt-3 inline-block cursor-pointer">
          <span class="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            Parcourir...
          </span>
          <input type="file" class="hidden" [accept]="extensionsAcceptees()"
                 (change)="onFichierChange($event)">
        </label>
      </div>

      @if (erreurUpload()) {
        <div class="mt-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{{ erreurUpload() }}</div>
      }

      <div class="flex gap-3 mt-5">
        <button (click)="etape.set('choix')" class="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
          ← Retour
        </button>
        <button (click)="lancerPreview()"
                [disabled]="!fichierSelectionne() || chargementPreview()"
                class="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium
                       hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">
          {{ chargementPreview() ? 'Analyse...' : 'Analyser le fichier →' }}
        </button>
      </div>
    </div>
  }

  <!-- ── Étape 3 : Mapping des colonnes ────────────────────────── -->
  @if (etape() === 'mapping') {
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold text-gray-700">Correspondance des colonnes</h2>
        <span class="text-sm text-gray-400">{{ preview()!.totalLignes }} lignes détectées</span>
      </div>

      <!-- Aperçu tableau -->
      <div class="overflow-x-auto mb-6 rounded-lg border border-gray-200">
        <table class="text-xs w-full">
          <thead class="bg-gray-50">
            <tr>
              @for (col of preview()!.colonnes; track col) {
                <th class="px-2 py-2 text-left font-medium text-gray-600 border-r border-gray-200 whitespace-nowrap">
                  {{ col }}
                </th>
              }
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (row of preview()!.lignes.slice(0, 5); track row) {
              <tr>
                @for (cell of row; track cell) {
                  <td class="px-2 py-1.5 text-gray-700 border-r border-gray-100 whitespace-nowrap max-w-32 truncate">
                    {{ cell }}
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Mapping colonnes -->
      <h3 class="font-medium text-gray-700 mb-3 text-sm">Associer les colonnes aux champs e-compta</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        @for (m of mappingEditable(); track m.colonneSource) {
          <div class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <span class="flex-1 text-sm text-gray-700 font-medium truncate" [title]="m.colonneSource">
              {{ m.colonneSource }}
            </span>
            <span class="text-gray-400 text-xs">→</span>
            <select [(ngModel)]="m.champCible"
                    class="flex-1 text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">-- Ignorer --</option>
              @for (champ of champsCibles(); track champ.value) {
                <option [value]="champ.value">{{ champ.label }}</option>
              }
            </select>
          </div>
        }
      </div>

      <div class="flex gap-3 mt-6">
        <button (click)="etape.set('upload')" class="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
          ← Retour
        </button>
        <button (click)="etape.set('confirmation')"
                class="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          Confirmer et importer →
        </button>
      </div>
    </div>
  }

  <!-- ── Étape 4 : Confirmation ─────────────────────────────────── -->
  @if (etape() === 'confirmation') {
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-lg">
      <h2 class="font-semibold text-gray-700 mb-4">Confirmer l'import</h2>
      <div class="space-y-2 text-sm text-gray-600 mb-6">
        <div class="flex justify-between"><span>Fichier</span><span class="font-medium">{{ fichierSelectionne()!.name }}</span></div>
        <div class="flex justify-between"><span>Format</span><span class="font-medium">{{ labelFormat() }}</span></div>
        <div class="flex justify-between"><span>Type</span><span class="font-medium">{{ labelType() }}</span></div>
        <div class="flex justify-between"><span>Lignes à traiter</span><span class="font-medium">{{ preview()!.totalLignes }}</span></div>
      </div>
      <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 mb-6">
        ⚠️ Les données existantes ne seront pas écrasées — les doublons sont automatiquement ignorés.
      </div>
      <div class="flex gap-3">
        <button (click)="etape.set('mapping')" class="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
          ← Retour
        </button>
        <button (click)="lancerImport()"
                [disabled]="chargementImport()"
                class="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium
                       hover:bg-green-700 disabled:opacity-40">
          {{ chargementImport() ? 'Import en cours...' : '✅ Lancer l\'import' }}
        </button>
      </div>
    </div>
  }

  <!-- ── Étape 5 : Résultat ─────────────────────────────────────── -->
  @if (etape() === 'resultat' && resultat()) {
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
      <h2 class="font-semibold text-gray-700 mb-5">Résultat de l'import</h2>

      <!-- Métriques -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="text-center p-4 bg-green-50 rounded-xl">
          <div class="text-3xl font-bold text-green-600">{{ resultat()!.nbImportes }}</div>
          <div class="text-xs text-green-700 mt-1">Importés</div>
        </div>
        <div class="text-center p-4 bg-gray-50 rounded-xl">
          <div class="text-3xl font-bold text-gray-500">{{ resultat()!.nbIgnores }}</div>
          <div class="text-xs text-gray-500 mt-1">Ignorés (doublons)</div>
        </div>
        <div class="text-center p-4 bg-red-50 rounded-xl">
          <div class="text-3xl font-bold text-red-500">{{ resultat()!.nbErreurs }}</div>
          <div class="text-xs text-red-600 mt-1">Erreurs</div>
        </div>
      </div>

      <!-- Erreurs détail -->
      @if (resultat()!.erreurs?.length) {
        <div class="mb-5">
          <h3 class="font-medium text-gray-700 text-sm mb-2">Détail des erreurs</h3>
          <div class="max-h-48 overflow-y-auto rounded-lg border border-red-100">
            @for (e of resultat()!.erreurs; track e.ligne) {
              <div class="flex items-start gap-2 px-3 py-2 text-xs border-b border-red-50 last:border-0">
                <span class="text-gray-400 shrink-0">L.{{ e.ligne }}</span>
                <span class="text-gray-600 shrink-0">{{ e.reference }}</span>
                <span class="text-red-600">{{ e.message }}</span>
              </div>
            }
          </div>
        </div>
      }

      <button (click)="recommencer()"
              class="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
        Faire un autre import
      </button>
    </div>
  }

</div>
  `,
})
export class MigrationComponent {
  private svc = inject(MigrationService);

  // ── Référentiels ──────────────────────────────────────────────────────────
  formats = FORMATS_LOGICIEL;
  typesDonnees = TYPES_DONNEES;

  // ── État wizard ───────────────────────────────────────────────────────────
  etape               = signal<Etape>('choix');
  formatSelectionne   = signal<FormatImport | null>(null);
  typeDonneesSelectionne = signal<TypeDonnees | null>(null);
  fichierSelectionne  = signal<File | null>(null);
  preview             = signal<PreviewDto | null>(null);
  mappingEditable     = signal<ColonneMapping[]>([]);
  resultat            = signal<ImportResultDto | null>(null);
  historique          = signal<ImportHistoriqueDto[]>([]);
  historiqueCharge    = signal(false);
  chargementPreview   = signal(false);
  chargementImport    = signal(false);
  erreurUpload        = signal<string | null>(null);

  // ── Computed ──────────────────────────────────────────────────────────────
  typesDonneesDisponibles = computed(() => {
    const fmt = this.formatSelectionne();
    if (!fmt) return this.typesDonnees;
    return this.typesDonnees.filter(t => t.formats.includes(fmt));
  });

  extensionsAcceptees = computed(() => {
    const fmt = this.formats.find(f => f.value === this.formatSelectionne());
    return fmt ? fmt.extensions.join(',') : '*';
  });

  champsCibles = computed(() => {
    const t = this.typeDonneesSelectionne();
    return t ? CHAMPS_CIBLES[t] : [];
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  onFormatChange(fmt: FormatImport) {
    this.formatSelectionne.set(fmt);
    const types = this.typesDonnees.filter(t => t.formats.includes(fmt));
    if (types.length === 1) this.typeDonneesSelectionne.set(types[0].value);
    else this.typeDonneesSelectionne.set(null);
  }

  onFichierChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) { this.fichierSelectionne.set(file); this.erreurUpload.set(null); }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) { this.fichierSelectionne.set(file); this.erreurUpload.set(null); }
  }

  toggleHistorique() {
    if (this.etape() === 'historique') { this.etape.set('choix'); return; }
    this.etape.set('historique');
    this.historiqueCharge.set(false);
    this.svc.historique().subscribe({
      next: h => { this.historique.set(h); this.historiqueCharge.set(true); },
      error: () => this.historiqueCharge.set(true),
    });
  }

  lancerPreview() {
    const file = this.fichierSelectionne();
    const fmt  = this.formatSelectionne();
    if (!file || !fmt) return;
    this.chargementPreview.set(true);
    this.erreurUpload.set(null);
    this.svc.preview(file, fmt).subscribe({
      next: p => {
        this.preview.set(p);
        this.mappingEditable.set(p.mappingSuggere.map(m => ({ ...m })));
        this.chargementPreview.set(false);
        this.etape.set('mapping');
      },
      error: err => {
        this.erreurUpload.set(err.error?.detail ?? 'Erreur lors de l\'analyse du fichier.');
        this.chargementPreview.set(false);
      },
    });
  }

  lancerImport() {
    const file = this.fichierSelectionne();
    const fmt  = this.formatSelectionne();
    const type = this.typeDonneesSelectionne();
    if (!file || !fmt || !type) return;

    const mapping: Record<string, string> = {};
    this.mappingEditable().forEach(m => {
      if (m.champCible) mapping[m.colonneSource] = m.champCible;
    });

    this.chargementImport.set(true);
    this.svc.importer(file, fmt, type, mapping).subscribe({
      next: r => { this.resultat.set(r); this.chargementImport.set(false); this.etape.set('resultat'); },
      error: err => {
        this.resultat.set({ nbImportes: 0, nbIgnores: 0, nbErreurs: 1,
          erreurs: [{ ligne: 0, reference: '', message: err.error?.detail ?? 'Erreur serveur' }],
          historiquId: null });
        this.chargementImport.set(false);
        this.etape.set('resultat');
      },
    });
  }

  recommencer() {
    this.etape.set('choix');
    this.fichierSelectionne.set(null);
    this.preview.set(null);
    this.resultat.set(null);
    this.formatSelectionne.set(null);
    this.typeDonneesSelectionne.set(null);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  labelFormat() { return this.formats.find(f => f.value === this.formatSelectionne())?.label ?? ''; }
  labelType()   { return this.typesDonnees.find(t => t.value === this.typeDonneesSelectionne())?.label ?? ''; }
  labelTypeDonnees(v: string) { return this.typesDonnees.find(t => t.value === v)?.label ?? v; }
  formatTaille(b: number) { return b > 1e6 ? (b/1e6).toFixed(1)+'Mo' : (b/1024).toFixed(0)+'Ko'; }

  statutClass(s: string) {
    return s === 'TERMINE' ? 'bg-green-100 text-green-700'
         : s === 'ERREUR'  ? 'bg-red-100 text-red-700'
         : 'bg-gray-100 text-gray-700';
  }
}
