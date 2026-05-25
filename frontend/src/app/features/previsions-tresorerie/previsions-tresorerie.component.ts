import {
  Component, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef,
  ViewChild, ElementRef, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { PrevisionsTresorerieService } from '../../core/services/previsions-tresorerie.service';
import {
  PrevisionResponse,
  SemaineProjection,
  FluxItem,
  FluxManuelForm,
  FluxManuelResponse
} from '../../core/models/previsions-tresorerie.model';

Chart.register(...registerables);

@Component({
  selector: 'app-previsions-tresorerie',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Prévisions de trésorerie</h1>
      <p class="text-sm text-gray-500 mt-0.5">Projection sur {{ semaines }} semaines</p>
    </div>
    <div class="flex items-center gap-3">
      <label class="text-sm text-gray-600">Semaines :</label>
      <select [(ngModel)]="semaines" (change)="charger()"
              class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
        <option [value]="4">4</option>
        <option [value]="8">8</option>
        <option [value]="13">13</option>
        <option [value]="26">26</option>
      </select>
      <label class="text-sm text-gray-600">Seuil alerte :</label>
      <input type="number" [(ngModel)]="seuilAlerte" (change)="charger()"
             class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-28">
    </div>
  </div>

  <!-- KPI Cards -->
  @if (data) {
    <div class="grid grid-cols-3 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Solde courant</p>
        <p class="text-2xl font-bold mt-1"
           [ngClass]="data.soldeCourant >= 0 ? 'text-green-600' : 'text-red-600'">
          {{ fmt(data.soldeCourant) }}
        </p>
        <p class="text-xs text-gray-400 mt-1">au {{ data.dateCalcul | date:'dd/MM/yyyy' }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Créances à encaisser</p>
        <p class="text-2xl font-bold mt-1 text-blue-600">{{ fmt(data.totalCreances) }}</p>
        <p class="text-xs text-gray-400 mt-1">factures émises impayées</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Solde projeté fin S{{ semaines }}</p>
        @if (data.semaines.length > 0) {
          @let derniere = data.semaines[data.semaines.length - 1];
          <p class="text-2xl font-bold mt-1"
             [ngClass]="derniere.soldeFin >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ fmt(derniere.soldeFin) }}
          </p>
          <p class="text-xs text-gray-400 mt-1">{{ derniere.alerte ? '⚠ en dessous du seuil' : 'au-dessus du seuil' }}</p>
        }
      </div>
    </div>

    <!-- Chart -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <h2 class="text-sm font-semibold text-gray-700 mb-3">Évolution du solde de trésorerie</h2>
      <canvas #chartCanvas style="height:220px"></canvas>
    </div>

    <!-- Weekly table -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
          <tr>
            <th class="px-4 py-2 text-left">Semaine</th>
            <th class="px-4 py-2 text-right">Entrées</th>
            <th class="px-4 py-2 text-right">Sorties</th>
            <th class="px-4 py-2 text-right">Net</th>
            <th class="px-4 py-2 text-right">Solde fin</th>
            <th class="px-4 py-2 text-center">Alerte</th>
          </tr>
        </thead>
        <tbody>
          @for (s of data.semaines; track s.label) {
            <tr class="border-t border-gray-100 hover:bg-gray-50"
                [ngClass]="s.alerte ? 'bg-red-50' : ''">
              <td class="px-4 py-2 font-medium text-gray-800">{{ s.label }}</td>
              <td class="px-4 py-2 text-right text-green-600">{{ fmt(s.entrees) }}</td>
              <td class="px-4 py-2 text-right text-red-500">{{ fmt(s.sorties) }}</td>
              <td class="px-4 py-2 text-right font-medium"
                  [ngClass]="(s.entrees - s.sorties) >= 0 ? 'text-green-700' : 'text-red-600'">
                {{ fmt(s.entrees - s.sorties) }}
              </td>
              <td class="px-4 py-2 text-right font-bold"
                  [ngClass]="s.soldeFin >= 0 ? 'text-gray-800' : 'text-red-700'">
                {{ fmt(s.soldeFin) }}
              </td>
              <td class="px-4 py-2 text-center">
                @if (s.alerte) { <span class="text-red-500 font-bold">⚠</span> }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <!-- Flux details -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <h2 class="text-sm font-semibold text-gray-700 mb-3">Détail des flux prévus</h2>
      @if (data.fluxDetails.length === 0) {
        <p class="text-sm text-gray-400 text-center py-4">Aucun flux prévu sur la période</p>
      } @else {
        <div class="space-y-1">
          @for (f of data.fluxDetails; track f.id) {
            <div class="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50 text-sm">
              <div class="flex items-center gap-3">
                <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                      [ngClass]="f.type === 'ENCAISSEMENT'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'">
                  {{ f.type === 'ENCAISSEMENT' ? 'E' : 'D' }}
                </span>
                <span class="text-gray-500 w-20 shrink-0">{{ f.date | date:'dd/MM/yy' }}</span>
                <span class="text-gray-800">{{ f.libelle }}</span>
                @if (f.categorie) {
                  <span class="text-xs text-gray-400 italic">{{ f.categorie }}</span>
                }
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{{ f.source }}</span>
                <span class="font-semibold w-32 text-right"
                      [ngClass]="f.type === 'ENCAISSEMENT' ? 'text-green-600' : 'text-red-500'">
                  {{ f.type === 'ENCAISSEMENT' ? '+' : '-' }}{{ fmt(f.montant) }}
                </span>
              </div>
            </div>
          }
        </div>
      }
    </div>
  }

  <!-- Flux manuels section -->
  <div class="bg-white rounded-xl border border-gray-200 p-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-sm font-semibold text-gray-700">Flux manuels planifiés</h2>
      <button (click)="showForm = !showForm"
              class="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">
        {{ showForm ? 'Annuler' : '+ Ajouter un flux' }}
      </button>
    </div>

    @if (showForm) {
      <form (ngSubmit)="submitFlux()" class="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
        <div>
          <label class="text-xs text-gray-600">Date</label>
          <input type="date" [(ngModel)]="form.dateFlux" name="dateFlux" required
                 class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
        </div>
        <div>
          <label class="text-xs text-gray-600">Type</label>
          <select [(ngModel)]="form.typeFlux" name="typeFlux"
                  class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
            <option value="ENCAISSEMENT">Encaissement</option>
            <option value="DECAISSEMENT">Décaissement</option>
          </select>
        </div>
        <div class="col-span-2">
          <label class="text-xs text-gray-600">Libellé</label>
          <input type="text" [(ngModel)]="form.libelle" name="libelle" required
                 class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
        </div>
        <div>
          <label class="text-xs text-gray-600">Montant</label>
          <input type="number" step="0.01" [(ngModel)]="form.montant" name="montant" required
                 class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
        </div>
        <div>
          <label class="text-xs text-gray-600">Catégorie</label>
          <input type="text" [(ngModel)]="form.categorie" name="categorie"
                 placeholder="ex: loyer, salaires..."
                 class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" [(ngModel)]="form.recurrent" name="recurrent" id="recurrent">
          <label for="recurrent" class="text-sm text-gray-600">Récurrent</label>
        </div>
        @if (form.recurrent) {
          <div>
            <label class="text-xs text-gray-600">Périodicité</label>
            <select [(ngModel)]="form.periodicite" name="periodicite"
                    class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
              <option value="MENSUEL">Mensuel</option>
              <option value="TRIMESTRIEL">Trimestriel</option>
              <option value="ANNUEL">Annuel</option>
            </select>
          </div>
        }
        <div class="col-span-2 flex justify-end gap-2">
          <button type="submit"
                  class="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            Enregistrer
          </button>
        </div>
      </form>
    }

    @if (fluxManuels.length === 0 && !showForm) {
      <p class="text-sm text-gray-400 text-center py-4">Aucun flux manuel planifié</p>
    } @else if (fluxManuels.length > 0) {
      <div class="space-y-1">
        @for (f of fluxManuels; track f.id) {
          <div class="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50 text-sm">
            <div class="flex items-center gap-3">
              <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                    [ngClass]="f.typeFlux === 'ENCAISSEMENT'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'">
                {{ f.typeFlux === 'ENCAISSEMENT' ? 'Enc.' : 'Déc.' }}
              </span>
              <span class="text-gray-500 w-20 shrink-0">{{ f.dateFlux | date:'dd/MM/yyyy' }}</span>
              <span class="text-gray-800">{{ f.libelle }}</span>
              @if (f.categorie) {
                <span class="text-xs text-gray-400 italic">{{ f.categorie }}</span>
              }
              @if (f.recurrent) {
                <span class="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">
                  {{ f.periodicite || 'récurrent' }}
                </span>
              }
            </div>
            <div class="flex items-center gap-3">
              <span class="font-semibold"
                    [ngClass]="f.typeFlux === 'ENCAISSEMENT' ? 'text-green-600' : 'text-red-500'">
                {{ fmt(f.montant) }}
              </span>
              <button (click)="supprimerFlux(f.id)"
                      class="text-red-400 hover:text-red-600 text-xs">Suppr.</button>
            </div>
          </div>
        }
      </div>
    }
  </div>

</div>
  `
})
export class PrevisionsTresorerieComponent implements OnInit, OnDestroy {

  private svc = inject(PrevisionsTresorerieService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  data: PrevisionResponse | null = null;
  fluxManuels: FluxManuelResponse[] = [];
  showForm = false;
  semaines = 13;
  seuilAlerte = 0;
  form: FluxManuelForm = this.emptyForm();

  ngOnInit() {
    this.charger();
    this.chargerFlux();
  }

  ngOnDestroy() { this.chart?.destroy(); }

  charger() {
    this.svc.getProjection(this.semaines, this.seuilAlerte).subscribe(d => {
      this.data = d;
      this.cdr.detectChanges();
      Promise.resolve().then(() => this.renderChart());
    });
  }

  chargerFlux() {
    this.svc.listFlux().subscribe(l => { this.fluxManuels = l; });
  }

  submitFlux() {
    this.svc.addFlux(this.form).subscribe(() => {
      this.showForm = false;
      this.form = this.emptyForm();
      this.chargerFlux();
      this.charger();
    });
  }

  supprimerFlux(id: string) {
    if (!confirm('Supprimer ce flux ?')) return;
    this.svc.deleteFlux(id).subscribe(() => {
      this.chargerFlux();
      this.charger();
    });
  }

  private renderChart() {
    if (!this.chartCanvas || !this.data) return;
    this.chart?.destroy();

    const labels  = this.data.semaines.map(s => s.label);
    const soldes  = this.data.semaines.map(s => s.soldeFin);
    const entrees = this.data.semaines.map(s => s.entrees);
    const sorties = this.data.semaines.map(s => s.sorties);

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'line',
            label: 'Solde fin de semaine',
            data: soldes,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37,99,235,0.08)',
            tension: 0.3,
            fill: true,
            yAxisID: 'y',
            order: 0,
            pointBackgroundColor: soldes.map(v =>
              v < this.seuilAlerte ? '#ef4444' : '#2563eb')
          },
          {
            type: 'bar',
            label: 'Entrées',
            data: entrees,
            backgroundColor: 'rgba(22,163,74,0.6)',
            yAxisID: 'y',
            order: 1
          },
          {
            type: 'bar',
            label: 'Sorties',
            data: sorties.map(v => -v),
            backgroundColor: 'rgba(220,38,38,0.5)',
            yAxisID: 'y',
            order: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
          y: {
            ticks: {
              callback: (v) => this.fmtNum(Number(v))
            }
          }
        }
      }
    });
  }

  fmt(n: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'XOF', maximumFractionDigits: 0
    }).format(n);
  }

  private fmtNum(n: number): string {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);
  }

  private emptyForm(): FluxManuelForm {
    return {
      dateFlux: '', typeFlux: 'ENCAISSEMENT', libelle: '',
      montant: 0, recurrent: false, periodicite: 'MENSUEL', categorie: ''
    };
  }
}
