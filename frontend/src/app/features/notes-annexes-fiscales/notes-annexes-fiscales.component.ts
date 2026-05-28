import {
  Component, OnInit, ChangeDetectionStrategy,
  ChangeDetectorRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotesAnnexesFiscalesService } from '../../core/services/notes-annexes-fiscales.service';
import { NotesAnnexesDocument, NotesAnnexesSection } from '../../core/models/notes-annexes.model';

@Component({
  selector: 'app-notes-annexes-fiscales',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between flex-wrap gap-3">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Notes annexes fiscales</h1>
      <p class="text-sm text-gray-500 mt-0.5">Document SYSCOHADA — Burkina Faso — généré automatiquement</p>
    </div>
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-600 font-medium">Exercice</label>
        <select [(ngModel)]="exercice"
                class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
          @for (a of annees; track a) { <option [value]="a">{{ a }}</option> }
        </select>
      </div>
      <button (click)="generer()" [disabled]="loading"
              class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2">
        @if (loading) {
          <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        }
        Générer les notes
      </button>
      @if (document) {
        <button (click)="imprimer()"
                class="border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-1">
          Imprimer
        </button>
      }
    </div>
  </div>

  <!-- Placeholder initial -->
  @if (!document && !loading) {
    <div class="bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center py-20 text-gray-400">
      <svg class="w-14 h-14 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <p class="text-sm font-medium">Sélectionnez un exercice et cliquez sur "Générer les notes"</p>
      <p class="text-xs mt-1">Les notes annexes seront construites à partir de vos données comptables enregistrées.</p>
    </div>
  }

  <!-- Document généré -->
  @if (document) {
    <div id="notes-annexes-print" class="space-y-1">

      <!-- Entête document -->
      <div class="bg-white rounded-2xl border border-gray-200 p-6 print:border-0 print:shadow-none">
        <div class="text-center space-y-1">
          <h2 class="text-xl font-bold text-gray-900 uppercase tracking-wide">{{ document.entrepriseNom }}</h2>
          <p class="text-sm text-gray-500">{{ document.pays }} — {{ document.referentiel }} — {{ document.devise }}</p>
          <p class="text-lg font-semibold text-blue-700">NOTES ANNEXES AUX ÉTATS FINANCIERS</p>
          <p class="text-sm text-gray-600">Exercice clos le 31 décembre {{ document.exercice }}</p>
          <p class="text-xs text-gray-400">Généré le {{ document.dateGeneration }}</p>
        </div>
      </div>

      <!-- Sections -->
      @for (section of document.sections; track section.numero) {
        <div class="bg-white rounded-xl border border-gray-200 p-6 print:border-b print:border-x-0 print:rounded-none">

          <!-- Titre section -->
          <div class="flex items-center gap-3 mb-4">
            <span class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
              {{ section.numero }}
            </span>
            <h3 class="text-base font-bold text-gray-900">{{ section.titre }}</h3>
          </div>

          <!-- Intro texte -->
          @if (section.texteIntro) {
            <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-4">{{ section.texteIntro }}</p>
          }

          <!-- Tableau -->
          @if (section.type === 'TABLEAU' && section.tableau.length > 0) {
            <div class="overflow-auto rounded-lg border border-gray-100">
              <table class="w-full text-sm text-left">
                <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    @for (col of section.colonnes; track col) {
                      <th class="px-3 py-2.5">{{ col }}</th>
                    }
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  @for (ligne of section.tableau; track ligne) {
                    <tr [class]="isTotal(ligne.cellules[0]) ? 'bg-gray-50 font-semibold' : 'hover:bg-gray-50'">
                      @for (cell of ligne.cellules; track cell) {
                        <td [class]="'px-3 py-2 ' + (isNumericCell(cell) ? 'text-right font-mono' : '')"
                            [class.text-gray-400]="cell === '—'">
                          {{ cell }}
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          <!-- Conclusif -->
          @if (section.texteConclusif) {
            <div class="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-800 border border-blue-100">
              {{ section.texteConclusif }}
            </div>
          }
        </div>
      }

      <!-- Pied de document -->
      <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
        <p class="text-xs text-gray-400">
          Document généré par e-Compta IA — {{ document.referentiel }} — {{ document.devise }} —
          Les chiffres sont exprimés en {{ document.devise }}.
        </p>
      </div>

    </div>
  }

</div>
`,
  styles: [`
    @media print {
      :host { display: block; background: white; }
      button, select, label { display: none !important; }
      .p-6 { padding: 0 !important; }
    }
  `]
})
export class NotesAnnexesFiscalesComponent implements OnInit {
  private svc = inject(NotesAnnexesFiscalesService);
  private cdr = inject(ChangeDetectorRef);

  exercice = new Date().getFullYear() - 1;
  annees = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 - i + 1);

  document: NotesAnnexesDocument | null = null;
  loading = false;

  ngOnInit() {}

  generer() {
    this.loading = true;
    this.document = null;
    this.svc.generer(this.exercice).subscribe({
      next: d => { this.document = d; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  imprimer() {
    window.print();
  }

  isTotal(cell: string) {
    return cell?.toUpperCase().startsWith('TOTAL');
  }

  isNumericCell(cell: string) {
    return /^[\d\s,.\-—]+$/.test(cell ?? '') && cell !== '—' && cell.length > 0;
  }
}
