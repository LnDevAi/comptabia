import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef,
  inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '../../core/services/document.service';
import { DocumentItem, EntiteType } from '../../core/models/document.model';

@Component({
  selector: 'app-documents',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 space-y-6">

  <!-- Header -->
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Gestion documentaire</h1>
    <p class="text-sm text-gray-500 mt-0.5">Pièces jointes liées aux écritures, factures et devis</p>
  </div>

  <!-- Recherche -->
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <h2 class="text-sm font-semibold text-gray-700 mb-3">Rechercher des documents</h2>
    <div class="flex items-end gap-3 flex-wrap">
      <div>
        <label class="text-xs text-gray-500">Type d'entité</label>
        <select [(ngModel)]="searchType"
                class="mt-1 block border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="ECRITURE">Écriture comptable</option>
          <option value="FACTURE">Facture</option>
          <option value="DEVIS">Devis</option>
        </select>
      </div>
      <div class="flex-1 min-w-[280px]">
        <label class="text-xs text-gray-500">ID de l'entité (UUID)</label>
        <input type="text" [(ngModel)]="searchId" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
               class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono">
      </div>
      <button (click)="charger()"
              [disabled]="!searchId.trim()"
              class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
        Charger
      </button>
    </div>
  </div>

  <!-- Zone documents -->
  @if (loaded) {
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">

      <!-- Toolbar -->
      <div class="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
        <div class="text-sm text-gray-600">
          <span class="font-medium">{{ searchType }}</span>
          <span class="mx-2 text-gray-400">/</span>
          <span class="font-mono text-xs text-gray-500">{{ searchId }}</span>
          <span class="ml-3 text-gray-400">({{ docs.length }} document(s))</span>
        </div>
        <label class="cursor-pointer px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">
          + Ajouter un fichier
          <input type="file" class="hidden"
                 accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.xlsx,.csv,.txt,.docx"
                 (change)="onFileSelected($event)">
        </label>
      </div>

      <!-- Upload progress -->
      @if (uploading) {
        <div class="px-5 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-700 flex items-center gap-2">
          <span class="animate-spin">⟳</span> Envoi en cours…
        </div>
      }

      <!-- File list -->
      @if (docs.length === 0) {
        <div class="text-center py-12 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 mx-auto mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p class="text-sm">Aucun document attaché</p>
          <p class="text-xs mt-1">Cliquez sur « Ajouter un fichier » pour joindre une pièce</p>
        </div>
      } @else {
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th class="px-5 py-2 text-left">Fichier</th>
              <th class="px-3 py-2 text-left">Type</th>
              <th class="px-3 py-2 text-right">Taille</th>
              <th class="px-3 py-2 text-left">Ajouté par</th>
              <th class="px-3 py-2 text-left">Date</th>
              <th class="px-3 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (d of docs; track d.id) {
              <tr class="border-t border-gray-100 hover:bg-gray-50">
                <td class="px-5 py-2.5">
                  <div class="flex items-center gap-2">
                    <span class="text-lg">{{ fileIcon(d.contentType) }}</span>
                    <span class="font-medium text-gray-800 truncate max-w-[200px]">{{ d.nomFichier }}</span>
                  </div>
                </td>
                <td class="px-3 py-2.5">
                  <span class="text-xs text-gray-500 font-mono">{{ d.contentType }}</span>
                </td>
                <td class="px-3 py-2.5 text-right text-gray-600">{{ fmtSize(d.taille) }}</td>
                <td class="px-3 py-2.5 text-gray-500">{{ d.uploadedBy || '—' }}</td>
                <td class="px-3 py-2.5 text-gray-500 text-xs">
                  {{ d.createdAt | date:'dd/MM/yyyy HH:mm' }}
                </td>
                <td class="px-3 py-2.5 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <a [href]="svc.downloadUrl(d.id)" target="_blank"
                       class="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-50">
                      ↓ Télécharger
                    </a>
                    @if (isPreviewable(d.contentType)) {
                      <a [href]="svc.downloadUrl(d.id)" target="_blank"
                         class="text-gray-500 hover:text-gray-700 text-xs px-2 py-1 rounded hover:bg-gray-100">
                        Aperçu
                      </a>
                    }
                    <button (click)="supprimer(d.id)"
                            class="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50">
                      Suppr.
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>

    <!-- Formats acceptés -->
    <p class="text-xs text-gray-400 text-center">
      Formats acceptés : PDF, PNG, JPG, GIF, WEBP, XLSX, CSV, TXT, DOCX · Taille max : 10 Mo
    </p>
  }

</div>
  `
})
export class DocumentsComponent {

  readonly svc = inject(DocumentService);
  private cdr = inject(ChangeDetectorRef);

  searchType: EntiteType = 'ECRITURE';
  searchId   = '';
  loaded     = false;
  uploading  = false;
  docs: DocumentItem[] = [];

  charger() {
    if (!this.searchId.trim()) return;
    this.svc.list(this.searchType, this.searchId.trim()).subscribe(d => {
      this.docs   = d;
      this.loaded = true;
      this.cdr.markForCheck();
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;
    input.value = '';

    this.uploading = true;
    this.cdr.markForCheck();

    this.svc.upload(this.searchType, this.searchId.trim(), file).subscribe({
      next: (doc) => {
        this.docs = [...this.docs, doc];
        this.uploading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.uploading = false;
        this.cdr.markForCheck();
      }
    });
  }

  supprimer(id: string) {
    if (!confirm('Supprimer ce document ?')) return;
    this.svc.delete(id).subscribe(() => {
      this.docs = this.docs.filter(d => d.id !== id);
      this.cdr.markForCheck();
    });
  }

  fileIcon(ct: string): string {
    if (ct.includes('pdf'))   return '📄';
    if (ct.includes('image')) return '🖼️';
    if (ct.includes('sheet') || ct.includes('excel') || ct.includes('csv')) return '📊';
    if (ct.includes('word') || ct.includes('document')) return '📝';
    return '📎';
  }

  isPreviewable(ct: string): boolean {
    return ct.includes('pdf') || ct.includes('image');
  }

  fmtSize(bytes: number): string {
    if (bytes < 1024)       return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  }
}
