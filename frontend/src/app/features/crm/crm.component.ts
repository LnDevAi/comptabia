import {
  Component, OnInit, ChangeDetectionStrategy, signal, computed, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../core/services/crm.service';
import {
  ContactRequest, ContactResponse,
  LeadRequest, LeadResponse,
  ActiviteRequest, ActiviteResponse,
  TemplateRequest, TemplateResponse,
  CampagneRequest, CampagneResponse,
  DestinataireResponse, DashboardCrm,
  CrmEtape, CrmTypeCampagne,
  ETAPES_PIPELINE, TYPES_ACTIVITE
} from '../../core/models/crm.model';

type Tab = 'dashboard' | 'contacts' | 'pipeline' | 'campagnes' | 'templates';

@Component({
  selector: 'app-crm',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="p-6 space-y-6">
  <!-- Header + tabs -->
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold text-gray-900">CRM & Campagnes</h1>
  </div>

  <div class="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
    @for (t of tabs; track t.id) {
      <button (click)="activeTab.set(t.id)"
        [class]="activeTab() === t.id
          ? 'px-4 py-2 bg-white rounded-md text-sm font-medium text-indigo-700 shadow-sm'
          : 'px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900'">
        {{ t.label }}
      </button>
    }
  </div>

  <!-- ═══ DASHBOARD ═══ -->
  @if (activeTab() === 'dashboard') {
    @if (dashboard()) {
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl p-4 border border-gray-200">
          <p class="text-sm text-gray-500">Contacts</p>
          <p class="text-3xl font-bold text-gray-900">{{ dashboard()!.nbContacts }}</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-200">
          <p class="text-sm text-gray-500">Leads actifs</p>
          <p class="text-3xl font-bold text-indigo-600">{{ dashboard()!.nbLeadsActifs }}</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-200">
          <p class="text-sm text-gray-500">Pipeline pondéré</p>
          <p class="text-3xl font-bold text-emerald-600">{{ dashboard()!.valeurPipelinePonderee | number:'1.0-0' }}</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-200">
          <p class="text-sm text-gray-500">Taux conversion</p>
          <p class="text-3xl font-bold text-amber-600">{{ dashboard()!.tauxConversion | number:'1.1-1' }}%</p>
        </div>
      </div>

      <!-- Pipeline stats -->
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <h2 class="text-base font-semibold text-gray-900 mb-4">Pipeline par étape</h2>
        <div class="space-y-2">
          @for (stat of dashboard()!.pipeline; track stat.etape) {
            <div class="flex items-center gap-3">
              <span [class]="etapeColor(stat.etape)" class="px-2 py-0.5 rounded text-xs font-medium w-28 text-center">
                {{ etapeLabel(stat.etape) }}
              </span>
              <span class="text-sm text-gray-600 w-16">{{ stat.nbLeads }} lead(s)</span>
              <span class="text-sm font-medium text-gray-900">{{ stat.valeurTotale | number:'1.0-0' }} FCFA</span>
            </div>
          }
        </div>
      </div>

      <!-- Dernières campagnes -->
      @if (dashboard()!.dernieresCampagnes?.length) {
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <h2 class="text-base font-semibold text-gray-900 mb-4">Dernières campagnes</h2>
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-gray-500 border-b border-gray-100">
                <th class="pb-2">Nom</th><th class="pb-2">Type</th>
                <th class="pb-2 text-right">Envoyés</th><th class="pb-2 text-right">Ouverts</th>
                <th class="pb-2 text-right">Cliqués</th>
              </tr>
            </thead>
            <tbody>
              @for (c of dashboard()!.dernieresCampagnes; track c.id) {
                <tr class="border-b border-gray-50">
                  <td class="py-2 font-medium">{{ c.nom }}</td>
                  <td class="py-2"><span class="px-2 py-0.5 rounded text-xs bg-indigo-100 text-indigo-700">{{ c.type }}</span></td>
                  <td class="py-2 text-right">{{ c.nbEnvoyes }}</td>
                  <td class="py-2 text-right">{{ c.nbOuverts }}</td>
                  <td class="py-2 text-right">{{ c.nbCliques }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    } @else {
      <div class="text-center py-16 text-gray-400">Chargement...</div>
    }
  }

  <!-- ═══ CONTACTS ═══ -->
  @if (activeTab() === 'contacts') {
    <div class="flex items-center gap-3">
      <input [(ngModel)]="searchQ" (ngModelChange)="onSearch()" placeholder="Rechercher..."
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
      <button (click)="ouvrirFormulaireContact(null)"
        class="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
        + Nouveau contact
      </button>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr class="text-left text-gray-600">
            <th class="px-4 py-3">Nom</th><th class="px-4 py-3">Email</th>
            <th class="px-4 py-3">Société</th><th class="px-4 py-3">Statut</th>
            <th class="px-4 py-3">Score</th><th class="px-4 py-3">Tags</th>
            <th class="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (c of contacts(); track c.id) {
            <tr class="border-b border-gray-100 hover:bg-gray-50">
              <td class="px-4 py-3 font-medium">{{ c.nom }}</td>
              <td class="px-4 py-3 text-gray-600">{{ c.email }}</td>
              <td class="px-4 py-3 text-gray-600">{{ c.societe }}</td>
              <td class="px-4 py-3">
                <span [class]="statutContactClass(c.statut)" class="px-2 py-0.5 rounded text-xs font-medium">
                  {{ c.statut }}
                </span>
              </td>
              <td class="px-4 py-3">{{ c.score }}</td>
              <td class="px-4 py-3 text-gray-500 text-xs">{{ c.tags }}</td>
              <td class="px-4 py-3 flex gap-2">
                <button (click)="ouvrirFormulaireContact(c)" class="text-indigo-600 hover:underline text-xs">Modifier</button>
                <button (click)="voirActivitesContact(c)" class="text-gray-500 hover:underline text-xs">Activités</button>
                <button (click)="confirmerSuppressionContact(c.id)" class="text-red-500 hover:underline text-xs">Suppr.</button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="7" class="px-4 py-8 text-center text-gray-400">Aucun contact</td></tr>
          }
        </tbody>
      </table>
    </div>

    <!-- Formulaire contact modal -->
    @if (showContactForm()) {
      <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" (click)="closeContactForm()">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 class="text-lg font-semibold">{{ editContact() ? 'Modifier' : 'Nouveau' }} contact</h2>
            <button (click)="closeContactForm()" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
                <input [(ngModel)]="contactForm.nom" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input [(ngModel)]="contactForm.email" type="email" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
                <input [(ngModel)]="contactForm.telephone" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Société</label>
                <input [(ngModel)]="contactForm.societe" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Poste</label>
                <input [(ngModel)]="contactForm.poste" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Source</label>
                <select [(ngModel)]="contactForm.source" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="MANUEL">Manuel</option>
                  <option value="IMPORT">Import</option>
                  <option value="FORMULAIRE">Formulaire</option>
                  <option value="LINKEDIN">LinkedIn</option>
                  <option value="REFERRAL">Référence</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Statut</label>
                <select [(ngModel)]="contactForm.statut" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="ACTIF">Actif</option>
                  <option value="INACTIF">Inactif</option>
                  <option value="DESABONNE">Désabonné</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Score (0-100)</label>
                <input [(ngModel)]="contactForm.score" type="number" min="0" max="100" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Tags (séparés par virgule)</label>
              <input [(ngModel)]="contactForm.tags" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea [(ngModel)]="contactForm.notes" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"></textarea>
            </div>
          </div>
          <div class="flex justify-end gap-3 p-6 border-t border-gray-100">
            <button (click)="closeContactForm()" class="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
            <button (click)="sauvegarderContact()" [disabled]="!contactForm.nom"
              class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Activités du contact -->
    @if (activitesContactVisible() && contactSelectionne()) {
      <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" (click)="activitesContactVisible.set(false)">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 class="text-lg font-semibold">Activités — {{ contactSelectionne()!.nom }}</h2>
            <button (click)="activitesContactVisible.set(false)" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
          <div class="overflow-y-auto flex-1 p-6 space-y-3">
            @for (a of activitesContact(); track a.id) {
              <div class="flex gap-3 items-start">
                <span class="text-xl">{{ typeActiviteIcon(a.type) }}</span>
                <div>
                  <p class="text-sm font-medium">{{ a.contenu }}</p>
                  <p class="text-xs text-gray-400">{{ a.auteurNom }} · {{ a.dateActivite | date:'dd/MM/yyyy HH:mm' }}</p>
                </div>
              </div>
            } @empty {
              <p class="text-center text-gray-400 py-4">Aucune activité</p>
            }
          </div>
          <div class="p-4 border-t border-gray-100 space-y-2">
            <div class="flex gap-2">
              <select [(ngModel)]="nouvelleActivite.type" class="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                @for (t of typesActivite; track t.value) {
                  <option [value]="t.value">{{ t.icon }} {{ t.label }}</option>
                }
              </select>
              <input [(ngModel)]="nouvelleActivite.contenu" placeholder="Contenu..." class="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              <button (click)="ajouterActiviteContact()" class="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">+</button>
            </div>
          </div>
        </div>
      </div>
    }
  }

  <!-- ═══ PIPELINE ═══ -->
  @if (activeTab() === 'pipeline') {
    <div class="flex items-center gap-3 mb-4">
      <button (click)="ouvrirFormulaireLead(null)"
        class="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
        + Nouveau lead
      </button>
    </div>

    <div class="flex gap-4 overflow-x-auto pb-4">
      @for (etape of etapesPipeline; track etape.value) {
        <div class="flex-none w-64">
          <div class="flex items-center gap-2 mb-3">
            <span [class]="etape.color" class="px-2 py-0.5 rounded text-xs font-medium">{{ etape.label }}</span>
            <span class="text-xs text-gray-400">({{ leadsParEtape(etape.value).length }})</span>
          </div>
          <div class="space-y-2">
            @for (lead of leadsParEtape(etape.value); track lead.id) {
              <div class="bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow">
                <p class="text-sm font-medium text-gray-900 truncate">{{ lead.titre }}</p>
                @if (lead.contact) {
                  <p class="text-xs text-gray-500 truncate">{{ lead.contact.nom }}</p>
                }
                <div class="flex items-center justify-between mt-2">
                  <span class="text-xs font-semibold text-emerald-600">{{ lead.valeur | number:'1.0-0' }}</span>
                  <span class="text-xs text-gray-400">{{ lead.probabilite }}%</span>
                </div>
                <div class="flex gap-1 mt-2 flex-wrap">
                  @for (e of etapesPipeline; track e.value) {
                    @if (e.value !== etape.value) {
                      <button (click)="changerEtapeLead(lead.id, e.value)"
                        [class]="e.color" class="text-xs px-1.5 py-0.5 rounded hover:opacity-80">
                        → {{ e.label }}
                      </button>
                    }
                  }
                </div>
                <div class="flex gap-2 mt-2">
                  <button (click)="ouvrirFormulaireLead(lead)" class="text-xs text-indigo-600 hover:underline">Modifier</button>
                  <button (click)="voirActivitesLead(lead)" class="text-xs text-gray-500 hover:underline">Activités</button>
                  <button (click)="confirmerSuppressionLead(lead.id)" class="text-xs text-red-500 hover:underline">Suppr.</button>
                </div>
              </div>
            } @empty {
              <div class="text-center py-4 text-gray-300 text-xs border-2 border-dashed border-gray-200 rounded-xl">Vide</div>
            }
          </div>
        </div>
      }
    </div>

    <!-- Formulaire lead modal -->
    @if (showLeadForm()) {
      <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" (click)="closeLeadForm()">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 class="text-lg font-semibold">{{ editLead() ? 'Modifier' : 'Nouveau' }} lead</h2>
            <button (click)="closeLeadForm()" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Titre *</label>
              <input [(ngModel)]="leadForm.titre" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Contact</label>
                <select [(ngModel)]="leadForm.contactId" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">— Aucun —</option>
                  @for (c of contacts(); track c.id) {
                    <option [value]="c.id">{{ c.nom }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Étape</label>
                <select [(ngModel)]="leadForm.etape" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  @for (e of etapesPipeline; track e.value) {
                    <option [value]="e.value">{{ e.label }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Valeur (FCFA)</label>
                <input [(ngModel)]="leadForm.valeur" type="number" min="0" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Probabilité (%)</label>
                <input [(ngModel)]="leadForm.probabilite" type="number" min="0" max="100" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Produit</label>
                <input [(ngModel)]="leadForm.produit" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Date clôture prévue</label>
                <input [(ngModel)]="leadForm.dateCloturePrevue" type="date" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea [(ngModel)]="leadForm.notes" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"></textarea>
            </div>
          </div>
          <div class="flex justify-end gap-3 p-6 border-t border-gray-100">
            <button (click)="closeLeadForm()" class="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
            <button (click)="sauvegarderLead()" [disabled]="!leadForm.titre"
              class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Activités du lead -->
    @if (activitesLeadVisible() && leadSelectionne()) {
      <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" (click)="activitesLeadVisible.set(false)">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 class="text-lg font-semibold">Activités — {{ leadSelectionne()!.titre }}</h2>
            <button (click)="activitesLeadVisible.set(false)" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
          <div class="overflow-y-auto flex-1 p-6 space-y-3">
            @for (a of activitesLead(); track a.id) {
              <div class="flex gap-3 items-start">
                <span class="text-xl">{{ typeActiviteIcon(a.type) }}</span>
                <div>
                  <p class="text-sm font-medium">{{ a.contenu }}</p>
                  <p class="text-xs text-gray-400">{{ a.auteurNom }} · {{ a.dateActivite | date:'dd/MM/yyyy HH:mm' }}</p>
                </div>
              </div>
            } @empty {
              <p class="text-center text-gray-400 py-4">Aucune activité</p>
            }
          </div>
          <div class="p-4 border-t border-gray-100">
            <div class="flex gap-2">
              <select [(ngModel)]="nouvelleActivite.type" class="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                @for (t of typesActivite; track t.value) {
                  <option [value]="t.value">{{ t.icon }} {{ t.label }}</option>
                }
              </select>
              <input [(ngModel)]="nouvelleActivite.contenu" placeholder="Contenu..." class="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              <button (click)="ajouterActiviteLead()" class="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">+</button>
            </div>
          </div>
        </div>
      </div>
    }
  }

  <!-- ═══ CAMPAGNES ═══ -->
  @if (activeTab() === 'campagnes') {
    <div class="flex items-center gap-3 mb-4">
      <button (click)="ouvrirFormulaireCampagne()"
        class="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
        + Nouvelle campagne
      </button>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr class="text-left text-gray-600">
            <th class="px-4 py-3">Nom</th><th class="px-4 py-3">Type</th>
            <th class="px-4 py-3">Statut</th><th class="px-4 py-3 text-right">Dest.</th>
            <th class="px-4 py-3 text-right">Envoyés</th><th class="px-4 py-3 text-right">Ouverts</th>
            <th class="px-4 py-3 text-right">Cliqués</th><th class="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (c of campagnes(); track c.id) {
            <tr class="border-b border-gray-100 hover:bg-gray-50">
              <td class="px-4 py-3 font-medium">{{ c.nom }}</td>
              <td class="px-4 py-3"><span class="px-2 py-0.5 rounded text-xs bg-indigo-100 text-indigo-700">{{ c.type }}</span></td>
              <td class="px-4 py-3"><span [class]="statutCampagneClass(c.statut)" class="px-2 py-0.5 rounded text-xs font-medium">{{ c.statut }}</span></td>
              <td class="px-4 py-3 text-right">{{ c.nbDestinataires }}</td>
              <td class="px-4 py-3 text-right">{{ c.nbEnvoyes }}</td>
              <td class="px-4 py-3 text-right">{{ c.nbOuverts }}</td>
              <td class="px-4 py-3 text-right">{{ c.nbCliques }}</td>
              <td class="px-4 py-3 flex gap-2">
                @if (c.statut === 'BROUILLON') {
                  <button (click)="lancerCampagne(c.id)" class="text-xs text-emerald-600 hover:underline font-medium">Envoyer</button>
                }
                <button (click)="voirDestinataires(c.id)" class="text-xs text-indigo-600 hover:underline">Dest.</button>
                @if (c.statut === 'BROUILLON') {
                  <button (click)="confirmerSuppressionCampagne(c.id)" class="text-xs text-red-500 hover:underline">Suppr.</button>
                }
              </td>
            </tr>
          } @empty {
            <tr><td colspan="8" class="px-4 py-8 text-center text-gray-400">Aucune campagne</td></tr>
          }
        </tbody>
      </table>
    </div>

    <!-- Formulaire campagne -->
    @if (showCampagneForm()) {
      <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" (click)="closeCampagneForm()">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 class="text-lg font-semibold">Nouvelle campagne</h2>
            <button (click)="closeCampagneForm()" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <label class="block text-xs font-medium text-gray-700 mb-1">Nom de la campagne *</label>
                <input [(ngModel)]="campagneForm.nom" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <select [(ngModel)]="campagneForm.type" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Template (optionnel)</label>
                <select [(ngModel)]="campagneForm.templateId" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">— Aucun —</option>
                  @for (t of templates(); track t.id) {
                    @if (t.type === campagneForm.type) {
                      <option [value]="t.id">{{ t.nom }}</option>
                    }
                  }
                </select>
              </div>
              @if (campagneForm.type === 'EMAIL') {
                <div class="col-span-2">
                  <label class="block text-xs font-medium text-gray-700 mb-1">Sujet de l'email *</label>
                  <input [(ngModel)]="campagneForm.sujet" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              }
              <div class="col-span-2">
                <label class="block text-xs font-medium text-gray-700 mb-1">Contenu *</label>
                <textarea [(ngModel)]="campagneForm.contenu" rows="5" placeholder="Variables: {nom}, {email}, {societe}"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-mono"></textarea>
              </div>
            </div>

            <!-- Destinataires -->
            <div class="border border-gray-200 rounded-xl p-4 space-y-3">
              <h3 class="text-sm font-semibold text-gray-700">Destinataires</h3>
              <div class="flex items-center gap-3">
                <input [(ngModel)]="campagneForm.tousContacts" type="checkbox" id="tousContacts" class="rounded" />
                <label for="tousContacts" class="text-sm text-gray-700">Tous les contacts actifs</label>
              </div>
              @if (!campagneForm.tousContacts) {
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Filtrer par tag</label>
                    <input [(ngModel)]="campagneForm.filtreTag" placeholder="ex: client, prospect" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Filtrer par statut</label>
                    <select [(ngModel)]="campagneForm.filtreStatut" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="">— Tous statuts —</option>
                      <option value="ACTIF">Actif</option>
                      <option value="INACTIF">Inactif</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Contacts spécifiques</label>
                  <div class="border border-gray-200 rounded-lg max-h-40 overflow-y-auto p-2 space-y-1">
                    @for (c of contacts(); track c.id) {
                      <label class="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                        <input type="checkbox" [checked]="isContactSelected(c.id)" (change)="toggleContactSelection(c.id)" class="rounded" />
                        {{ c.nom }} <span class="text-gray-400 text-xs">{{ c.email }}</span>
                      </label>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
          <div class="flex justify-end gap-3 p-6 border-t border-gray-100">
            <button (click)="closeCampagneForm()" class="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
            <button (click)="sauvegarderCampagne()" [disabled]="!campagneForm.nom || !campagneForm.contenu"
              class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              Créer (brouillon)
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Destinataires modal -->
    @if (showDestinataires()) {
      <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" (click)="showDestinataires.set(false)">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 class="text-lg font-semibold">Destinataires</h2>
            <button (click)="showDestinataires.set(false)" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
          <div class="overflow-y-auto flex-1">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr class="text-left text-gray-600">
                  <th class="px-4 py-3">Nom</th><th class="px-4 py-3">Email / Tél.</th>
                  <th class="px-4 py-3">Statut</th><th class="px-4 py-3">Envoyé le</th>
                </tr>
              </thead>
              <tbody>
                @for (d of destinataires(); track d.id) {
                  <tr class="border-b border-gray-100">
                    <td class="px-4 py-3">{{ d.nom }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ d.email || d.telephone }}</td>
                    <td class="px-4 py-3">
                      <span [class]="statutDestinataireClass(d.statut)" class="px-2 py-0.5 rounded text-xs font-medium">{{ d.statut }}</span>
                    </td>
                    <td class="px-4 py-3 text-gray-400 text-xs">{{ d.sentAt ? (d.sentAt | date:'dd/MM HH:mm') : '—' }}</td>
                  </tr>
                } @empty {
                  <tr><td colspan="4" class="px-4 py-8 text-center text-gray-400">Aucun destinataire</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    }
  }

  <!-- ═══ TEMPLATES ═══ -->
  @if (activeTab() === 'templates') {
    <div class="flex items-center gap-3 mb-4">
      <button (click)="ouvrirFormulaireTemplate(null)"
        class="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
        + Nouveau template
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      @for (t of templates(); track t.id) {
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <div class="flex items-start justify-between mb-2">
            <div>
              <p class="font-medium text-gray-900">{{ t.nom }}</p>
              <span class="px-2 py-0.5 rounded text-xs bg-indigo-100 text-indigo-700">{{ t.type }}</span>
            </div>
            <div class="flex gap-2">
              <button (click)="ouvrirFormulaireTemplate(t)" class="text-xs text-indigo-600 hover:underline">Modifier</button>
              <button (click)="confirmerSuppressionTemplate(t.id)" class="text-xs text-red-500 hover:underline">Suppr.</button>
            </div>
          </div>
          @if (t.sujet) {
            <p class="text-xs text-gray-500 mb-1">Sujet: {{ t.sujet }}</p>
          }
          <p class="text-xs text-gray-400 line-clamp-3 font-mono">{{ t.contenu }}</p>
          @if (t.variables) {
            <p class="text-xs text-amber-600 mt-2">Variables: {{ t.variables }}</p>
          }
        </div>
      } @empty {
        <div class="col-span-3 text-center py-12 text-gray-400">Aucun template</div>
      }
    </div>

    <!-- Formulaire template modal -->
    @if (showTemplateForm()) {
      <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" (click)="closeTemplateForm()">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 class="text-lg font-semibold">{{ editTemplate() ? 'Modifier' : 'Nouveau' }} template</h2>
            <button (click)="closeTemplateForm()" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <label class="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
                <input [(ngModel)]="templateForm.nom" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <select [(ngModel)]="templateForm.type" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Variables (séparées par virgule)</label>
                <input [(ngModel)]="templateForm.variables" placeholder="nom, societe, email" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              @if (templateForm.type === 'EMAIL') {
                <div class="col-span-2">
                  <label class="block text-xs font-medium text-gray-700 mb-1">Sujet de l'email</label>
                  <input [(ngModel)]="templateForm.sujet" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              }
              <div class="col-span-2">
                <label class="block text-xs font-medium text-gray-700 mb-1">Contenu *</label>
                <textarea [(ngModel)]="templateForm.contenu" rows="8" placeholder="Utilisez {nom}, {email}, {societe}, {poste}, {telephone}"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-mono"></textarea>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-3 p-6 border-t border-gray-100">
            <button (click)="closeTemplateForm()" class="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
            <button (click)="sauvegarderTemplate()" [disabled]="!templateForm.nom || !templateForm.contenu"
              class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    }
  }
</div>
  `
})
export class CrmComponent implements OnInit {
  private crmSvc = inject(CrmService);

  readonly etapesPipeline = ETAPES_PIPELINE;
  readonly typesActivite = TYPES_ACTIVITE;

  tabs: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: 'Tableau de bord' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'campagnes', label: 'Campagnes' },
    { id: 'templates', label: 'Templates' },
  ];

  activeTab = signal<Tab>('dashboard');

  // Data signals
  dashboard = signal<DashboardCrm | null>(null);
  contacts = signal<ContactResponse[]>([]);
  leads = signal<LeadResponse[]>([]);
  campagnes = signal<CampagneResponse[]>([]);
  templates = signal<TemplateResponse[]>([]);
  activitesContact = signal<ActiviteResponse[]>([]);
  activitesLead = signal<ActiviteResponse[]>([]);
  destinataires = signal<DestinataireResponse[]>([]);

  // UI state
  searchQ = '';
  showContactForm = signal(false);
  showLeadForm = signal(false);
  showCampagneForm = signal(false);
  showTemplateForm = signal(false);
  showDestinataires = signal(false);
  activitesContactVisible = signal(false);
  activitesLeadVisible = signal(false);
  editContact = signal<ContactResponse | null>(null);
  editLead = signal<LeadResponse | null>(null);
  editTemplate = signal<TemplateResponse | null>(null);
  contactSelectionne = signal<ContactResponse | null>(null);
  leadSelectionne = signal<LeadResponse | null>(null);

  // Forms
  contactForm: ContactRequest = this.emptyContact();
  leadForm: LeadRequest = this.emptyLead();
  campagneForm: CampagneRequest = this.emptyCampagne();
  templateForm: TemplateRequest = this.emptyTemplate();
  nouvelleActivite: Partial<ActiviteRequest> = { type: 'NOTE', contenu: '' };
  selectedContactIds: Set<string> = new Set();

  ngOnInit() {
    this.chargerDashboard();
    this.chargerContacts();
    this.chargerLeads();
    this.chargerCampagnes();
    this.chargerTemplates();
  }

  // Computed
  leadsParEtape(etape: CrmEtape): LeadResponse[] {
    return this.leads().filter(l => l.etape === etape);
  }

  isContactSelected(id: string): boolean { return this.selectedContactIds.has(id); }

  toggleContactSelection(id: string) {
    if (this.selectedContactIds.has(id)) this.selectedContactIds.delete(id);
    else this.selectedContactIds.add(id);
  }

  // Load
  chargerDashboard() {
    this.crmSvc.getDashboard().subscribe(d => this.dashboard.set(d));
  }

  chargerContacts(q?: string) {
    this.crmSvc.listerContacts(q).subscribe(c => this.contacts.set(c));
  }

  chargerLeads() {
    this.crmSvc.listerLeads().subscribe(l => this.leads.set(l));
  }

  chargerCampagnes() {
    this.crmSvc.listerCampagnes().subscribe(c => this.campagnes.set(c));
  }

  chargerTemplates() {
    this.crmSvc.listerTemplates().subscribe(t => this.templates.set(t));
  }

  onSearch() { this.chargerContacts(this.searchQ || undefined); }

  // Contact actions
  ouvrirFormulaireContact(c: ContactResponse | null) {
    this.editContact.set(c);
    this.contactForm = c
      ? { nom: c.nom, email: c.email, telephone: c.telephone, societe: c.societe,
          poste: c.poste, source: c.source, tags: c.tags, statut: c.statut,
          score: c.score, notes: c.notes }
      : this.emptyContact();
    this.showContactForm.set(true);
  }

  closeContactForm() { this.showContactForm.set(false); this.editContact.set(null); }

  sauvegarderContact() {
    const ec = this.editContact();
    const obs = ec
      ? this.crmSvc.mettreAJourContact(ec.id, this.contactForm)
      : this.crmSvc.creerContact(this.contactForm);
    obs.subscribe(() => { this.closeContactForm(); this.chargerContacts(); this.chargerDashboard(); });
  }

  confirmerSuppressionContact(id: string) {
    if (confirm('Supprimer ce contact ?')) {
      this.crmSvc.supprimerContact(id).subscribe(() => { this.chargerContacts(); this.chargerDashboard(); });
    }
  }

  voirActivitesContact(c: ContactResponse) {
    this.contactSelectionne.set(c);
    this.crmSvc.activitesDuContact(c.id).subscribe(a => {
      this.activitesContact.set(a);
      this.activitesContactVisible.set(true);
    });
  }

  ajouterActiviteContact() {
    if (!this.nouvelleActivite.contenu?.trim() || !this.contactSelectionne()) return;
    const req: ActiviteRequest = {
      contactId: this.contactSelectionne()!.id,
      type: this.nouvelleActivite.type as any,
      contenu: this.nouvelleActivite.contenu!,
    };
    this.crmSvc.ajouterActivite(req).subscribe(() => {
      this.nouvelleActivite = { type: 'NOTE', contenu: '' };
      this.crmSvc.activitesDuContact(this.contactSelectionne()!.id).subscribe(a => this.activitesContact.set(a));
    });
  }

  // Lead actions
  ouvrirFormulaireLead(l: LeadResponse | null) {
    this.editLead.set(l);
    this.leadForm = l
      ? { contactId: l.contact?.id, titre: l.titre, valeur: l.valeur,
          probabilite: l.probabilite, etape: l.etape,
          dateCloturePrevue: l.dateCloturePrevue, produit: l.produit, notes: l.notes }
      : this.emptyLead();
    this.showLeadForm.set(true);
  }

  closeLeadForm() { this.showLeadForm.set(false); this.editLead.set(null); }

  sauvegarderLead() {
    const el = this.editLead();
    const obs = el
      ? this.crmSvc.mettreAJourLead(el.id, this.leadForm)
      : this.crmSvc.creerLead(this.leadForm);
    obs.subscribe(() => { this.closeLeadForm(); this.chargerLeads(); this.chargerDashboard(); });
  }

  changerEtapeLead(id: string, etape: CrmEtape) {
    this.crmSvc.changerEtape(id, etape).subscribe(() => { this.chargerLeads(); this.chargerDashboard(); });
  }

  confirmerSuppressionLead(id: string) {
    if (confirm('Supprimer ce lead ?')) {
      this.crmSvc.supprimerLead(id).subscribe(() => { this.chargerLeads(); this.chargerDashboard(); });
    }
  }

  voirActivitesLead(l: LeadResponse) {
    this.leadSelectionne.set(l);
    this.crmSvc.activitesDuLead(l.id).subscribe(a => {
      this.activitesLead.set(a);
      this.activitesLeadVisible.set(true);
    });
  }

  ajouterActiviteLead() {
    if (!this.nouvelleActivite.contenu?.trim() || !this.leadSelectionne()) return;
    const req: ActiviteRequest = {
      leadId: this.leadSelectionne()!.id,
      type: this.nouvelleActivite.type as any,
      contenu: this.nouvelleActivite.contenu!,
    };
    this.crmSvc.ajouterActivite(req).subscribe(() => {
      this.nouvelleActivite = { type: 'NOTE', contenu: '' };
      this.crmSvc.activitesDuLead(this.leadSelectionne()!.id).subscribe(a => this.activitesLead.set(a));
    });
  }

  // Campagne actions
  ouvrirFormulaireCampagne() {
    this.campagneForm = this.emptyCampagne();
    this.selectedContactIds.clear();
    this.showCampagneForm.set(true);
  }

  closeCampagneForm() { this.showCampagneForm.set(false); }

  sauvegarderCampagne() {
    if (this.selectedContactIds.size > 0) {
      this.campagneForm.contactIds = Array.from(this.selectedContactIds);
    }
    this.crmSvc.creerCampagne(this.campagneForm).subscribe(() => {
      this.closeCampagneForm();
      this.chargerCampagnes();
    });
  }

  lancerCampagne(id: string) {
    if (confirm('Lancer l\'envoi de cette campagne ?')) {
      this.crmSvc.lancerEnvoi(id).subscribe(() => this.chargerCampagnes());
    }
  }

  voirDestinataires(id: string) {
    this.crmSvc.listerDestinataires(id).subscribe(d => {
      this.destinataires.set(d);
      this.showDestinataires.set(true);
    });
  }

  confirmerSuppressionCampagne(id: string) {
    if (confirm('Supprimer cette campagne ?')) {
      this.crmSvc.supprimerCampagne(id).subscribe(() => this.chargerCampagnes());
    }
  }

  // Template actions
  ouvrirFormulaireTemplate(t: TemplateResponse | null) {
    this.editTemplate.set(t);
    this.templateForm = t
      ? { nom: t.nom, type: t.type, sujet: t.sujet, contenu: t.contenu, variables: t.variables }
      : this.emptyTemplate();
    this.showTemplateForm.set(true);
  }

  closeTemplateForm() { this.showTemplateForm.set(false); this.editTemplate.set(null); }

  sauvegarderTemplate() {
    const et = this.editTemplate();
    const obs = et
      ? this.crmSvc.mettreAJourTemplate(et.id, this.templateForm)
      : this.crmSvc.creerTemplate(this.templateForm);
    obs.subscribe(() => { this.closeTemplateForm(); this.chargerTemplates(); });
  }

  confirmerSuppressionTemplate(id: string) {
    if (confirm('Supprimer ce template ?')) {
      this.crmSvc.supprimerTemplate(id).subscribe(() => this.chargerTemplates());
    }
  }

  // Helpers
  etapeLabel(etape: CrmEtape): string {
    return ETAPES_PIPELINE.find(e => e.value === etape)?.label ?? etape;
  }

  etapeColor(etape: CrmEtape): string {
    return ETAPES_PIPELINE.find(e => e.value === etape)?.color ?? '';
  }

  typeActiviteIcon(type: string): string {
    return TYPES_ACTIVITE.find(t => t.value === type)?.icon ?? '•';
  }

  statutContactClass(statut: string): string {
    const map: Record<string, string> = {
      ACTIF: 'bg-emerald-100 text-emerald-700',
      INACTIF: 'bg-gray-100 text-gray-600',
      DESABONNE: 'bg-red-100 text-red-700',
    };
    return map[statut] ?? 'bg-gray-100 text-gray-600';
  }

  statutCampagneClass(statut: string): string {
    const map: Record<string, string> = {
      BROUILLON: 'bg-gray-100 text-gray-700',
      EN_COURS: 'bg-blue-100 text-blue-700',
      TERMINE: 'bg-emerald-100 text-emerald-700',
      ANNULE: 'bg-red-100 text-red-700',
    };
    return map[statut] ?? 'bg-gray-100 text-gray-600';
  }

  statutDestinataireClass(statut: string): string {
    const map: Record<string, string> = {
      EN_ATTENTE: 'bg-gray-100 text-gray-600',
      ENVOYE: 'bg-blue-100 text-blue-700',
      OUVERT: 'bg-amber-100 text-amber-700',
      CLIQUE: 'bg-emerald-100 text-emerald-700',
      ECHEC: 'bg-red-100 text-red-700',
    };
    return map[statut] ?? 'bg-gray-100 text-gray-600';
  }

  private emptyContact(): ContactRequest {
    return { nom: '', email: '', telephone: '', societe: '', poste: '',
             source: 'MANUEL', tags: '', statut: 'ACTIF', score: 0, notes: '' };
  }

  private emptyLead(): LeadRequest {
    return { titre: '', valeur: 0, probabilite: 50, etape: 'NOUVEAU',
             contactId: '', dateCloturePrevue: '', produit: '', notes: '' };
  }

  private emptyCampagne(): CampagneRequest {
    return { nom: '', type: 'EMAIL', sujet: '', contenu: '', templateId: '',
             tousContacts: true, filtreTag: '', filtreStatut: '', contactIds: [] };
  }

  private emptyTemplate(): TemplateRequest {
    return { nom: '', type: 'EMAIL', sujet: '', contenu: '', variables: '' };
  }
}
