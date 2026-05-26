import {
  ChangeDetectionStrategy, Component, OnInit, signal
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ProvisionTechniqueService } from '../../core/services/provision-technique.service';
import { BilanCima, CompteResultatCima } from '../../core/models/provision-technique.model';

type Tab = 'bilan' | 'resultat';

@Component({
  selector: 'app-etats-assurance',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div class="p-6 max-w-5xl mx-auto space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900">États financiers CIMA</h1>
          <p class="text-sm text-gray-500 mt-0.5">Bilan et compte de résultat technique — Compagnies d'assurance</p>
        </div>
        <div class="flex items-center gap-3">
          <select [value]="exercice()" (change)="onExerciceChange(+$any($event.target).value)"
                  class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none">
            @for (y of exercices; track y) {
              <option [value]="y">{{ y }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 border-b border-gray-200">
        <button (click)="activeTab.set('bilan')"
                class="px-4 py-2 text-sm font-medium rounded-t-lg transition"
                [class]="activeTab() === 'bilan'
                  ? 'bg-blue-50 text-blue-700 border border-b-white border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'">
          Bilan CIMA
        </button>
        <button (click)="activeTab.set('resultat')"
                class="px-4 py-2 text-sm font-medium rounded-t-lg transition"
                [class]="activeTab() === 'resultat'
                  ? 'bg-blue-50 text-blue-700 border border-b-white border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'">
          Résultat technique
        </button>
      </div>

      @if (loading()) {
        <div class="text-center py-12 text-gray-400 text-sm">Chargement…</div>
      }

      <!-- BILAN CIMA -->
      @if (!loading() && activeTab() === 'bilan' && bilan()) {
        <div class="grid grid-cols-2 gap-6">

          <!-- ACTIF -->
          <div class="space-y-4">
            <h2 class="text-sm font-bold text-gray-800 uppercase tracking-wide">ACTIF</h2>

            @if (bilan()!.actifIncorporelEtCorporel.length > 0) {
              <div class="space-y-1">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2">Actifs incorporels et corporels</p>
                @for (p of bilan()!.actifIncorporelEtCorporel; track p.numero) {
                  <div class="flex justify-between text-sm px-2 py-1 hover:bg-gray-50 rounded">
                    <span class="text-gray-600 text-xs">{{ p.numero }} — {{ p.intitule }}</span>
                    <span class="font-medium">{{ p.montant | number:'1.0-0' }}</span>
                  </div>
                }
              </div>
            }

            @if (bilan()!.placements.length > 0) {
              <div class="space-y-1">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2">Placements</p>
                @for (p of bilan()!.placements; track p.numero) {
                  <div class="flex justify-between text-sm px-2 py-1 hover:bg-gray-50 rounded">
                    <span class="text-gray-600 text-xs">{{ p.numero }} — {{ p.intitule }}</span>
                    <span class="font-medium">{{ p.montant | number:'1.0-0' }}</span>
                  </div>
                }
              </div>
            }

            @if (bilan()!.operationsAssuranceActif.length > 0) {
              <div class="space-y-1">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2">Opérations d'assurance</p>
                @for (p of bilan()!.operationsAssuranceActif; track p.numero) {
                  <div class="flex justify-between text-sm px-2 py-1 hover:bg-gray-50 rounded">
                    <span class="text-gray-600 text-xs">{{ p.numero }} — {{ p.intitule }}</span>
                    <span class="font-medium">{{ p.montant | number:'1.0-0' }}</span>
                  </div>
                }
              </div>
            }

            @if (bilan()!.autresActifs.length > 0) {
              <div class="space-y-1">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2">Autres actifs</p>
                @for (p of bilan()!.autresActifs; track p.numero) {
                  <div class="flex justify-between text-sm px-2 py-1 hover:bg-gray-50 rounded">
                    <span class="text-gray-600 text-xs">{{ p.numero }} — {{ p.intitule }}</span>
                    <span class="font-medium">{{ p.montant | number:'1.0-0' }}</span>
                  </div>
                }
              </div>
            }

            @if (bilan()!.tresorerie.length > 0) {
              <div class="space-y-1">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2">Trésorerie</p>
                @for (p of bilan()!.tresorerie; track p.numero) {
                  <div class="flex justify-between text-sm px-2 py-1 hover:bg-gray-50 rounded">
                    <span class="text-gray-600 text-xs">{{ p.numero }} — {{ p.intitule }}</span>
                    <span class="font-medium">{{ p.montant | number:'1.0-0' }}</span>
                  </div>
                }
              </div>
            }

            <div class="flex justify-between text-sm font-bold border-t border-gray-200 pt-2 px-2">
              <span>TOTAL ACTIF</span>
              <span>{{ bilan()!.totalActif | number:'1.0-0' }}</span>
            </div>
          </div>

          <!-- PASSIF -->
          <div class="space-y-4">
            <h2 class="text-sm font-bold text-gray-800 uppercase tracking-wide">PASSIF</h2>

            @if (bilan()!.fondsPropres.length > 0) {
              <div class="space-y-1">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2">Fonds propres</p>
                @for (p of bilan()!.fondsPropres; track p.numero) {
                  <div class="flex justify-between text-sm px-2 py-1 hover:bg-gray-50 rounded">
                    <span class="text-gray-600 text-xs">{{ p.numero }} — {{ p.intitule }}</span>
                    <span class="font-medium">{{ p.montant | number:'1.0-0' }}</span>
                  </div>
                }
              </div>
            }

            @if (bilan()!.provisionsTechniques.length > 0) {
              <div class="space-y-1">
                <p class="text-xs font-semibold text-blue-600 uppercase tracking-wide px-2">Provisions techniques</p>
                @for (p of bilan()!.provisionsTechniques; track p.numero) {
                  <div class="flex justify-between text-sm px-2 py-1 hover:bg-blue-50 rounded">
                    <span class="text-gray-600 text-xs">{{ p.numero }} — {{ p.intitule }}</span>
                    <span class="font-medium text-blue-700">{{ p.montant | number:'1.0-0' }}</span>
                  </div>
                }
              </div>
            }

            @if (bilan()!.autresPassifs.length > 0) {
              <div class="space-y-1">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2">Autres passifs</p>
                @for (p of bilan()!.autresPassifs; track p.numero) {
                  <div class="flex justify-between text-sm px-2 py-1 hover:bg-gray-50 rounded">
                    <span class="text-gray-600 text-xs">{{ p.numero }} — {{ p.intitule }}</span>
                    <span class="font-medium">{{ p.montant | number:'1.0-0' }}</span>
                  </div>
                }
              </div>
            }

            <div class="flex justify-between text-sm font-bold border-t border-gray-200 pt-2 px-2">
              <span>TOTAL PASSIF</span>
              <span>{{ bilan()!.totalPassif | number:'1.0-0' }}</span>
            </div>
          </div>
        </div>
      }

      <!-- COMPTE DE RÉSULTAT TECHNIQUE -->
      @if (!loading() && activeTab() === 'resultat' && resultat()) {
        <div class="space-y-6">
          <div class="grid grid-cols-2 gap-6">

            <!-- Non-Vie -->
            <div class="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
              <h3 class="text-sm font-bold text-gray-700 border-b border-gray-100 pb-2">
                Compte technique Non-Vie
              </h3>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">Primes brutes Non-Vie</span>
                  <span>{{ resultat()!.primesAcquisesNonVie | number:'1.0-0' }}</span>
                </div>
                <div class="flex justify-between text-red-600">
                  <span>— Primes cédées</span>
                  <span>({{ resultat()!.primesCedeesNonVie | number:'1.0-0' }})</span>
                </div>
                <div class="flex justify-between font-medium border-t border-gray-100 pt-1">
                  <span>Primes nettes</span>
                  <span>{{ resultat()!.primesNettesNonVie | number:'1.0-0' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Produits placements alloués</span>
                  <span>{{ resultat()!.produitsPlacementsAlloues | number:'1.0-0' }}</span>
                </div>
                <div class="flex justify-between text-red-600">
                  <span>— Sinistres et frais</span>
                  <span>({{ resultat()!.sinistresEtFraisNonVie | number:'1.0-0' }})</span>
                </div>
                <div class="flex justify-between text-red-600">
                  <span>— Variation provisions</span>
                  <span>({{ resultat()!.variationProvisionsNonVie | number:'1.0-0' }})</span>
                </div>
                <div class="flex justify-between text-red-600">
                  <span>— Frais d'acquisition</span>
                  <span>({{ resultat()!.fraisAcquisitionNonVie | number:'1.0-0' }})</span>
                </div>
                <div class="flex justify-between text-red-600">
                  <span>— Frais d'administration</span>
                  <span>({{ resultat()!.fraisAdministrationNonVie | number:'1.0-0' }})</span>
                </div>
                <div class="flex justify-between font-bold text-base border-t border-gray-200 pt-2"
                     [class]="resultat()!.resultatTechniqueNonVie >= 0 ? 'text-green-700' : 'text-red-700'">
                  <span>Résultat technique Non-Vie</span>
                  <span>{{ resultat()!.resultatTechniqueNonVie | number:'1.0-0' }}</span>
                </div>
              </div>
            </div>

            <!-- Vie -->
            <div class="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
              <h3 class="text-sm font-bold text-gray-700 border-b border-gray-100 pb-2">
                Compte technique Vie
              </h3>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">Primes brutes Vie</span>
                  <span>{{ resultat()!.primesAcquisesVie | number:'1.0-0' }}</span>
                </div>
                <div class="flex justify-between text-red-600">
                  <span>— Primes cédées</span>
                  <span>({{ resultat()!.primesCedeesVie | number:'1.0-0' }})</span>
                </div>
                <div class="flex justify-between font-medium border-t border-gray-100 pt-1">
                  <span>Primes nettes Vie</span>
                  <span>{{ resultat()!.primesNettesVie | number:'1.0-0' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Produits des placements (Vie)</span>
                  <span>{{ resultat()!.produitsPlacementsVie | number:'1.0-0' }}</span>
                </div>
                <div class="flex justify-between text-red-600">
                  <span>— Prestations et rachats</span>
                  <span>({{ resultat()!.prestationsVie | number:'1.0-0' }})</span>
                </div>
                <div class="flex justify-between text-red-600">
                  <span>— Variation provisions math.</span>
                  <span>({{ resultat()!.variationProvisionsMathematiques | number:'1.0-0' }})</span>
                </div>
                <div class="flex justify-between text-red-600">
                  <span>— Frais de gestion</span>
                  <span>({{ resultat()!.fraisGestionVie | number:'1.0-0' }})</span>
                </div>
                <div class="flex justify-between font-bold text-base border-t border-gray-200 pt-2"
                     [class]="resultat()!.resultatTechniqueVie >= 0 ? 'text-green-700' : 'text-red-700'">
                  <span>Résultat technique Vie</span>
                  <span>{{ resultat()!.resultatTechniqueVie | number:'1.0-0' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Non-technique -->
          <div class="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
            <h3 class="text-sm font-bold text-gray-700 border-b border-gray-100 pb-2">
              Compte non-technique — Résultat net
            </h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="space-y-1">
                <div class="flex justify-between">
                  <span class="text-gray-600">Produits des placements nets</span>
                  <span>{{ resultat()!.produitsPlacementsNet | number:'1.0-0' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Autres produits non techniques</span>
                  <span>{{ resultat()!.autresProduitsNonTechniques | number:'1.0-0' }}</span>
                </div>
                <div class="flex justify-between text-red-600">
                  <span>— Charges non techniques</span>
                  <span>({{ resultat()!.chargesNonTechniques | number:'1.0-0' }})</span>
                </div>
              </div>
              <div class="space-y-1">
                <div class="flex justify-between">
                  <span class="text-gray-600">Résultat avant IS</span>
                  <span>{{ resultat()!.resultatAvantIS | number:'1.0-0' }}</span>
                </div>
                <div class="flex justify-between text-red-600">
                  <span>— Impôts sur les résultats</span>
                  <span>({{ resultat()!.impotsSurResultats | number:'1.0-0' }})</span>
                </div>
                <div class="flex justify-between font-bold text-base border-t border-gray-200 pt-2"
                     [class]="resultat()!.resultatNet >= 0 ? 'text-green-700' : 'text-red-700'">
                  <span>Résultat net</span>
                  <span>{{ resultat()!.resultatNet | number:'1.0-0' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class EtatsAssuranceComponent implements OnInit {

  bilan    = signal<BilanCima | null>(null);
  resultat = signal<CompteResultatCima | null>(null);
  loading  = signal(true);
  activeTab = signal<Tab>('bilan');
  exercice  = signal(new Date().getFullYear());

  exercices = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  constructor(private svc: ProvisionTechniqueService) {}

  ngOnInit() { this.charger(); }

  onExerciceChange(v: number) {
    this.exercice.set(+v);
    this.charger();
  }

  charger() {
    this.loading.set(true);
    const ex = this.exercice();
    let loaded = 0;
    const done = () => { if (++loaded === 2) this.loading.set(false); };

    this.svc.getBilanCima(ex).subscribe({
      next: b => { this.bilan.set(b); done(); },
      error: () => done()
    });
    this.svc.getCompteResultatCima(ex).subscribe({
      next: r => { this.resultat.set(r); done(); },
      error: () => done()
    });
  }
}
