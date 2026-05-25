import {
  ChangeDetectionStrategy, Component, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FecImportService } from '../../core/services/fec-import.service';
import { FecImportResult } from '../../core/models/fec-import.model';

@Component({
  selector: 'app-import-fec',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
<div class="p-6 max-w-3xl mx-auto space-y-6">

  <!-- Header -->
  <div>
    <h1 class="text-xl font-bold text-gray-800">Import FEC OHADA</html>
    <p class="text-sm text-gray-500 mt-0.5">
      Importez vos écritures depuis un fichier FEC (Format d'Échanges Comptable) — tab-séparé, dates yyyyMMdd
    </p>
  </div>

  <!-- Format reminder -->
  <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800 space-y-1">
    <p class="font-semibold text-blue-700">Format FEC attendu (colonnes séparées par tabulation) :</p>
    <p class="font-mono">JournalCode · JournalLib · EcritureNum · EcritureDate · CompteNum · CompteLib · CompAuxNum · CompAuxLib · PieceRef · PieceDate · EcritureLib · Debit · Credit · EcritureLet · …</p>
    <ul class="list-disc list-inside mt-2 space-y-0.5 text-blue-700">
      <li>Les comptes absents du plan sont créés automatiquement</li>
      <li>Les écritures déjà présentes (même numéro de pièce) sont ignorées</li>
      <li>Les écritures importées sont créées avec le statut <strong>VALIDÉE</strong></li>
      <li>Le lettrage (EcritureLet) est préservé si présent</li>
    </ul>
  </div>

  <!-- Drop zone -->
  <div class="bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors p-10 text-center cursor-pointer"
       (click)="fileInput.click()"
       (dragover)="$event.preventDefault()"
       (drop)="onDrop($event)">
    <input #fileInput type="file" accept=".txt,.csv,.fec" class="hidden"
           (change)="onFileChange($event)" />
    @if (!selectedFile()) {
      <div class="space-y-2">
        <p class="text-3xl text-gray-300">📂</p>
        <p class="text-sm font-medium text-gray-600">Cliquez ou déposez votre fichier FEC ici</p>
        <p class="text-xs text-gray-400">.txt, .csv ou .fec — UTF-8 (avec ou sans BOM)</p>
      </div>
    } @else {
      <div class="space-y-1">
        <p class="text-2xl text-blue-400">📄</p>
        <p class="text-sm font-medium text-gray-700">{{ selectedFile()!.name }}</p>
        <p class="text-xs text-gray-400">{{ (selectedFile()!.size / 1024).toFixed(1) }} Ko</p>
      </div>
    }
  </div>

  @if (selectedFile()) {
    <div class="flex gap-3">
      <button (click)="importer()" [disabled]="importing()"
              class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg">
        {{ importing() ? 'Importation en cours…' : 'Lancer l\'import' }}
      </button>
      <button (click)="reset()" [disabled]="importing()"
              class="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm rounded-lg">
        Changer de fichier
      </button>
    </div>
  }

  <!-- Error -->
  @if (error()) {
    <div class="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
      {{ error() }}
    </div>
  }

  <!-- Results -->
  @if (result()) {
    <div class="space-y-4">

      <!-- Summary -->
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p class="text-2xl font-bold text-green-700">{{ result()!.ecrituresCreees }}</p>
          <p class="text-xs text-green-600 mt-1">Écritures importées</p>
        </div>
        <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
          <p class="text-2xl font-bold text-gray-500">{{ result()!.ecrituresIgnorees }}</p>
          <p class="text-xs text-gray-400 mt-1">Ignorées (déjà présentes)</p>
        </div>
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p class="text-2xl font-bold text-blue-700">{{ result()!.comptesCrees }}</p>
          <p class="text-xs text-blue-600 mt-1">Comptes créés</p>
        </div>
      </div>

      <!-- Errors table -->
      @if (result()!.erreurs.length > 0) {
        <div class="bg-white rounded-xl border border-red-200 overflow-hidden">
          <div class="px-5 py-3 bg-red-50 border-b border-red-200">
            <p class="text-sm font-semibold text-red-700">
              {{ result()!.erreurs.length }} erreur(s) — ces écritures n'ont pas été importées
            </p>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th class="px-4 py-2 text-left w-20">Ligne</th>
                <th class="px-4 py-2 text-left w-36">N° écriture</th>
                <th class="px-4 py-2 text-left">Message</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @for (err of result()!.erreurs; track err.ligne) {
                <tr class="hover:bg-red-50">
                  <td class="px-4 py-2 text-gray-500">{{ err.ligne }}</td>
                  <td class="px-4 py-2 font-mono text-xs">{{ err.ecritureNum }}</td>
                  <td class="px-4 py-2 text-red-700">{{ err.message }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
          Import terminé sans erreur.
        </div>
      }

    </div>
  }

</div>
  `
})
export class ImportFecComponent {

  private svc = inject(FecImportService);

  selectedFile = signal<File | null>(null);
  importing    = signal(false);
  result       = signal<FecImportResult | null>(null);
  error        = signal<string | null>(null);

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.setFile(input.files[0]);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.setFile(file);
  }

  private setFile(file: File) {
    this.selectedFile.set(file);
    this.result.set(null);
    this.error.set(null);
  }

  importer() {
    const file = this.selectedFile();
    if (!file) return;
    this.importing.set(true);
    this.error.set(null);
    this.result.set(null);
    this.svc.importer(file).subscribe({
      next: r => { this.result.set(r); this.importing.set(false); },
      error: e => {
        this.error.set(e?.error?.message ?? 'Erreur lors de l\'import.');
        this.importing.set(false);
      }
    });
  }

  reset() {
    this.selectedFile.set(null);
    this.result.set(null);
    this.error.set(null);
  }
}
