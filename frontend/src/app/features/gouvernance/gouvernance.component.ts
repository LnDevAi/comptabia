import {
  ChangeDetectionStrategy, Component, OnInit, signal, computed
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { GouvernanceService } from '../../core/services/gouvernance.service';
import {
  AssocieResponse, AssembleeResponse, ResolutionRequest,
  TypeAssocie, TypeAssemblee, StatutAssemblee, TypeResolution, StatutResolution,
  TYPES_ASSOCIE, TYPES_ASSEMBLEE, TYPES_RESOLUTION
} from '../../core/models/gouvernance.model';

type Tab = 'associes' | 'assemblees';

@Component({
  selector: 'app-gouvernance',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, DecimalPipe],
  template: `
<div class="p-6 space-y-6">

  <!-- En-tête -->
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Gouvernance & Associés</h1>
    <p class="text-sm text-gray-500 mt-1">Registre des associés, Assemblées (AG/CA), Résolutions réglementaires</p>
  </div>

  <!-- Onglets -->
  <div class="flex gap-1 border-b border-gray-200">
    <button (click)="tab.set('associes')"
            class="px-4 py-2 text-sm font-medium border-b-2 transition"
            [class.border-blue-600]="tab() === 'associes'"
            [class.text-blue-700]="tab() === 'associes'"
            [class.border-transparent]="tab() !== 'associes'"
            [class.text-gray-500]="tab() !== 'associes'">
      Registre des associés ({{ associes().length }})
    </button>
    <button (click)="tab.set('assemblees')"
            class="px-4 py-2 text-sm font-medium border-b-2 transition"
            [class.border-blue-600]="tab() === 'assemblees'"
            [class.text-blue-700]="tab() === 'assemblees'"
            [class.border-transparent]="tab() !== 'assemblees'"
            [class.text-gray-500]="tab() !== 'assemblees'">
      Assemblées & Décisions ({{ assemblees().length }})
    </button>
  </div>

  <!-- ═══ ONGLET ASSOCIÉS ═══ -->
  @if (tab() === 'associes') {
    <div class="flex justify-between items-center">
      <div class="text-sm text-gray-500">
        Capital représenté :
        <span class="font-semibold text-gray-900">{{ totalPourcentage() | number:'1.2-2' }}%</span>
      </div>
      <button (click)="ouvrirModalAssocie()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
        + Ajouter un associé
      </button>
    </div>

    @if (associes().length === 0) {
      <div class="text-center text-gray-400 py-16 text-sm">Aucun associé enregistré.</div>
    } @else {
      <div class="grid gap-4">
        @for (a of associes(); track a.id) {
          <div class="bg-white rounded-xl shadow-sm border p-5">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                     [class]="avatarColor(a.typeAssocie)">
                  {{ initiales(a) }}
                </div>
                <div>
                  <p class="font-semibold text-gray-900">
                    {{ a.prenom ? a.prenom + ' ' + a.nom : a.nom }}
                    @if (!a.actif) { <span class="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactif</span> }
                  </p>
                  <p class="text-xs text-gray-500">{{ a.typeAssocieLabel }}</p>
                  @if (a.email) { <p class="text-xs text-blue-600 mt-0.5">{{ a.email }}</p> }
                </div>
              </div>
              <div class="text-right">
                <p class="text-lg font-bold text-gray-900">{{ a.pourcentage | number:'1.2-2' }}%</p>
                <p class="text-xs text-gray-500">Apport : {{ a.apport | number:'1.0-0' }}</p>
              </div>
            </div>

            <!-- Lien portail -->
            <div class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div class="flex items-center justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <p class="text-xs text-blue-600 font-medium mb-0.5">Lien d'accès au portail</p>
                  <p class="text-xs text-gray-500 truncate font-mono">{{ a.urlPortail }}</p>
                </div>
                <div class="flex gap-2 shrink-0">
                  <button (click)="copierLien(a.urlPortail)" class="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Copier</button>
                  <button (click)="regenererToken(a)" class="text-xs px-2 py-1 border border-blue-300 text-blue-700 rounded hover:bg-blue-50">Renouveler</button>
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-2 mt-3">
              <button (click)="ouvrirModalAssocie(a)" class="text-xs text-blue-600 hover:text-blue-800">Modifier</button>
              <button (click)="confirmerSuppressionAssocie(a)" class="text-xs text-red-500 hover:text-red-700">Supprimer</button>
            </div>
          </div>
        }
      </div>
    }
  }

  <!-- ═══ ONGLET ASSEMBLÉES ═══ -->
  @if (tab() === 'assemblees') {
    <div class="flex justify-end">
      <button (click)="ouvrirModalAssemblee()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
        + Nouvelle assemblée
      </button>
    </div>

    @if (assemblees().length === 0) {
      <div class="text-center text-gray-400 py-16 text-sm">Aucune assemblée enregistrée.</div>
    } @else {
      <div class="space-y-4">
        @for (ag of assemblees(); track ag.id) {
          <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
            <!-- En-tête AG -->
            <div class="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
              <div class="flex items-center gap-3">
                <span class="px-2 py-0.5 rounded text-xs font-medium" [class]="typeAGBadge(ag.typeAssemblee)">
                  {{ ag.typeAssembleeLabel }}
                </span>
                <div>
                  <p class="font-semibold text-gray-900">{{ ag.titre }}</p>
                  <p class="text-xs text-gray-500">{{ ag.dateAssemblee }} @if (ag.lieu) { — {{ ag.lieu }} } @if (ag.exerciceConcerne) { — Exercice {{ ag.exerciceConcerne }} }</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span class="px-2 py-1 rounded-full text-xs font-medium" [class]="statutAGBadge(ag.statut)">
                  {{ ag.statutLabel }}
                </span>
                <button (click)="ouvrirModalAssemblee(ag)" class="text-xs text-blue-600 hover:text-blue-800">Modifier</button>
                <button (click)="confirmerSuppressionAssemblee(ag)" class="text-xs text-red-500 hover:text-red-700">Suppr.</button>
              </div>
            </div>

            <!-- Résolutions -->
            @if (ag.resolutions.length > 0) {
              <div class="px-5 py-3">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Résolutions ({{ ag.resolutions.length }})
                </p>
                <div class="space-y-2">
                  @for (r of ag.resolutions; track r.id) {
                    <div class="flex items-start gap-3 p-2 rounded-lg bg-gray-50">
                      <span class="text-xs font-bold text-gray-400 mt-0.5 w-5 shrink-0">{{ r.numeroOrdre }}.</span>
                      <div class="flex-1">
                        <p class="text-sm font-medium text-gray-900">{{ r.titre }}</p>
                        @if (r.texte) { <p class="text-xs text-gray-500 mt-0.5">{{ r.texte }}</p> }
                        <div class="flex gap-3 mt-1 text-xs text-gray-500">
                          <span>{{ r.typeResolutionLabel }}</span>
                          @if (r.statut !== 'EN_ATTENTE') {
                            <span>— Pour : {{ r.votesPour }} | Contre : {{ r.votesContre }} | Abst. : {{ r.votesAbstention }}</span>
                          }
                        </div>
                      </div>
                      <span class="px-2 py-0.5 rounded-full text-xs font-medium shrink-0" [class]="statutResolutionBadge(r.statut)">
                        {{ r.statutLabel }}
                      </span>
                    </div>
                  }
                </div>
              </div>
            } @else {
              <p class="px-5 py-3 text-xs text-gray-400">Aucune résolution enregistrée.</p>
            }
          </div>
        }
      </div>
    }
  }

</div>

<!-- ══ MODAL ASSOCIÉ ══ -->
@if (modalAssocieOuvert()) {
  <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="px-6 py-4 border-b flex justify-between items-center sticky top-0 bg-white">
        <h2 class="font-semibold text-gray-900">{{ associeEnEdition() ? 'Modifier' : 'Nouvel associé' }}</h2>
        <button (click)="fermerModalAssocie()" class="text-gray-400 hover:text-gray-600 text-xl">×</button>
      </div>
      <form [formGroup]="formAssocie" (ngSubmit)="sauvegarderAssocie()" class="px-6 py-4 space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
            <input formControlName="nom" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Prénom</label>
            <input formControlName="prenom" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input type="email" formControlName="email" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
            <input formControlName="telephone" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Qualité</label>
          <select formControlName="typeAssocie" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            @for (t of typesAssocie; track t.value) {
              <option [value]="t.value">{{ t.label }}</option>
            }
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Apport</label>
            <input type="number" formControlName="apport" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">% Capital</label>
            <input type="number" step="0.01" formControlName="pourcentage" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Date d'entrée</label>
            <input type="date" formControlName="dateEntree" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          @if (associeEnEdition()) {
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Date de sortie</label>
              <input type="date" formControlName="dateSortie" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          }
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Notes</label>
          <textarea formControlName="notes" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" (click)="fermerModalAssocie()" class="px-4 py-2 text-sm text-gray-700 border rounded-lg hover:bg-gray-50">Annuler</button>
          <button type="submit" [disabled]="formAssocie.invalid" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {{ associeEnEdition() ? 'Enregistrer' : 'Créer' }}
          </button>
        </div>
      </form>
    </div>
  </div>
}

<!-- ══ MODAL ASSEMBLÉE ══ -->
@if (modalAssembleeOuvert()) {
  <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div class="px-6 py-4 border-b flex justify-between items-center sticky top-0 bg-white">
        <h2 class="font-semibold text-gray-900">{{ assembleEnEdition() ? 'Modifier' : 'Nouvelle assemblée' }}</h2>
        <button (click)="fermerModalAssemblee()" class="text-gray-400 hover:text-gray-600 text-xl">×</button>
      </div>
      <form [formGroup]="formAssemblee" (ngSubmit)="sauvegarderAssemblee()" class="px-6 py-4 space-y-4">

        <!-- Infos générales -->
        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2">
            <label class="block text-xs font-medium text-gray-700 mb-1">Titre *</label>
            <input formControlName="titre" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Type</label>
            <select formControlName="typeAssemblee" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              @for (t of typesAssemblee; track t.value) {
                <option [value]="t.value">{{ t.label }}</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Date *</label>
            <input type="date" formControlName="dateAssemblee" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Lieu</label>
            <input formControlName="lieu" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Exercice concerné</label>
            <input type="number" formControlName="exerciceConcerne" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Quorum requis (%)</label>
            <input type="number" step="0.01" formControlName="quorumRequis" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          @if (assembleEnEdition()) {
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Quorum atteint (%)</label>
              <input type="number" step="0.01" formControlName="quorumAtteint" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Statut</label>
              <select formControlName="statut" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="PLANIFIEE">Planifiée</option>
                <option value="TENUE">Tenue</option>
                <option value="CLOTUREE">Clôturée</option>
                <option value="ANNULEE">Annulée</option>
              </select>
            </div>
          }
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Ordre du jour</label>
          <textarea formControlName="ordreDuJour" rows="3" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        </div>

        @if (assembleEnEdition()) {
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Procès-verbal</label>
            <textarea formControlName="procesVerbal" rows="4" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          </div>
        }

        <!-- Résolutions -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="text-xs font-semibold text-gray-700 uppercase tracking-wide">Résolutions</label>
            <button type="button" (click)="ajouterResolution()" class="text-xs text-blue-600 hover:text-blue-800 font-medium">+ Ajouter</button>
          </div>
          <div formArrayName="resolutions" class="space-y-3">
            @for (ctrl of resolutionsArray.controls; track ctrl) {
              <div [formGroupName]="$index" class="border rounded-lg p-3 bg-gray-50 relative">
                <button type="button" (click)="supprimerResolution($index)"
                        class="absolute top-2 right-2 text-gray-300 hover:text-red-500 text-lg leading-none">×</button>
                <div class="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">N° ordre</label>
                    <input type="number" formControlName="numeroOrdre" class="w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Type</label>
                    <select formControlName="typeResolution" class="w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                      @for (t of typesResolution; track t.value) {
                        <option [value]="t.value">{{ t.label }}</option>
                      }
                    </select>
                  </div>
                </div>
                <div class="mb-2">
                  <label class="block text-xs text-gray-500 mb-1">Titre *</label>
                  <input formControlName="titre" class="w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div class="mb-2">
                  <label class="block text-xs text-gray-500 mb-1">Texte</label>
                  <textarea formControlName="texte" rows="2" class="w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"></textarea>
                </div>
                <div class="grid grid-cols-4 gap-2">
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Statut</label>
                    <select formControlName="statut" class="w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option value="EN_ATTENTE">En attente</option>
                      <option value="ADOPTEE">Adoptée</option>
                      <option value="REJETEE">Rejetée</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Pour</label>
                    <input type="number" formControlName="votesPour" class="w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Contre</label>
                    <input type="number" formControlName="votesContre" class="w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Abst.</label>
                    <input type="number" formControlName="votesAbstention" class="w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" (click)="fermerModalAssemblee()" class="px-4 py-2 text-sm text-gray-700 border rounded-lg hover:bg-gray-50">Annuler</button>
          <button type="submit" [disabled]="formAssemblee.invalid" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {{ assembleEnEdition() ? 'Enregistrer' : 'Créer' }}
          </button>
        </div>
      </form>
    </div>
  </div>
}

<!-- Confirmations suppression -->
@if (associeASupprimer()) {
  <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
      <h3 class="font-semibold text-gray-900">Supprimer l'associé ?</h3>
      <p class="text-sm text-gray-600">{{ associeASupprimer()!.prenom }} {{ associeASupprimer()!.nom }}</p>
      <div class="flex justify-end gap-3">
        <button (click)="associeASupprimer.set(null)" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Annuler</button>
        <button (click)="supprimerAssocie()" class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Supprimer</button>
      </div>
    </div>
  </div>
}

@if (assembleASupprimer()) {
  <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
      <h3 class="font-semibold text-gray-900">Supprimer l'assemblée ?</h3>
      <p class="text-sm text-gray-600">{{ assembleASupprimer()!.titre }}</p>
      <div class="flex justify-end gap-3">
        <button (click)="assembleASupprimer.set(null)" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Annuler</button>
        <button (click)="supprimerAssemblee()" class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Supprimer</button>
      </div>
    </div>
  </div>
}
`,
})
export class GouvernanceComponent implements OnInit {
  private svc = new GouvernanceService();
  private fb = new FormBuilder();

  tab = signal<Tab>('associes');
  associes = signal<AssocieResponse[]>([]);
  assemblees = signal<AssembleeResponse[]>([]);

  modalAssocieOuvert = signal(false);
  modalAssembleeOuvert = signal(false);
  associeEnEdition = signal<AssocieResponse | null>(null);
  assembleEnEdition = signal<AssembleeResponse | null>(null);
  associeASupprimer = signal<AssocieResponse | null>(null);
  assembleASupprimer = signal<AssembleeResponse | null>(null);

  totalPourcentage = computed(() =>
    this.associes().filter(a => a.actif).reduce((s, a) => s + a.pourcentage, 0)
  );

  typesAssocie = TYPES_ASSOCIE;
  typesAssemblee = TYPES_ASSEMBLEE;
  typesResolution = TYPES_RESOLUTION;

  formAssocie = this.fb.group({
    nom:          ['', Validators.required],
    prenom:       [''],
    email:        [''],
    telephone:    [''],
    typeAssocie:  ['ASSOCIE' as TypeAssocie],
    apport:       [0],
    pourcentage:  [0],
    dateEntree:   [''],
    dateSortie:   [''],
    notes:        [''],
  });

  formAssemblee = this.fb.group({
    typeAssemblee:    ['AG_ORDINAIRE' as TypeAssemblee],
    titre:            ['', Validators.required],
    dateAssemblee:    ['', Validators.required],
    lieu:             [''],
    exerciceConcerne: [null as number | null],
    quorumRequis:     [null as number | null],
    quorumAtteint:    [null as number | null],
    statut:           ['PLANIFIEE' as StatutAssemblee],
    ordreDuJour:      [''],
    procesVerbal:     [''],
    resolutions:      this.fb.array([]),
  });

  get resolutionsArray() { return this.formAssemblee.get('resolutions') as FormArray; }

  ngOnInit() { this.charger(); }

  private charger() {
    this.svc.listerAssocies().subscribe(d => this.associes.set(d));
    this.svc.listerAssemblees().subscribe(d => this.assemblees.set(d));
  }

  // ─── Associés ──────────────────────────────────────────────────────────────

  ouvrirModalAssocie(a?: AssocieResponse) {
    this.associeEnEdition.set(a ?? null);
    this.formAssocie.reset({ typeAssocie: 'ASSOCIE', apport: 0, pourcentage: 0 });
    if (a) {
      this.formAssocie.patchValue({
        nom: a.nom, prenom: a.prenom ?? '', email: a.email ?? '',
        telephone: a.telephone ?? '', typeAssocie: a.typeAssocie,
        apport: a.apport, pourcentage: a.pourcentage,
        dateEntree: a.dateEntree ?? '', dateSortie: a.dateSortie ?? '',
        notes: a.notes ?? '',
      });
    }
    this.modalAssocieOuvert.set(true);
  }

  fermerModalAssocie() { this.modalAssocieOuvert.set(false); this.associeEnEdition.set(null); }

  sauvegarderAssocie() {
    if (this.formAssocie.invalid) return;
    const v = this.formAssocie.value;
    const ed = this.associeEnEdition();
    if (ed) {
      this.svc.mettreAJourAssocie(ed.id, {
        nom: v.nom ?? undefined, prenom: v.prenom || undefined,
        email: v.email || undefined, telephone: v.telephone || undefined,
        typeAssocie: (v.typeAssocie as TypeAssocie) || undefined,
        apport: v.apport ?? undefined, pourcentage: v.pourcentage ?? undefined,
        dateSortie: v.dateSortie || undefined, notes: v.notes || undefined,
      }).subscribe(() => { this.fermerModalAssocie(); this.charger(); });
    } else {
      this.svc.creerAssocie({
        nom: v.nom!, prenom: v.prenom || undefined,
        email: v.email || undefined, telephone: v.telephone || undefined,
        typeAssocie: (v.typeAssocie as TypeAssocie) || 'ASSOCIE',
        apport: v.apport ?? 0, pourcentage: v.pourcentage ?? 0,
        dateEntree: v.dateEntree || undefined, notes: v.notes || undefined,
      }).subscribe(() => { this.fermerModalAssocie(); this.charger(); });
    }
  }

  regenererToken(a: AssocieResponse) {
    if (!confirm('Renouveler le lien de portail ? L\'ancien lien sera invalidé.')) return;
    this.svc.regenererToken(a.id).subscribe(() => this.charger());
  }

  copierLien(url: string) {
    navigator.clipboard.writeText(url);
  }

  confirmerSuppressionAssocie(a: AssocieResponse) { this.associeASupprimer.set(a); }

  supprimerAssocie() {
    const a = this.associeASupprimer();
    if (!a) return;
    this.svc.supprimerAssocie(a.id).subscribe(() => { this.associeASupprimer.set(null); this.charger(); });
  }

  // ─── Assemblées ────────────────────────────────────────────────────────────

  ouvrirModalAssemblee(ag?: AssembleeResponse) {
    this.assembleEnEdition.set(ag ?? null);
    while (this.resolutionsArray.length) this.resolutionsArray.removeAt(0);
    this.formAssemblee.reset({ typeAssemblee: 'AG_ORDINAIRE', statut: 'PLANIFIEE' });
    if (ag) {
      this.formAssemblee.patchValue({
        typeAssemblee: ag.typeAssemblee, titre: ag.titre,
        dateAssemblee: ag.dateAssemblee, lieu: ag.lieu ?? '',
        exerciceConcerne: ag.exerciceConcerne, quorumRequis: ag.quorumRequis,
        quorumAtteint: ag.quorumAtteint, statut: ag.statut,
        ordreDuJour: ag.ordreDuJour ?? '', procesVerbal: ag.procesVerbal ?? '',
      });
      ag.resolutions.forEach(r => this.resolutionsArray.push(this.newResolutionGroup(r)));
    }
    this.modalAssembleeOuvert.set(true);
  }

  fermerModalAssemblee() { this.modalAssembleeOuvert.set(false); this.assembleEnEdition.set(null); }

  ajouterResolution() {
    this.resolutionsArray.push(this.newResolutionGroup());
  }

  supprimerResolution(i: number) { this.resolutionsArray.removeAt(i); }

  private newResolutionGroup(r?: any) {
    return this.fb.group({
      numeroOrdre:     [r?.numeroOrdre ?? (this.resolutionsArray.length + 1)],
      titre:           [r?.titre ?? '', Validators.required],
      texte:           [r?.texte ?? ''],
      typeResolution:  [r?.typeResolution ?? 'AUTRE'],
      statut:          [r?.statut ?? 'EN_ATTENTE'],
      votesPour:       [r?.votesPour ?? 0],
      votesContre:     [r?.votesContre ?? 0],
      votesAbstention: [r?.votesAbstention ?? 0],
    });
  }

  sauvegarderAssemblee() {
    if (this.formAssemblee.invalid) return;
    const v = this.formAssemblee.value;
    const resolutions: ResolutionRequest[] = (v.resolutions as any[] ?? []).map(r => ({
      numeroOrdre: r.numeroOrdre, titre: r.titre, texte: r.texte || undefined,
      typeResolution: r.typeResolution, statut: r.statut,
      votesPour: r.votesPour, votesContre: r.votesContre, votesAbstention: r.votesAbstention,
    }));

    const ed = this.assembleEnEdition();
    if (ed) {
      this.svc.mettreAJourAssemblee(ed.id, {
        titre: v.titre ?? undefined, dateAssemblee: v.dateAssemblee || undefined,
        lieu: v.lieu || undefined, exerciceConcerne: v.exerciceConcerne ?? undefined,
        quorumRequis: v.quorumRequis ?? undefined, quorumAtteint: v.quorumAtteint ?? undefined,
        statut: (v.statut as StatutAssemblee) || undefined,
        ordreDuJour: v.ordreDuJour || undefined, procesVerbal: v.procesVerbal || undefined,
        resolutions,
      }).subscribe(() => { this.fermerModalAssemblee(); this.charger(); });
    } else {
      this.svc.creerAssemblee({
        typeAssemblee: (v.typeAssemblee as TypeAssemblee) || 'AG_ORDINAIRE',
        titre: v.titre!, dateAssemblee: v.dateAssemblee!,
        lieu: v.lieu || undefined, exerciceConcerne: v.exerciceConcerne ?? undefined,
        quorumRequis: v.quorumRequis ?? undefined,
        ordreDuJour: v.ordreDuJour || undefined, resolutions,
      }).subscribe(() => { this.fermerModalAssemblee(); this.charger(); });
    }
  }

  confirmerSuppressionAssemblee(ag: AssembleeResponse) { this.assembleASupprimer.set(ag); }

  supprimerAssemblee() {
    const ag = this.assembleASupprimer();
    if (!ag) return;
    this.svc.supprimerAssemblee(ag.id).subscribe(() => { this.assembleASupprimer.set(null); this.charger(); });
  }

  // ─── Style helpers ─────────────────────────────────────────────────────────

  initiales(a: AssocieResponse): string {
    const p = a.prenom?.[0] ?? '';
    return (p + a.nom[0]).toUpperCase();
  }

  avatarColor(type: TypeAssocie): string {
    const map: Record<TypeAssocie, string> = {
      ASSOCIE: 'bg-blue-500', GERANT: 'bg-purple-600',
      ADMINISTRATEUR: 'bg-indigo-600', COMMISSAIRE_AUX_COMPTES: 'bg-amber-600',
      OBSERVATEUR: 'bg-gray-400',
    };
    return map[type] ?? 'bg-gray-400';
  }

  typeAGBadge(type: TypeAssemblee): string {
    const map: Record<TypeAssemblee, string> = {
      AG_ORDINAIRE:         'bg-blue-100 text-blue-800',
      AG_EXTRAORDINAIRE:    'bg-purple-100 text-purple-800',
      CONSEIL_ADMINISTRATION: 'bg-indigo-100 text-indigo-800',
      AUTRE:                'bg-gray-100 text-gray-700',
    };
    return map[type] ?? 'bg-gray-100 text-gray-700';
  }

  statutAGBadge(statut: StatutAssemblee): string {
    const map: Record<StatutAssemblee, string> = {
      PLANIFIEE: 'bg-yellow-100 text-yellow-800',
      TENUE:     'bg-blue-100 text-blue-800',
      CLOTUREE:  'bg-green-100 text-green-800',
      ANNULEE:   'bg-red-100 text-red-800',
    };
    return map[statut] ?? 'bg-gray-100 text-gray-700';
  }

  statutResolutionBadge(statut: StatutResolution): string {
    const map: Record<StatutResolution, string> = {
      EN_ATTENTE: 'bg-yellow-100 text-yellow-700',
      ADOPTEE:    'bg-green-100 text-green-700',
      REJETEE:    'bg-red-100 text-red-700',
    };
    return map[statut] ?? 'bg-gray-100 text-gray-700';
  }
}
