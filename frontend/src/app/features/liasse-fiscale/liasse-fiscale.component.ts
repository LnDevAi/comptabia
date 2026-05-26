import {
  ChangeDetectionStrategy, Component, computed, inject, OnInit, signal
} from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LiasseFiscaleService } from '../../core/services/liasse-fiscale.service';
import { LiasseFiscale } from '../../core/models/liasse-fiscale.model';
import { BilanData, PosteBilan, CompteResultatData, FluxTresorerieData, EvcapData, NoteAnnexe } from '../../core/models/etats.model';

@Component({
  selector: 'app-liasse-fiscale',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DecimalPipe, DatePipe],
  template: `
<div class="p-6 space-y-4">

  <!-- Header toolbar (masqué à l'impression) -->
  <div class="flex items-center justify-between no-print">
    <div>
      <h1 class="text-xl font-bold text-gray-800">Liasse fiscale SYSCOHADA</h1>
      <p class="text-xs text-gray-500 mt-0.5">
        Ensemble des états financiers requis pour le dépôt légal OHADA
      </p>
    </div>
    <div class="flex items-center gap-3">
      <label class="text-sm text-gray-600">Exercice</label>
      <select [ngModel]="exercice()" (ngModelChange)="setExercice($event)"
              class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        @for (y of years(); track y) {
          <option [value]="y">{{ y }}</option>
        }
      </select>
      <button (click)="imprimer()"
              class="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 flex items-center gap-2">
        Imprimer / PDF
      </button>
      <button (click)="exportCsv()" [disabled]="!liasse()"
              class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-40">
        Export CSV
      </button>
    </div>
  </div>

  @if (loading()) {
    <div class="flex items-center justify-center h-48 text-gray-400 text-sm">Chargement de la liasse…</div>
  } @else if (error()) {
    <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{{ error() }}</div>
  } @else if (liasse()) {

    <!-- ─── PAGE LIASSE ─────────────────────────────────────────────────────── -->
    <div id="liasse-print" class="bg-white space-y-6">

      <!-- En-tête officielle -->
      <div class="border-2 border-gray-800 rounded-xl p-5">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <div class="text-xl font-bold text-gray-900">{{ liasse()!.entete.nomEntreprise }}</div>
            @if (liasse()!.entete.adresse) {
              <div class="text-sm text-gray-600">{{ liasse()!.entete.adresse }}</div>
            }
            <div class="text-sm text-gray-600">{{ liasse()!.entete.pays }}</div>
          </div>
          <div class="text-right space-y-1 text-sm text-gray-700">
            @if (liasse()!.entete.rccm) {
              <div><span class="font-semibold">RCCM :</span> {{ liasse()!.entete.rccm }}</div>
            }
            @if (liasse()!.entete.nif) {
              <div><span class="font-semibold">NIF :</span> {{ liasse()!.entete.nif }}</div>
            }
            @if (liasse()!.entete.ifu) {
              <div><span class="font-semibold">IFU :</span> {{ liasse()!.entete.ifu }}</div>
            }
            <div><span class="font-semibold">Référentiel :</span> {{ liasse()!.entete.referentiel }}</div>
          </div>
        </div>
        <div class="mt-3 pt-3 border-t border-gray-300 flex items-center justify-between">
          <div class="text-lg font-bold text-blue-800 uppercase tracking-wide">
            Liasse Fiscale — Exercice {{ liasse()!.entete.exercice }}
          </div>
          <div class="text-xs text-gray-500">
            Générée le {{ liasse()!.entete.dateGeneration | date:'dd/MM/yyyy' }}
          </div>
        </div>
      </div>

      <!-- Sommaire (masqué à l'impression, déjà visible dans les sections) -->
      <div class="grid grid-cols-5 gap-2 no-print">
        @for (s of sections; track s.id) {
          <button (click)="scrollTo(s.id)"
                  class="border border-gray-200 rounded-xl p-3 text-center text-xs font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-200 transition-colors">
            <div class="text-sm mb-0.5">{{ s.icon }}</div>
            {{ s.label }}
          </button>
        }
      </div>

      <!-- ── BILAN ─────────────────────────────────────────────────────────── -->
      <section [id]="'section-bilan'" class="border border-gray-200 rounded-xl overflow-hidden page-break-before">
        <div class="bg-blue-700 text-white px-5 py-3 flex items-center justify-between">
          <span class="font-bold uppercase tracking-wide">État 1 — Bilan</span>
          <span class="text-xs font-normal opacity-80">Exercice clos le 31/12/{{ liasse()!.entete.exercice }}</span>
        </div>
        <div class="p-5 grid grid-cols-2 gap-6">
          <!-- Actif -->
          <div>
            <h3 class="text-xs font-bold uppercase text-blue-700 border-b border-blue-200 pb-1 mb-2">ACTIF</h3>
            @for (cat of actifCats(); track cat) {
              <div class="mb-3">
                <div class="text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded mb-1">{{ cat }}</div>
                @for (p of actifByCat(cat); track p.numero) {
                  <div class="flex justify-between text-sm py-0.5 px-1">
                    <span class="text-gray-700">{{ p.numero }} – {{ p.intitule }}</span>
                    <span class="font-mono text-gray-800">{{ p.montant | number:'1.2-2' }}</span>
                  </div>
                }
              </div>
            }
            <div class="flex justify-between font-bold border-t-2 border-blue-700 pt-2 text-sm mt-1 bg-blue-50 px-2 py-1 rounded">
              <span>TOTAL ACTIF</span>
              <span class="font-mono">{{ liasse()!.bilan.totalActif | number:'1.2-2' }}</span>
            </div>
          </div>
          <!-- Passif -->
          <div>
            <h3 class="text-xs font-bold uppercase text-green-700 border-b border-green-200 pb-1 mb-2">PASSIF</h3>
            @for (cat of passifCats(); track cat) {
              <div class="mb-3">
                <div class="text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded mb-1">{{ cat }}</div>
                @for (p of passifByCat(cat); track p.numero) {
                  <div class="flex justify-between text-sm py-0.5 px-1">
                    <span class="text-gray-700">{{ p.numero }} – {{ p.intitule }}</span>
                    <span class="font-mono text-gray-800">{{ p.montant | number:'1.2-2' }}</span>
                  </div>
                }
              </div>
            }
            <div class="flex justify-between font-bold border-t-2 border-green-700 pt-2 text-sm mt-1 bg-green-50 px-2 py-1 rounded">
              <span>TOTAL PASSIF</span>
              <span class="font-mono">{{ liasse()!.bilan.totalPassif | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>
        <div class="px-5 pb-3 flex justify-between items-center text-xs border-t border-gray-100 pt-2">
          <span [class]="liasse()!.bilan.totalActif === liasse()!.bilan.totalPassif ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold'">
            {{ liasse()!.bilan.totalActif === liasse()!.bilan.totalPassif ? '✓ Bilan équilibré' : '⚠ Bilan déséquilibré' }}
          </span>
          <span class="text-gray-400">Écart : {{ (liasse()!.bilan.totalActif - liasse()!.bilan.totalPassif) | number:'1.2-2' }}</span>
        </div>
      </section>

      <!-- ── COMPTE DE RÉSULTAT ────────────────────────────────────────────── -->
      <section [id]="'section-cr'" class="border border-gray-200 rounded-xl overflow-hidden">
        <div class="bg-indigo-700 text-white px-5 py-3 flex items-center justify-between">
          <span class="font-bold uppercase tracking-wide">État 2 — Compte de résultat</span>
          <span class="text-xs font-normal opacity-80">Du 01/01/{{ liasse()!.entete.exercice }} au 31/12/{{ liasse()!.entete.exercice }}</span>
        </div>
        <div class="p-5 grid grid-cols-2 gap-6">
          <div>
            <h3 class="text-xs font-bold uppercase text-red-600 border-b border-red-200 pb-1 mb-2">CHARGES (Cl.6)</h3>
            @for (p of liasse()!.compteResultat.charges; track p.numero) {
              <div class="flex justify-between text-sm py-0.5 px-1">
                <span class="text-gray-700">{{ p.numero }} – {{ p.intitule }}</span>
                <span class="font-mono">{{ p.montant | number:'1.2-2' }}</span>
              </div>
            }
            <div class="flex justify-between font-bold border-t-2 border-red-500 pt-2 text-sm mt-1 bg-red-50 px-2 py-1 rounded">
              <span>Total charges</span>
              <span class="font-mono text-red-700">{{ liasse()!.compteResultat.totalCharges | number:'1.2-2' }}</span>
            </div>
          </div>
          <div>
            <h3 class="text-xs font-bold uppercase text-green-600 border-b border-green-200 pb-1 mb-2">PRODUITS (Cl.7)</h3>
            @for (p of liasse()!.compteResultat.produits; track p.numero) {
              <div class="flex justify-between text-sm py-0.5 px-1">
                <span class="text-gray-700">{{ p.numero }} – {{ p.intitule }}</span>
                <span class="font-mono">{{ p.montant | number:'1.2-2' }}</span>
              </div>
            }
            <div class="flex justify-between font-bold border-t-2 border-green-500 pt-2 text-sm mt-1 bg-green-50 px-2 py-1 rounded">
              <span>Total produits</span>
              <span class="font-mono text-green-700">{{ liasse()!.compteResultat.totalProduits | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>
        <div class="mx-5 mb-4 p-3 rounded-xl text-sm font-bold flex justify-between"
             [class]="liasse()!.compteResultat.resultat >= 0 ? 'bg-green-100 text-green-900 border border-green-300' : 'bg-red-100 text-red-900 border border-red-300'">
          <span>RÉSULTAT NET — Exercice {{ liasse()!.entete.exercice }} {{ liasse()!.compteResultat.resultat >= 0 ? '(BÉNÉFICE)' : '(PERTE)' }}</span>
          <span class="font-mono text-base">{{ liasse()!.compteResultat.resultat | number:'1.2-2' }}</span>
        </div>
      </section>

      <!-- ── TFT ───────────────────────────────────────────────────────────── -->
      <section [id]="'section-tft'" class="border border-gray-200 rounded-xl overflow-hidden">
        <div class="bg-teal-700 text-white px-5 py-3 flex items-center justify-between">
          <span class="font-bold uppercase tracking-wide">État 3 — Tableau des Flux de Trésorerie (TFT)</span>
          <span class="text-xs font-normal opacity-80">Méthode indirecte</span>
        </div>
        <div class="p-5 space-y-3">
          @for (section of [liasse()!.tft.operationnel, liasse()!.tft.investissement, liasse()!.tft.financement]; track section.code) {
            <div class="border border-gray-200 rounded-xl overflow-hidden">
              <div class="bg-gray-700 text-white px-4 py-2 flex justify-between items-center">
                <span class="text-sm font-semibold">{{ section.titre }}</span>
                <span class="font-mono font-bold text-sm" [class]="section.total >= 0 ? 'text-green-300' : 'text-red-300'">
                  {{ section.total | number:'1.2-2' }}
                </span>
              </div>
              <table class="w-full text-sm">
                <tbody>
                  @for (ligne of section.lignes; track ligne.libelle) {
                    @if (ligne.montant !== 0) {
                      <tr class="border-t border-gray-100">
                        <td class="px-4 py-1.5 text-gray-700">{{ ligne.libelle }}</td>
                        <td class="px-4 py-1.5 text-right font-mono w-40"
                            [class]="ligne.montant >= 0 ? 'text-blue-700' : 'text-red-600'">
                          {{ ligne.montant | number:'1.2-2' }}
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          }
          <div class="border border-gray-300 rounded-xl p-4 bg-gray-50 space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Variation nette (A + B + C)</span>
              <span class="font-mono font-bold" [class]="liasse()!.tft.variationNette >= 0 ? 'text-green-700' : 'text-red-700'">
                {{ liasse()!.tft.variationNette | number:'1.2-2' }}
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Trésorerie ouverture (N-1)</span>
              <span class="font-mono text-gray-500">{{ liasse()!.tft.tresorerieOuverture | number:'1.2-2' }}</span>
            </div>
            <div class="flex justify-between text-sm font-bold border-t border-gray-200 pt-2">
              <span>Trésorerie clôture (31/12/{{ liasse()!.entete.exercice }})</span>
              <span class="font-mono">{{ liasse()!.tft.tresorerieCloture | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ── EVCAP ─────────────────────────────────────────────────────────── -->
      <section [id]="'section-evcap'" class="border border-gray-200 rounded-xl overflow-hidden">
        <div class="bg-violet-700 text-white px-5 py-3">
          <span class="font-bold uppercase tracking-wide">État 4 — État de Variation des Capitaux Propres (EVCAP)</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th class="px-4 py-2 text-left w-20">Compte</th>
                <th class="px-4 py-2 text-left">Intitulé</th>
                <th class="px-4 py-2 text-right">Solde début N</th>
                <th class="px-4 py-2 text-right">Augmentations</th>
                <th class="px-4 py-2 text-right">Diminutions</th>
                <th class="px-4 py-2 text-right">Solde fin N</th>
              </tr>
            </thead>
            <tbody>
              @for (l of liasse()!.evcap.lignes; track l.numero) {
                <tr class="border-t border-gray-100">
                  <td class="px-4 py-1.5 font-mono text-xs">{{ l.numero }}</td>
                  <td class="px-4 py-1.5 text-gray-700">{{ l.intitule }}</td>
                  <td class="px-4 py-1.5 text-right font-mono" [class]="l.soldeDebut >= 0 ? 'text-gray-700' : 'text-red-600'">
                    {{ l.soldeDebut === 0 ? '–' : (l.soldeDebut | number:'1.2-2') }}
                  </td>
                  <td class="px-4 py-1.5 text-right font-mono text-green-700">
                    {{ l.augmentations === 0 ? '–' : (l.augmentations | number:'1.2-2') }}
                  </td>
                  <td class="px-4 py-1.5 text-right font-mono text-red-500">
                    {{ l.diminutions === 0 ? '–' : (l.diminutions | number:'1.2-2') }}
                  </td>
                  <td class="px-4 py-1.5 text-right font-mono font-semibold"
                      [class]="l.soldeFin >= 0 ? 'text-blue-700' : 'text-red-700'">
                    {{ l.soldeFin | number:'1.2-2' }}
                  </td>
                </tr>
              }
              @if (liasse()!.evcap.lignes.length === 0) {
                <tr>
                  <td colspan="6" class="px-4 py-8 text-center text-gray-400 text-sm">
                    Aucun mouvement sur les comptes de capitaux propres.
                  </td>
                </tr>
              }
            </tbody>
            <tfoot class="bg-gray-800 text-white font-semibold text-sm">
              <tr>
                <td colspan="2" class="px-4 py-2 uppercase tracking-wide text-xs">Total Capitaux Propres</td>
                <td class="px-4 py-2 text-right font-mono">{{ liasse()!.evcap.totalDebut | number:'1.2-2' }}</td>
                <td class="px-4 py-2 text-right font-mono">{{ liasse()!.evcap.totalAugmentations | number:'1.2-2' }}</td>
                <td class="px-4 py-2 text-right font-mono">{{ liasse()!.evcap.totalDiminutions | number:'1.2-2' }}</td>
                <td class="px-4 py-2 text-right font-mono">{{ liasse()!.evcap.totalFin | number:'1.2-2' }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <!-- ── NOTES ANNEXES ─────────────────────────────────────────────────── -->
      <section [id]="'section-notes'" class="border border-gray-200 rounded-xl overflow-hidden">
        <div class="bg-amber-700 text-white px-5 py-3">
          <span class="font-bold uppercase tracking-wide">État 5 — Notes annexes</span>
        </div>
        @if (liasse()!.notes.length === 0) {
          <div class="p-6 text-center text-sm text-gray-400">
            Aucune note annexe saisie pour cet exercice.
            <br>
            <span class="text-xs">Ajoutez-en depuis le module « États financiers → Notes annexes ».</span>
          </div>
        } @else {
          <div class="divide-y divide-gray-100">
            @for (note of notesSorted(); track note.id) {
              <div class="px-5 py-4">
                <div class="flex items-center gap-2 mb-2">
                  @if (note.numeroNote) {
                    <span class="text-xs font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Note {{ note.numeroNote }}
                    </span>
                  }
                  <span class="font-semibold text-gray-800 text-sm">{{ note.titre }}</span>
                </div>
                <div class="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {{ note.contenu || '(Contenu non renseigné)' }}
                </div>
              </div>
            }
          </div>
        }
      </section>

      <!-- Pied de page officiel -->
      <div class="border-t-2 border-gray-800 pt-4 pb-2 text-xs text-gray-400 flex justify-between">
        <span>{{ liasse()!.entete.nomEntreprise }} — Liasse fiscale {{ liasse()!.entete.exercice }}</span>
        <span>Document généré le {{ liasse()!.entete.dateGeneration | date:'dd/MM/yyyy' }} — {{ liasse()!.entete.referentiel }}</span>
      </div>

    </div>
  }

</div>

<style>
  @media print {
    .no-print { display: none !important; }
    body { background: white; }
    .p-6 { padding: 0 !important; }
    section { break-inside: avoid; margin-bottom: 1cm; }
    .page-break-before { break-before: page; }
  }
</style>
  `
})
export class LiasseFiscaleComponent implements OnInit {
  private svc = inject(LiasseFiscaleService);

  exercice  = signal<number>(new Date().getFullYear());
  loading   = signal(false);
  error     = signal<string | null>(null);
  liasse    = signal<LiasseFiscale | null>(null);

  years = computed(() => {
    const y = new Date().getFullYear();
    return [y, y - 1, y - 2, y - 3];
  });

  actifCats  = computed(() => [...new Set((this.liasse()?.bilan.actif ?? []).map(p => p.categorie))]);
  passifCats = computed(() => [...new Set((this.liasse()?.bilan.passif ?? []).map(p => p.categorie))]);
  notesSorted = computed(() => [...(this.liasse()?.notes ?? [])].sort((a, b) => a.ordre - b.ordre));

  readonly sections = [
    { id: 'section-bilan',  icon: '📊', label: 'Bilan' },
    { id: 'section-cr',     icon: '📈', label: 'Compte résultat' },
    { id: 'section-tft',    icon: '💰', label: 'TFT' },
    { id: 'section-evcap',  icon: '🏦', label: 'EVCAP' },
    { id: 'section-notes',  icon: '📝', label: 'Notes annexes' },
  ];

  actifByCat(cat: string): any[] {
    return (this.liasse()?.bilan.actif ?? []).filter(p => p.categorie === cat);
  }
  passifByCat(cat: string): any[] {
    return (this.liasse()?.bilan.passif ?? []).filter(p => p.categorie === cat);
  }

  ngOnInit() {
    this.load();
  }

  setExercice(y: number) {
    this.exercice.set(Number(y));
    this.load();
  }

  scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  imprimer() {
    window.print();
  }

  private load() {
    this.loading.set(true);
    this.error.set(null);
    this.liasse.set(null);
    this.svc.get(this.exercice()).subscribe({
      next: l => { this.liasse.set(l); this.loading.set(false); },
      error: (e: any) => {
        this.error.set(e?.error?.message ?? 'Erreur de chargement de la liasse.');
        this.loading.set(false);
      }
    });
  }

  exportCsv() {
    const l = this.liasse();
    if (!l) return;
    const e = l.entete;
    const rows: string[] = [
      `LIASSE FISCALE ${e.exercice} — ${e.nomEntreprise}`,
      `RCCM;${e.rccm ?? ''};NIF;${e.nif ?? ''};IFU;${e.ifu ?? ''}`,
      '',
      '=== BILAN ===',
      'ACTIF;;', 'Catégorie;Compte;Intitulé;Montant',
      ...l.bilan.actif.map(p => `${p.categorie};${p.numero};${p.intitule};${p.montant}`),
      `;;TOTAL ACTIF;${l.bilan.totalActif}`,
      'PASSIF;;', 'Catégorie;Compte;Intitulé;Montant',
      ...l.bilan.passif.map(p => `${p.categorie};${p.numero};${p.intitule};${p.montant}`),
      `;;TOTAL PASSIF;${l.bilan.totalPassif}`,
      '',
      '=== COMPTE DE RÉSULTAT ===',
      'Type;Compte;Intitulé;Montant',
      ...l.compteResultat.charges.map(p => `CHARGE;${p.numero};${p.intitule};${p.montant}`),
      ...l.compteResultat.produits.map(p => `PRODUIT;${p.numero};${p.intitule};${p.montant}`),
      `;;RÉSULTAT NET;${l.compteResultat.resultat}`,
      '',
      '=== TFT ===',
      'Section;Libellé;Montant',
      ...[l.tft.operationnel, l.tft.investissement, l.tft.financement]
        .flatMap(s => [
          `${s.titre};;`,
          ...s.lignes.filter(li => li.montant !== 0).map(li => `;${li.libelle};${li.montant}`),
          `;TOTAL ${s.code};${s.total}`
        ]),
      `;Variation nette;${l.tft.variationNette}`,
      `;Trésorerie clôture;${l.tft.tresorerieCloture}`,
      '',
      '=== EVCAP ===',
      'Compte;Intitulé;Solde début;Augmentations;Diminutions;Solde fin',
      ...l.evcap.lignes.map(li =>
        `${li.numero};${li.intitule};${li.soldeDebut};${li.augmentations};${li.diminutions};${li.soldeFin}`),
      `;;${l.evcap.totalDebut};${l.evcap.totalAugmentations};${l.evcap.totalDiminutions};${l.evcap.totalFin}`,
      '',
      '=== NOTES ANNEXES ===',
      'Numéro;Titre;Contenu',
      ...l.notes.map(n => `${n.numeroNote ?? ''};${n.titre};${(n.contenu ?? '').replace(/\n/g, ' ')}`),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `liasse-fiscale-${e.exercice}-${e.nomEntreprise.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
