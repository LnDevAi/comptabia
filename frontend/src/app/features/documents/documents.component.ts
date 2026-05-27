import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef,
  OnDestroy, ViewChild, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { GedService } from '../../core/services/ged.service';
import {
  GedDocumentSummary, GedDocumentDetail, GedTypeDocument,
  GedTag, GedStats, GedStatsMensuel, GedAuditEntry, PageResponse
} from '../../core/models/ged.model';

Chart.register(...registerables);

type Tab = 'dashboard' | 'documents' | 'upload' | 'config' | 'audit';

@Component({
  selector: 'app-documents',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 space-y-5">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">GED — Gestion Électronique Documentaire</h1>
      <p class="text-sm text-gray-500 mt-0.5">Documents, versions, workflow d'approbation et audit</p>
    </div>
  </div>

  <!-- Tabs -->
  <div class="border-b border-gray-200">
    <nav class="flex gap-1 -mb-px">
      @for (t of tabs; track t.id) {
        <button (click)="activeTab.set(t.id)"
                [class]="activeTab() === t.id
                  ? 'border-b-2 border-blue-600 text-blue-700 px-4 py-2.5 text-sm font-medium'
                  : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 px-4 py-2.5 text-sm font-medium'">
          {{ t.label }}
        </button>
      }
    </nav>
  </div>

  <!-- ═══ TAB DASHBOARD ═══ -->
  @if (activeTab() === 'dashboard') {
    <div class="space-y-5">
      @if (stats()) {
        <!-- Stat cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <p class="text-xs text-gray-500">Total documents</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats()!.totalDocuments }}</p>
          </div>
          <div class="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
            <p class="text-xs text-yellow-700">Brouillons</p>
            <p class="text-2xl font-bold text-yellow-800 mt-1">{{ stats()!.brouillons }}</p>
          </div>
          <div class="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <p class="text-xs text-blue-700">En attente</p>
            <p class="text-2xl font-bold text-blue-800 mt-1">{{ stats()!.enAttente }}</p>
          </div>
          <div class="bg-green-50 rounded-xl border border-green-200 p-4">
            <p class="text-xs text-green-700">Approuvés</p>
            <p class="text-2xl font-bold text-green-800 mt-1">{{ stats()!.approuves }}</p>
          </div>
          <div class="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <p class="text-xs text-gray-500">Archivés</p>
            <p class="text-2xl font-bold text-gray-700 mt-1">{{ stats()!.archives }}</p>
          </div>
          <div class="bg-purple-50 rounded-xl border border-purple-200 p-4">
            <p class="text-xs text-purple-700">Versions totales</p>
            <p class="text-2xl font-bold text-purple-800 mt-1">{{ stats()!.totalVersions }}</p>
          </div>
          <div class="bg-indigo-50 rounded-xl border border-indigo-200 p-4">
            <p class="text-xs text-indigo-700">Stockage utilisé</p>
            <p class="text-2xl font-bold text-indigo-800 mt-1">{{ stats()!.tailleStockageMo }} Mo</p>
          </div>
        </div>
      } @else {
        <div class="text-center py-8 text-gray-400 text-sm">Chargement des statistiques…</div>
      }

      <!-- Charts + exercice selector -->
      @if (stats()) {
        <div class="flex items-center gap-2 justify-end">
          <label class="text-xs text-gray-500">Exercice :</label>
          <select [(ngModel)]="selectedExercice" (change)="onExerciceChange()"
                  class="border border-gray-200 rounded-lg px-2 py-1 text-sm">
            @for (y of exercices; track y) {
              <option [value]="y">{{ y }}</option>
            }
          </select>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <!-- Doughnut : répartition par statut -->
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">Répartition par statut</h3>
            <canvas #statutCanvas height="160"></canvas>
          </div>
          <!-- Bar : créations mensuelles -->
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">
              Créations mensuelles — {{ selectedExercice }}
            </h3>
            <canvas #mensuelCanvas height="160"></canvas>
          </div>
        </div>
      }

      <!-- Recent docs -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-5 py-3 border-b border-gray-100 bg-gray-50 text-sm font-semibold text-gray-700">
          Documents récents
        </div>
        @if (recentDocs().length === 0) {
          <p class="text-center py-8 text-gray-400 text-sm">Aucun document</p>
        } @else {
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th class="px-5 py-2 text-left">Titre</th>
                <th class="px-3 py-2 text-left">Type</th>
                <th class="px-3 py-2 text-left">Statut</th>
                <th class="px-3 py-2 text-left">Créé le</th>
                <th class="px-3 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (d of recentDocs(); track d.id) {
                <tr class="border-t border-gray-100 hover:bg-gray-50">
                  <td class="px-5 py-2.5 font-medium text-gray-800">{{ d.titre }}</td>
                  <td class="px-3 py-2.5 text-gray-500 text-xs">{{ d.typeDocumentLibelle || '—' }}</td>
                  <td class="px-3 py-2.5">
                    <span [class]="statutBadge(d.statut)">{{ statutLabel(d.statut) }}</span>
                  </td>
                  <td class="px-3 py-2.5 text-gray-400 text-xs">{{ d.createdAt | date:'dd/MM/yyyy' }}</td>
                  <td class="px-3 py-2.5 text-center">
                    <button (click)="openDetail(d)" class="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-50">Détail</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  }

  <!-- ═══ TAB DOCUMENTS ═══ -->
  @if (activeTab() === 'documents') {
    <div class="space-y-4">
      <!-- Filters -->
      <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label class="text-xs text-gray-500 block mb-1">Recherche</label>
          <input type="text" [(ngModel)]="searchQ" placeholder="Titre, référence…"
                 class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-56">
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">Statut</label>
          <select [(ngModel)]="filterStatut"
                  class="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Tous</option>
            <option value="BROUILLON">Brouillon</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="APPROUVE">Approuvé</option>
            <option value="ARCHIVE">Archivé</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">Type</label>
          <select [(ngModel)]="filterType"
                  class="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Tous</option>
            @for (t of types(); track t.id) {
              <option [value]="t.id">{{ t.libelle }}</option>
            }
          </select>
        </div>
        <button (click)="loadDocs()" class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          Filtrer
        </button>
        <button (click)="resetFilters()" class="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">
          Réinitialiser
        </button>
        <button (click)="goTo('upload')" class="ml-auto px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
          + Nouveau document
        </button>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        @if (docsLoading()) {
          <div class="text-center py-8 text-gray-400 text-sm">Chargement…</div>
        } @else if (docs().length === 0) {
          <div class="text-center py-12 text-gray-400">
            <p class="text-sm">Aucun document trouvé</p>
          </div>
        } @else {
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th class="px-5 py-2 text-left">Titre</th>
                <th class="px-3 py-2 text-left">Type</th>
                <th class="px-3 py-2 text-left">Statut</th>
                <th class="px-3 py-2 text-left">Tags</th>
                <th class="px-3 py-2 text-right">Taille</th>
                <th class="px-3 py-2 text-left">Créé</th>
                <th class="px-3 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (d of docs(); track d.id) {
                <tr class="border-t border-gray-100 hover:bg-gray-50">
                  <td class="px-5 py-2.5">
                    <div class="font-medium text-gray-800 truncate max-w-[220px]">{{ d.titre }}</div>
                    @if (d.referenceExterne) {
                      <div class="text-xs text-gray-400 font-mono">{{ d.referenceExterne }}</div>
                    }
                  </td>
                  <td class="px-3 py-2.5 text-gray-500 text-xs">{{ d.typeDocumentLibelle || '—' }}</td>
                  <td class="px-3 py-2.5">
                    <span [class]="statutBadge(d.statut)">{{ statutLabel(d.statut) }}</span>
                  </td>
                  <td class="px-3 py-2.5">
                    <div class="flex flex-wrap gap-1">
                      @for (tag of d.tags.slice(0, 2); track tag) {
                        <span class="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{{ tag }}</span>
                      }
                      @if (d.tags.length > 2) {
                        <span class="text-xs text-gray-400">+{{ d.tags.length - 2 }}</span>
                      }
                    </div>
                  </td>
                  <td class="px-3 py-2.5 text-right text-gray-500 text-xs">{{ fmtSize(d.tailleBytes) }}</td>
                  <td class="px-3 py-2.5 text-gray-400 text-xs">{{ d.createdAt | date:'dd/MM/yy' }}</td>
                  <td class="px-3 py-2.5">
                    <div class="flex items-center justify-center gap-1">
                      <button (click)="openDetail(d)" class="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-50">Détail</button>
                      @if (d.nombreVersions > 0) {
                        <a [href]="gedSvc.downloadUrl(d.id)" target="_blank"
                           class="text-gray-500 hover:text-gray-700 text-xs px-2 py-1 rounded hover:bg-gray-100">↓</a>
                      }
                      <button (click)="confirmDelete(d)" class="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50">✕</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <span class="text-xs text-gray-500">{{ totalElements() }} document(s)</span>
              <div class="flex gap-2">
                <button (click)="changePage(currentPage() - 1)" [disabled]="currentPage() === 0"
                        class="px-3 py-1 text-xs border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50">
                  ← Préc.
                </button>
                <span class="px-3 py-1 text-xs text-gray-600">{{ currentPage() + 1 }} / {{ totalPages() }}</span>
                <button (click)="changePage(currentPage() + 1)" [disabled]="currentPage() >= totalPages() - 1"
                        class="px-3 py-1 text-xs border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50">
                  Suiv. →
                </button>
              </div>
            </div>
          }
        }
      </div>
    </div>
  }

  <!-- ═══ TAB UPLOAD ═══ -->
  @if (activeTab() === 'upload') {
    <div class="max-w-2xl">
      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 class="text-base font-semibold text-gray-800">Nouveau document</h2>

        <!-- Drop zone -->
        <div class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
             (dragover)="$event.preventDefault()"
             (drop)="onDrop($event)"
             (click)="fileInput.click()">
          <input #fileInput type="file" class="hidden"
                 accept=".pdf,.png,.jpg,.jpeg,.xlsx,.csv,.txt,.docx,.zip"
                 (change)="onFileChange($event)">
          @if (uploadFile()) {
            <div class="flex items-center justify-center gap-2">
              <span class="text-2xl">{{ fileIcon(uploadFile()!.type) }}</span>
              <div class="text-left">
                <p class="text-sm font-medium text-gray-800">{{ uploadFile()!.name }}</p>
                <p class="text-xs text-gray-500">{{ fmtSize(uploadFile()!.size) }}</p>
              </div>
              <button (click)="$event.stopPropagation(); uploadFile.set(null)"
                      class="ml-4 text-red-400 hover:text-red-600 text-xs">✕ Retirer</button>
            </div>
          } @else {
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
              <p class="text-sm text-gray-500">Glisser-déposer ou <span class="text-blue-600">parcourir</span></p>
              <p class="text-xs text-gray-400 mt-1">PDF, DOCX, XLSX, PNG, ZIP… max 20 Mo</p>
            </div>
          }
        </div>

        <!-- Metadata form -->
        <div class="space-y-4">
          <div>
            <label class="text-xs font-medium text-gray-700 block mb-1">Titre <span class="text-red-500">*</span></label>
            <input type="text" [(ngModel)]="form.titre" placeholder="Intitulé du document"
                   class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-medium text-gray-700 block mb-1">Type</label>
              <select [(ngModel)]="form.typeDocumentId"
                      class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option [ngValue]="null">— Sans type —</option>
                @for (t of types(); track t.id) {
                  @if (t.actif) {
                    <option [value]="t.id">{{ t.libelle }}</option>
                  }
                }
              </select>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-700 block mb-1">Référence externe</label>
              <input type="text" [(ngModel)]="form.referenceExterne" placeholder="N° facture, contrat…"
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-medium text-gray-700 block mb-1">Date du document</label>
              <input type="date" [(ngModel)]="form.dateDocument"
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            </div>
            <div>
              <label class="text-xs font-medium text-gray-700 block mb-1">Entité liée</label>
              <select [(ngModel)]="form.typeEntite"
                      class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">— Aucune —</option>
                <option value="ECRITURE">Écriture</option>
                <option value="FACTURE">Facture</option>
                <option value="TIERS">Tiers</option>
                <option value="EXERCICE">Exercice</option>
              </select>
            </div>
          </div>

          <div>
            <label class="text-xs font-medium text-gray-700 block mb-1">Description</label>
            <textarea [(ngModel)]="form.description" rows="2" placeholder="Contexte, notes…"
                      class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"></textarea>
          </div>

          <!-- Tags -->
          <div>
            <label class="text-xs font-medium text-gray-700 block mb-1">Tags</label>
            <div class="flex flex-wrap gap-2">
              @for (t of tags(); track t.id) {
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" [value]="t.id"
                         [checked]="form.tagIds?.includes(t.id)"
                         (change)="toggleTag(t.id, $event)"
                         class="rounded">
                  <span class="text-xs px-2 py-0.5 rounded-full text-white"
                        [style.background-color]="t.couleur">{{ t.libelle }}</span>
                </label>
              }
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-3">
          <button (click)="submitCreate()" [disabled]="!form.titre?.trim() || creating()"
                  class="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {{ creating() ? 'Création…' : 'Créer le document' }}
          </button>
          <button (click)="resetForm()" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
            Réinitialiser
          </button>
        </div>
        @if (createError()) {
          <p class="text-xs text-red-600">{{ createError() }}</p>
        }
      </div>
    </div>
  }

  <!-- ═══ TAB CONFIG ═══ -->
  @if (activeTab() === 'config') {
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">

      <!-- Types -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <span class="text-sm font-semibold text-gray-700">Types de documents</span>
        </div>
        <!-- Form ajout -->
        <div class="p-4 border-b border-gray-100 space-y-2">
          <input type="text" [(ngModel)]="newTypeCode" placeholder="Code (ex: CONTRAT)"
                 class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm uppercase">
          <input type="text" [(ngModel)]="newTypeLibelle" placeholder="Libellé"
                 class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
          <button (click)="submitCreateType()" [disabled]="!newTypeCode.trim() || !newTypeLibelle.trim()"
                  class="w-full py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50">
            + Ajouter
          </button>
        </div>
        <div class="divide-y divide-gray-100 max-h-64 overflow-y-auto">
          @for (t of types(); track t.id) {
            <div class="px-4 py-2.5 flex items-center justify-between">
              <div>
                <span class="text-xs font-mono text-gray-500 mr-2">{{ t.code }}</span>
                <span class="text-sm text-gray-800">{{ t.libelle }}</span>
              </div>
              <button (click)="toggleTypeActif(t)"
                      [class]="t.actif ? 'text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full' : 'text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full'">
                {{ t.actif ? 'Actif' : 'Inactif' }}
              </button>
            </div>
          }
          @if (types().length === 0) {
            <p class="px-4 py-4 text-xs text-gray-400 text-center">Aucun type défini</p>
          }
        </div>
      </div>

      <!-- Tags -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <span class="text-sm font-semibold text-gray-700">Tags</span>
        </div>
        <!-- Form ajout -->
        <div class="p-4 border-b border-gray-100 space-y-2">
          <input type="text" [(ngModel)]="newTagLibelle" placeholder="Nom du tag"
                 class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
          <div class="flex items-center gap-2">
            <label class="text-xs text-gray-500">Couleur :</label>
            <input type="color" [(ngModel)]="newTagCouleur" class="w-8 h-8 rounded cursor-pointer border-0">
            <span class="text-xs text-gray-400">{{ newTagCouleur }}</span>
          </div>
          <button (click)="submitCreateTag()" [disabled]="!newTagLibelle.trim()"
                  class="w-full py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50">
            + Ajouter
          </button>
        </div>
        <div class="flex flex-wrap gap-2 p-4 max-h-64 overflow-y-auto">
          @for (t of tags(); track t.id) {
            <div class="flex items-center gap-1">
              <span class="px-2.5 py-1 rounded-full text-white text-xs font-medium"
                    [style.background-color]="t.couleur">{{ t.libelle }}</span>
              <button (click)="deleteTag(t)" class="text-gray-300 hover:text-red-500 text-xs">✕</button>
            </div>
          }
          @if (tags().length === 0) {
            <p class="text-xs text-gray-400">Aucun tag défini</p>
          }
        </div>
      </div>
    </div>
  }

  <!-- ═══ TAB AUDIT ═══ -->
  @if (activeTab() === 'audit') {
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <span class="text-sm font-semibold text-gray-700">Journal d'audit</span>
        <button (click)="loadAudit()" class="text-xs text-blue-600 hover:text-blue-800">Actualiser</button>
      </div>
      @if (auditLoading()) {
        <div class="text-center py-6 text-gray-400 text-sm">Chargement…</div>
      } @else {
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th class="px-5 py-2 text-left">Date</th>
              <th class="px-3 py-2 text-left">Action</th>
              <th class="px-3 py-2 text-left">Document ID</th>
              <th class="px-3 py-2 text-left">Détails</th>
              <th class="px-3 py-2 text-left">Utilisateur</th>
            </tr>
          </thead>
          <tbody>
            @for (a of auditLogs(); track a.id) {
              <tr class="border-t border-gray-100 hover:bg-gray-50">
                <td class="px-5 py-2 text-gray-500 text-xs whitespace-nowrap">
                  {{ a.createdAt | date:'dd/MM/yyyy HH:mm' }}
                </td>
                <td class="px-3 py-2">
                  <span [class]="auditBadge(a.action)">{{ a.action }}</span>
                </td>
                <td class="px-3 py-2 font-mono text-xs text-gray-400 truncate max-w-[120px]">
                  {{ a.documentId }}
                </td>
                <td class="px-3 py-2 text-gray-600 text-xs truncate max-w-[200px]">{{ a.details || '—' }}</td>
                <td class="px-3 py-2 text-gray-500 text-xs">{{ a.faitParEmail || '—' }}</td>
              </tr>
            }
            @if (auditLogs().length === 0) {
              <tr><td colspan="5" class="text-center py-8 text-gray-400 text-sm">Aucune entrée</td></tr>
            }
          </tbody>
        </table>
      }
    </div>
  }

</div>

<!-- ═══ DETAIL MODAL ═══ -->
@if (detailDoc()) {
  <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
       (click)="$event.target === $event.currentTarget && closeDetail()">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 class="text-base font-semibold text-gray-900 truncate pr-4">{{ detailDoc()!.titre }}</h2>
        <button (click)="closeDetail()" class="text-gray-400 hover:text-gray-600">✕</button>
      </div>
      <div class="p-6 space-y-5">

        <!-- Statut + actions workflow -->
        <div class="flex items-center gap-3 flex-wrap">
          <span [class]="statutBadge(detailDoc()!.statut) + ' text-sm px-3 py-1'">
            {{ statutLabel(detailDoc()!.statut) }}
          </span>
          @if (detailDoc()!.statut === 'BROUILLON') {
            <button (click)="changeStatut('EN_ATTENTE', '')" class="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200">
              → Soumettre pour approbation
            </button>
          }
          @if (detailDoc()!.statut === 'EN_ATTENTE') {
            <button (click)="changeStatut('APPROUVE', '')" class="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200">
              ✓ Approuver
            </button>
            <button (click)="changeStatut('BROUILLON', 'Refus d\'approbation')" class="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200">
              ← Rejeter
            </button>
          }
          @if (detailDoc()!.statut === 'APPROUVE') {
            <button (click)="changeStatut('ARCHIVE', '')" class="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200">
              ↓ Archiver
            </button>
          }
        </div>

        <!-- Meta -->
        <div class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div><span class="text-gray-400 text-xs">Type :</span> {{ detailDoc()!.typeDocumentLibelle || '—' }}</div>
          <div><span class="text-gray-400 text-xs">Référence :</span> {{ detailDoc()!.referenceExterne || '—' }}</div>
          <div><span class="text-gray-400 text-xs">Entité liée :</span> {{ detailDoc()!.typeEntite || '—' }}</div>
          <div><span class="text-gray-400 text-xs">Date doc :</span> {{ detailDoc()!.dateDocument || '—' }}</div>
          <div><span class="text-gray-400 text-xs">Créé par :</span> {{ detailDoc()!.createdByNom || '—' }}</div>
          <div><span class="text-gray-400 text-xs">Créé le :</span> {{ detailDoc()!.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
        </div>
        @if (detailDoc()!.description) {
          <p class="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{{ detailDoc()!.description }}</p>
        }
        @if (detailDoc()!.tags.length > 0) {
          <div class="flex flex-wrap gap-1">
            @for (t of detailDoc()!.tags; track t) {
              <span class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{{ t }}</span>
            }
          </div>
        }

        <!-- Versions -->
        <div>
          <h3 class="text-sm font-semibold text-gray-700 mb-2">Versions ({{ detailDoc()!.versions.length }})</h3>
          @if (detailDoc()!.versions.length === 0) {
            <p class="text-xs text-gray-400">Aucun fichier attaché</p>
          } @else {
            <div class="space-y-1.5">
              @for (v of detailDoc()!.versions; track v.id) {
                <div class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div class="flex items-center gap-2">
                    <span>{{ fileIcon(v.contentType) }}</span>
                    <div>
                      <p class="text-xs font-medium text-gray-800">v{{ v.numero }} — {{ v.nomFichier }}</p>
                      <p class="text-xs text-gray-400">{{ fmtSize(v.taille) }} · {{ v.createdAt | date:'dd/MM/yy HH:mm' }}</p>
                    </div>
                  </div>
                  <a [href]="gedSvc.downloadUrl(detailDoc()!.id, v.id)" target="_blank"
                     class="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-50">↓ Télécharger</a>
                </div>
              }
            </div>
          }
          <!-- Ajouter une version -->
          <label class="mt-2 cursor-pointer inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800">
            <input type="file" class="hidden"
                   accept=".pdf,.png,.jpg,.jpeg,.xlsx,.csv,.txt,.docx,.zip"
                   (change)="onAddVersion($event)">
            + Ajouter une version
          </label>
        </div>

        <!-- Workflow history -->
        @if (detailDoc()!.workflow.length > 0) {
          <div>
            <h3 class="text-sm font-semibold text-gray-700 mb-2">Historique workflow</h3>
            <div class="space-y-1.5">
              @for (w of detailDoc()!.workflow; track w.faitLe) {
                <div class="flex items-start gap-2 text-xs text-gray-600">
                  <span class="text-gray-300">●</span>
                  <div>
                    <span class="font-medium">{{ w.statutAvant || '—' }} → {{ w.statutApres }}</span>
                    @if (w.commentaire) { <span class="text-gray-400 ml-1">({{ w.commentaire }})</span> }
                    <span class="ml-2 text-gray-400">{{ w.faitLe | date:'dd/MM/yy HH:mm' }}</span>
                    @if (w.faitParNom) { <span class="ml-1 text-gray-400">par {{ w.faitParNom }}</span> }
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  </div>
}
  `
})
export class DocumentsComponent implements OnDestroy {

  @ViewChild('statutCanvas')  statutCanvasRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('mensuelCanvas') mensuelCanvasRef!: ElementRef<HTMLCanvasElement>;

  readonly gedSvc = inject(GedService);
  private cdr = inject(ChangeDetectorRef);

  activeTab = signal<Tab>('dashboard');
  tabs = [
    { id: 'dashboard' as Tab, label: 'Tableau de bord' },
    { id: 'documents' as Tab, label: 'Documents' },
    { id: 'upload' as Tab, label: '+ Nouveau' },
    { id: 'config' as Tab, label: 'Types & Tags' },
    { id: 'audit' as Tab, label: 'Audit' },
  ];

  // Chart state
  private statutChart?:  Chart;
  private mensuelChart?: Chart;
  statsMensuel    = signal<GedStatsMensuel | null>(null);
  selectedExercice = new Date().getFullYear();
  exercices = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // State
  stats          = signal<GedStats | null>(null);
  recentDocs     = signal<GedDocumentSummary[]>([]);
  docs           = signal<GedDocumentSummary[]>([]);
  docsLoading    = signal(false);
  totalElements  = signal(0);
  totalPages     = signal(0);
  currentPage    = signal(0);
  types          = signal<GedTypeDocument[]>([]);
  tags           = signal<GedTag[]>([]);
  auditLogs      = signal<GedAuditEntry[]>([]);
  auditLoading   = signal(false);
  detailDoc      = signal<GedDocumentDetail | null>(null);
  uploadFile     = signal<File | null>(null);
  creating       = signal(false);
  createError    = signal('');

  // Filters
  searchQ      = '';
  filterStatut = '';
  filterType   = '';

  // Forms
  form: { titre: string; description: string; typeDocumentId: string | null;
          referenceExterne: string; dateDocument: string; typeEntite: string;
          tagIds: string[]; } = this.emptyForm();

  newTypeCode    = '';
  newTypeLibelle = '';
  newTagLibelle  = '';
  newTagCouleur  = '#6B7280';

  constructor() {
    this.loadAll();
  }

  private loadAll() {
    this.loadStats();
    this.loadDocs();
    this.loadTypes();
    this.loadTags();
  }

  loadStats() {
    this.gedSvc.stats().subscribe(s => {
      this.stats.set(s);
      this.cdr.markForCheck();
      Promise.resolve().then(() => this.buildStatutChart());
    });
    this.loadStatsMensuel();
  }

  loadStatsMensuel() {
    this.gedSvc.getStatsMensuel(this.selectedExercice).subscribe(m => {
      this.statsMensuel.set(m);
      this.cdr.markForCheck();
      Promise.resolve().then(() => this.buildMensuelChart());
    });
  }

  loadDocs() {
    this.docsLoading.set(true);
    const statut = this.filterStatut || undefined;
    const typeId = this.filterType || undefined;
    const search = this.searchQ.trim() || undefined;
    this.gedSvc.list(statut, typeId, search, this.currentPage(), 20).subscribe({
      next: (page) => {
        this.docs.set(page.content);
        this.recentDocs.set(page.content.slice(0, 5));
        this.totalElements.set(page.totalElements);
        this.totalPages.set(page.totalPages);
        this.docsLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => { this.docsLoading.set(false); this.cdr.markForCheck(); }
    });
  }

  loadTypes() {
    this.gedSvc.listTypes().subscribe(t => { this.types.set(t); this.cdr.markForCheck(); });
  }

  loadTags() {
    this.gedSvc.listTags().subscribe(t => { this.tags.set(t); this.cdr.markForCheck(); });
  }

  loadAudit() {
    this.auditLoading.set(true);
    this.gedSvc.listAudit().subscribe({
      next: (p) => { this.auditLogs.set(p.content); this.auditLoading.set(false); this.cdr.markForCheck(); },
      error: () => { this.auditLoading.set(false); this.cdr.markForCheck(); }
    });
  }

  resetFilters() {
    this.searchQ = '';
    this.filterStatut = '';
    this.filterType = '';
    this.currentPage.set(0);
    this.loadDocs();
  }

  changePage(p: number) {
    this.currentPage.set(p);
    this.loadDocs();
  }

  goTo(tab: Tab) {
    this.activeTab.set(tab);
  }

  openDetail(d: GedDocumentSummary) {
    this.gedSvc.getById(d.id).subscribe(detail => {
      this.detailDoc.set(detail);
      this.cdr.markForCheck();
    });
  }

  closeDetail() {
    this.detailDoc.set(null);
    this.loadDocs();
    this.loadStats();
  }

  // Upload
  onFileChange(event: Event) {
    const f = (event.target as HTMLInputElement).files?.[0];
    if (f) this.uploadFile.set(f);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const f = event.dataTransfer?.files?.[0];
    if (f) this.uploadFile.set(f);
  }

  submitCreate() {
    if (!this.form.titre.trim()) return;
    this.creating.set(true);
    this.createError.set('');
    const dto = {
      titre: this.form.titre.trim(),
      description: this.form.description || undefined,
      typeDocumentId: this.form.typeDocumentId || undefined,
      typeEntite: this.form.typeEntite || undefined,
      referenceExterne: this.form.referenceExterne || undefined,
      dateDocument: this.form.dateDocument || undefined,
      tagIds: this.form.tagIds,
    };
    this.gedSvc.create(dto, this.uploadFile() || undefined).subscribe({
      next: () => {
        this.creating.set(false);
        this.resetForm();
        this.loadDocs();
        this.loadStats();
        this.activeTab.set('documents');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.creating.set(false);
        this.createError.set(err?.error?.message || 'Erreur lors de la création');
        this.cdr.markForCheck();
      }
    });
  }

  resetForm() {
    this.form = this.emptyForm();
    this.uploadFile.set(null);
    this.createError.set('');
  }

  toggleTag(id: string, evt: Event) {
    const checked = (evt.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.form.tagIds.includes(id)) this.form.tagIds = [...this.form.tagIds, id];
    } else {
      this.form.tagIds = this.form.tagIds.filter(t => t !== id);
    }
  }

  // Detail actions
  changeStatut(statut: string, commentaire: string) {
    if (!this.detailDoc()) return;
    this.gedSvc.changeStatut(this.detailDoc()!.id, statut, commentaire).subscribe(d => {
      this.detailDoc.set(d);
      this.cdr.markForCheck();
    });
  }

  onAddVersion(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.detailDoc()) return;
    this.gedSvc.addVersion(this.detailDoc()!.id, file).subscribe(d => {
      this.detailDoc.set(d);
      this.cdr.markForCheck();
    });
  }

  confirmDelete(d: GedDocumentSummary) {
    if (!confirm(`Supprimer « ${d.titre} » et toutes ses versions ?`)) return;
    this.gedSvc.delete(d.id).subscribe(() => {
      this.loadDocs();
      this.loadStats();
      this.cdr.markForCheck();
    });
  }

  // Config
  submitCreateType() {
    if (!this.newTypeCode.trim() || !this.newTypeLibelle.trim()) return;
    this.gedSvc.createType({ code: this.newTypeCode.toUpperCase(), libelle: this.newTypeLibelle }).subscribe({
      next: () => { this.newTypeCode = ''; this.newTypeLibelle = ''; this.loadTypes(); this.cdr.markForCheck(); },
      error: () => this.cdr.markForCheck()
    });
  }

  toggleTypeActif(t: GedTypeDocument) {
    this.gedSvc.toggleType(t.id).subscribe(() => { this.loadTypes(); this.cdr.markForCheck(); });
  }

  submitCreateTag() {
    if (!this.newTagLibelle.trim()) return;
    this.gedSvc.createTag({ libelle: this.newTagLibelle, couleur: this.newTagCouleur }).subscribe({
      next: () => { this.newTagLibelle = ''; this.loadTags(); this.cdr.markForCheck(); },
      error: () => this.cdr.markForCheck()
    });
  }

  deleteTag(t: GedTag) {
    if (!confirm(`Supprimer le tag « ${t.libelle} » ?`)) return;
    this.gedSvc.deleteTag(t.id).subscribe(() => { this.loadTags(); this.cdr.markForCheck(); });
  }

  // Helpers
  private emptyForm() {
    return { titre: '', description: '', typeDocumentId: null as string | null,
             referenceExterne: '', dateDocument: '', typeEntite: '', tagIds: [] as string[] };
  }

  statutLabel(s: string): string {
    return { BROUILLON: 'Brouillon', EN_ATTENTE: 'En attente', APPROUVE: 'Approuvé', ARCHIVE: 'Archivé' }[s] ?? s;
  }

  statutBadge(s: string): string {
    const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ';
    return base + ({
      BROUILLON: 'bg-yellow-100 text-yellow-800',
      EN_ATTENTE: 'bg-blue-100 text-blue-800',
      APPROUVE: 'bg-green-100 text-green-800',
      ARCHIVE: 'bg-gray-100 text-gray-600',
    }[s] ?? 'bg-gray-100 text-gray-600');
  }

  auditBadge(action: string): string {
    const base = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ';
    return base + ({
      CREATE: 'bg-green-100 text-green-700',
      DELETE: 'bg-red-100 text-red-700',
      WORKFLOW: 'bg-blue-100 text-blue-700',
      UPDATE: 'bg-yellow-100 text-yellow-700',
      NEW_VERSION: 'bg-purple-100 text-purple-700',
      VIEW: 'bg-gray-100 text-gray-600',
    }[action] ?? 'bg-gray-100 text-gray-600');
  }

  fileIcon(ct: string): string {
    if (ct?.includes('pdf')) return '📄';
    if (ct?.includes('image')) return '🖼️';
    if (ct?.includes('sheet') || ct?.includes('excel') || ct?.includes('csv')) return '📊';
    if (ct?.includes('word') || ct?.includes('document')) return '📝';
    if (ct?.includes('zip') || ct?.includes('archive')) return '🗜️';
    return '📎';
  }

  fmtSize(bytes: number): string {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  }

  onExerciceChange() {
    this.loadStatsMensuel();
  }

  ngOnDestroy(): void {
    this.statutChart?.destroy();
    this.mensuelChart?.destroy();
  }

  private buildStatutChart(): void {
    if (!this.statutCanvasRef || !this.stats()) return;
    this.statutChart?.destroy();
    const s = this.stats()!;
    const data   = [s.brouillons, s.enAttente, s.approuves, s.archives];
    const colors = ['#f59e0b', '#3b82f6', '#22c55e', '#6b7280'];
    const labels = ['Brouillons', 'En attente', 'Approuvés', 'Archivés'];
    this.statutChart = new Chart(this.statutCanvasRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } }
        },
        cutout: '62%'
      }
    });
  }

  private buildMensuelChart(): void {
    if (!this.mensuelCanvasRef || !this.statsMensuel()) return;
    this.mensuelChart?.destroy();
    const months = this.statsMensuel()!.mensuel;
    this.mensuelChart = new Chart(this.mensuelCanvasRef.nativeElement, {
      type: 'bar',
      data: {
        labels: months.map(m => m.label),
        datasets: [{
          label: 'Documents créés',
          data: months.map(m => m.nb),
          backgroundColor: 'rgba(59,130,246,0.7)',
          borderColor: '#3b82f6',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }
}
