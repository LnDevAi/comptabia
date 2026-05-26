import {
  ChangeDetectionStrategy, Component, OnInit,
  signal, computed, inject
} from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AcademeService } from '../../core/services/academie.service';
import { ToastService } from '../../core/services/toast.service';
import {
  CoursResume, CoursDetail, InscriptionResume, CertificatResponse,
  DashboardStats, QuizResult,
  NIVEAU_LABELS, NIVEAU_CLASSES, CATEGORIE_LABELS,
  CoursCategorie, CoursNiveau
} from '../../core/models/academie.model';

type Tab = 'catalogue' | 'formations' | 'certificats';

const CATEGORIES: CoursCategorie[] = [
  'SYSCOHADA', 'OHADA', 'COMPTABILITE', 'FISCALITE', 'TRESORERIE',
  'PAIE_RH', 'AUDIT', 'BUDGET', 'IMMOBILISATIONS', 'FACTURATION',
  'CRM', 'PILOTAGE', 'GOUVERNANCE', 'ASSURANCE_CIMA',
  'MICROFINANCE_SFD', 'FINANCE_ISLAMIQUE'
];

@Component({
  selector: 'app-academie',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DecimalPipe, DatePipe],
  template: `
<div class="p-6 space-y-6 max-w-7xl mx-auto">

  <!-- ══ HEADER ══ -->
  <div class="flex items-center justify-between flex-wrap gap-4">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <span class="text-indigo-600">✦</span> Académie eCompta
      </h1>
      <p class="text-sm text-gray-500 mt-0.5">
        Certifications comptables — SYSCOHADA, OHADA, Fiscalité et tous les modules de la plateforme
      </p>
    </div>
  </div>

  <!-- ══ STATS ══ -->
  @if (stats()) {
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">Cours disponibles</p>
        <p class="text-3xl font-bold text-indigo-600">{{ stats()!.totalCours }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">Mes formations</p>
        <p class="text-3xl font-bold text-blue-600">{{ stats()!.mesFormations }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">Terminées</p>
        <p class="text-3xl font-bold text-emerald-600">{{ stats()!.mesFormationsTerminees }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">Certificats obtenus</p>
        <p class="text-3xl font-bold text-amber-600">{{ stats()!.mesCertificats }}</p>
      </div>
    </div>
  }

  <!-- ══ TABS ══ -->
  <div class="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
    @for (t of tabs; track t.id) {
      <button (click)="tab.set(t.id)"
        [class]="tab() === t.id
          ? 'px-4 py-2 bg-white rounded-md text-sm font-medium text-indigo-700 shadow-sm'
          : 'px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900'">
        {{ t.label }}
      </button>
    }
  </div>

  <!-- ══ TAB CATALOGUE ══ -->
  @if (tab() === 'catalogue') {
    <!-- Filtres -->
    <div class="flex flex-wrap gap-3 items-center">
      <select [(ngModel)]="filterCategorie" (ngModelChange)="chargerCatalogue()"
              class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
        <option value="">Toutes les catégories</option>
        @for (cat of categories; track cat) {
          <option [value]="cat">{{ catLabel(cat) }}</option>
        }
      </select>
      <select [(ngModel)]="filterNiveau" (ngModelChange)="chargerCatalogue()"
              class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
        <option value="">Tous les niveaux</option>
        <option value="DEBUTANT">Débutant</option>
        <option value="INTERMEDIAIRE">Intermédiaire</option>
        <option value="AVANCE">Avancé</option>
      </select>
      <span class="text-sm text-gray-400">{{ catalogue().length }} cours</span>
    </div>

    @if (loading()) {
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (i of [1,2,3,4,5,6]; track i) {
          <div class="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
            <div class="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div class="h-3 bg-gray-100 rounded w-full mb-1"></div>
            <div class="h-3 bg-gray-100 rounded w-2/3"></div>
          </div>
        }
      </div>
    } @else {
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (c of catalogue(); track c.id) {
          <div class="bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all p-5 flex flex-col gap-3 cursor-pointer"
               (click)="openCours(c.id)">

            <!-- Badges -->
            <div class="flex items-center gap-2 flex-wrap">
              <span [class]="niveauClass(c.niveau)"
                    class="px-2 py-0.5 rounded-full text-xs font-semibold">
                {{ niveauLabel(c.niveau) }}
              </span>
              <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                {{ catLabel(c.categorie) }}
              </span>
              @if (c.certifie) {
                <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                  ✓ Certifié
                </span>
              }
            </div>

            <!-- Titre -->
            <h3 class="text-sm font-semibold text-gray-900 leading-snug">{{ c.titre }}</h3>
            <p class="text-xs text-gray-500 line-clamp-2 leading-relaxed">{{ c.description }}</p>

            <!-- Footer -->
            <div class="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
              <span class="text-xs text-gray-400">⏱ {{ c.dureeHeures }}h · {{ c.nbInscrits }} inscrits</span>
              @if (c.inscrit && !c.certifie) {
                <div class="flex items-center gap-2">
                  <div class="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div class="h-full bg-indigo-500 rounded-full" [style.width.%]="c.progression"></div>
                  </div>
                  <span class="text-xs text-indigo-600 font-medium">{{ c.progression }}%</span>
                </div>
              } @else if (!c.inscrit) {
                <span class="text-xs font-medium text-indigo-600">S'inscrire →</span>
              }
            </div>
          </div>
        }
      </div>
    }

    <!-- ── MODAL COURS DETAIL ── -->
    @if (coursDetail()) {
      <div class="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4 bg-black/40"
           (click)="fermerDetail()">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
             (click)="$event.stopPropagation()">

          <!-- Header modal -->
          <div class="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span [class]="niveauClass(coursDetail()!.niveau)"
                      class="px-2 py-0.5 rounded-full text-xs font-semibold">
                  {{ niveauLabel(coursDetail()!.niveau) }}
                </span>
                <span class="text-xs text-indigo-600 font-medium">{{ catLabel(coursDetail()!.categorie) }}</span>
              </div>
              <h2 class="text-lg font-bold text-gray-900">{{ coursDetail()!.titre }}</h2>
              <p class="text-xs text-gray-500 mt-0.5">⏱ {{ coursDetail()!.dureeHeures }}h de formation</p>
            </div>
            <button (click)="fermerDetail()" class="text-gray-400 hover:text-gray-700 ml-4 text-xl">✕</button>
          </div>

          <div class="p-6 space-y-5">
            <!-- Description -->
            <p class="text-sm text-gray-600 leading-relaxed">{{ coursDetail()!.description }}</p>

            <!-- S'inscrire -->
            @if (!coursDetail()!.inscrit && !coursDetail()!.certifie) {
              <button (click)="inscrire(coursDetail()!.id)"
                      [disabled]="inscriptionEnCours()"
                      class="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition disabled:opacity-60">
                {{ inscriptionEnCours() ? 'Inscription...' : 'S\'inscrire à ce cours' }}
              </button>
            }

            <!-- Programme -->
            @if (coursDetail()!.chapitres.length > 0) {
              <div>
                <h3 class="text-sm font-semibold text-gray-800 mb-3">
                  Programme ({{ coursDetail()!.chapitres.length }} chapitres)
                </h3>
                <div class="space-y-2">
                  @for (ch of coursDetail()!.chapitres; track ch.id) {
                    <div class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                         [class.bg-emerald-50]="isChapTermine(ch.id)"
                         [class.hover:bg-emerald-100]="isChapTermine(ch.id)">
                      <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            [class]="isChapTermine(ch.id) ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'">
                        {{ isChapTermine(ch.id) ? '✓' : (ch.ordre + 1) }}
                      </span>
                      <span class="text-sm text-gray-800 flex-1">{{ ch.titre }}</span>
                      <span class="text-xs text-gray-400">{{ ch.dureeMinutes }} min</span>
                      @if (coursDetail()!.inscrit && !isChapTermine(ch.id)) {
                        <button (click)="marquerChapitre(ch.id); $event.stopPropagation()"
                                class="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                          Marquer lu
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Quiz -->
            @if (coursDetail()!.quiz && coursDetail()!.inscrit && !coursDetail()!.certifie) {
              @if (!afficherQuiz()) {
                <div class="bg-indigo-50 rounded-xl p-4 text-center">
                  <p class="text-sm font-medium text-indigo-800 mb-1">
                    Quiz final — {{ coursDetail()!.quiz!.questions.length }} questions
                  </p>
                  <p class="text-xs text-indigo-600 mb-3">
                    Score minimum requis : {{ coursDetail()!.quiz!.scoreMinimum }}%
                  </p>
                  <button (click)="afficherQuiz.set(true)"
                          class="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition">
                    Commencer le quiz
                  </button>
                </div>
              } @else {
                <div class="space-y-4">
                  <h3 class="text-sm font-semibold text-gray-800">
                    {{ coursDetail()!.quiz!.titre }}
                  </h3>
                  @for (q of coursDetail()!.quiz!.questions; track q.id; let qi = $index) {
                    <div class="bg-gray-50 rounded-xl p-4 space-y-2">
                      <p class="text-sm font-medium text-gray-800">{{ qi + 1 }}. {{ q.question }}</p>
                      @for (opt of optionsOf(q); track opt.key) {
                        <label class="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-indigo-700">
                          <input type="radio" [name]="'q_' + q.id" [value]="opt.key"
                                 (change)="setReponse(q.id, opt.key)"
                                 class="accent-indigo-600">
                          <span>{{ opt.key }}. {{ opt.val }}</span>
                        </label>
                      }
                    </div>
                  }
                  <button (click)="soumettreQuiz()"
                          [disabled]="quizEnCours()"
                          class="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition disabled:opacity-60">
                    {{ quizEnCours() ? 'Envoi...' : 'Soumettre le quiz' }}
                  </button>
                </div>
              }
            }

            <!-- Résultat quiz -->
            @if (quizResult()) {
              <div [class]="quizResult()!.reussi
                    ? 'bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center'
                    : 'bg-red-50 border border-red-200 rounded-xl p-5 text-center'">
                <p class="text-2xl font-bold mb-1"
                   [class]="quizResult()!.reussi ? 'text-emerald-700' : 'text-red-700'">
                  {{ quizResult()!.scoreObtenu }}%
                </p>
                <p class="text-sm font-medium"
                   [class]="quizResult()!.reussi ? 'text-emerald-800' : 'text-red-800'">
                  {{ quizResult()!.reussi ? '🎉 Félicitations ! Certificat obtenu.' : 'Score insuffisant. Réessayez !' }}
                </p>
                @if (quizResult()!.certificat) {
                  <p class="text-xs text-emerald-600 mt-2 font-mono">
                    N° {{ quizResult()!.certificat!.numeroCertificat }}
                  </p>
                }
              </div>
            }

            <!-- Déjà certifié -->
            @if (coursDetail()!.certifie) {
              <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <p class="text-amber-800 font-semibold text-sm">✓ Vous êtes certifié sur ce cours</p>
                <button (click)="tab.set('certificats'); fermerDetail()"
                        class="mt-2 text-xs text-amber-700 underline hover:text-amber-900">
                  Voir mes certificats →
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    }
  }

  <!-- ══ TAB MES FORMATIONS ══ -->
  @if (tab() === 'formations') {
    @if (formations().length === 0) {
      <div class="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p class="text-4xl mb-3">📚</p>
        <p class="text-gray-500 text-sm">Vous n'êtes inscrit à aucune formation.</p>
        <button (click)="tab.set('catalogue')"
                class="mt-3 text-indigo-600 text-sm font-medium hover:underline">
          Parcourir le catalogue →
        </button>
      </div>
    } @else {
      <div class="space-y-3">
        @for (f of formations(); track f.id) {
          <div class="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-5">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span [class]="niveauClass(f.coursNiveau)"
                      class="px-2 py-0.5 rounded-full text-xs font-semibold">
                  {{ niveauLabel(f.coursNiveau) }}
                </span>
                <span class="text-xs text-indigo-600 font-medium">{{ catLabel(f.coursCategorie) }}</span>
                <span [class]="statutClass(f.statut)"
                      class="px-2 py-0.5 rounded-full text-xs font-semibold ml-auto">
                  {{ statutLabel(f.statut) }}
                </span>
              </div>
              <p class="text-sm font-semibold text-gray-900 truncate">{{ f.coursTitre }}</p>
              <p class="text-xs text-gray-400 mt-0.5">
                Débuté le {{ f.dateDebut | date:'dd/MM/yyyy' }}
                @if (f.dateFin) { · Terminé le {{ f.dateFin | date:'dd/MM/yyyy' }} }
              </p>
            </div>
            <!-- Barre progression -->
            <div class="w-32 shrink-0">
              <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Progression</span>
                <span class="font-medium">{{ f.progression }}%</span>
              </div>
              <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all"
                     [class]="f.statut === 'TERMINE' ? 'bg-emerald-500' : 'bg-indigo-500'"
                     [style.width.%]="f.progression"></div>
              </div>
            </div>
            <button (click)="openCours(f.coursId)"
                    class="shrink-0 px-3 py-1.5 border border-indigo-300 text-indigo-700 text-xs font-medium rounded-lg hover:bg-indigo-50 transition">
              Continuer →
            </button>
          </div>
        }
      </div>
    }
  }

  <!-- ══ TAB CERTIFICATS ══ -->
  @if (tab() === 'certificats') {
    @if (certificats().length === 0) {
      <div class="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p class="text-4xl mb-3">🏆</p>
        <p class="text-gray-500 text-sm">Aucun certificat obtenu pour le moment.</p>
        <p class="text-xs text-gray-400 mt-1">
          Complétez un cours et réussissez le quiz pour obtenir votre certification.
        </p>
      </div>
    } @else {
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (c of certificats(); track c.id) {
          <div class="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
            <!-- En-tête certificat -->
            <div class="flex items-start justify-between mb-4">
              <div>
                <span class="text-xs text-amber-600 font-semibold uppercase tracking-wider">Certificat eCompta</span>
                <p class="font-mono text-xs text-amber-500 mt-0.5">{{ c.numeroCertificat }}</p>
              </div>
              <span class="text-3xl">🏆</span>
            </div>
            <!-- Contenu -->
            <p class="text-xs text-amber-700 mb-1">Certifie que</p>
            <p class="text-lg font-bold text-amber-900">{{ c.nomBeneficiaire }}</p>
            <p class="text-xs text-amber-700 mt-1">a validé le cours</p>
            <p class="text-sm font-semibold text-gray-800 mt-0.5">{{ c.coursTitre }}</p>
            <!-- Footer -->
            <div class="flex items-center justify-between mt-4 pt-3 border-t border-amber-200">
              <div class="flex items-center gap-3">
                <span [class]="niveauClass(c.coursNiveau)"
                      class="px-2 py-0.5 rounded-full text-xs font-semibold">
                  {{ niveauLabel(c.coursNiveau) }}
                </span>
                <span class="text-xs text-amber-700 font-medium bg-amber-100 px-2 py-0.5 rounded-full">
                  Score : {{ c.scoreObtenu }}%
                </span>
              </div>
              <span class="text-xs text-amber-600">{{ c.dateObtention | date:'dd/MM/yyyy' }}</span>
            </div>
          </div>
        }
      </div>
    }
  }

</div>
  `
})
export class AcademieComponent implements OnInit {
  private svc    = inject(AcademeService);
  private toast  = inject(ToastService);

  readonly tabs = [
    { id: 'catalogue'  as Tab, label: 'Catalogue' },
    { id: 'formations' as Tab, label: 'Mes formations' },
    { id: 'certificats' as Tab, label: 'Mes certificats' },
  ];

  tab          = signal<Tab>('catalogue');
  catalogue    = signal<CoursResume[]>([]);
  formations   = signal<InscriptionResume[]>([]);
  certificats  = signal<CertificatResponse[]>([]);
  stats        = signal<DashboardStats | null>(null);
  coursDetail  = signal<CoursDetail | null>(null);

  loading             = signal(false);
  inscriptionEnCours  = signal(false);
  quizEnCours         = signal(false);
  afficherQuiz        = signal(false);
  quizResult          = signal<QuizResult | null>(null);
  quizReponses        = new Map<string, string>();

  filterCategorie = '';
  filterNiveau    = '';

  readonly categories = CATEGORIES;

  ngOnInit(): void {
    this.chargerStats();
    this.chargerCatalogue();
    this.chargerFormations();
    this.chargerCertificats();
  }

  chargerStats(): void {
    this.svc.stats().subscribe({ next: s => this.stats.set(s) });
  }

  chargerCatalogue(): void {
    this.loading.set(true);
    this.svc.catalogue(this.filterCategorie || undefined, this.filterNiveau || undefined)
      .subscribe({
        next: d => { this.catalogue.set(d); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
  }

  chargerFormations(): void {
    this.svc.mesFormations().subscribe({ next: d => this.formations.set(d) });
  }

  chargerCertificats(): void {
    this.svc.mesCertificats().subscribe({ next: d => this.certificats.set(d) });
  }

  openCours(id: string): void {
    this.quizResult.set(null);
    this.quizReponses.clear();
    this.afficherQuiz.set(false);
    this.svc.detail(id).subscribe({ next: d => this.coursDetail.set(d) });
  }

  fermerDetail(): void { this.coursDetail.set(null); }

  inscrire(coursId: string): void {
    this.inscriptionEnCours.set(true);
    this.svc.inscrire(coursId).subscribe({
      next: () => {
        this.inscriptionEnCours.set(false);
        this.toast.success('Inscription validée ! Bonne formation.');
        this.chargerCatalogue();
        this.chargerFormations();
        this.chargerStats();
        this.openCours(coursId);
      },
      error: () => this.inscriptionEnCours.set(false)
    });
  }

  isChapTermine(chapId: string): boolean {
    return this.coursDetail()?.chapitresTermines.includes(chapId) ?? false;
  }

  marquerChapitre(chapitreId: string): void {
    const detail = this.coursDetail();
    if (!detail?.inscriptionId) return;
    this.svc.marquerChapitre(detail.inscriptionId, chapitreId).subscribe({
      next: insc => {
        const d = this.coursDetail()!;
        this.coursDetail.set({
          ...d,
          progression: insc.progression,
          chapitresTermines: [...d.chapitresTermines, chapitreId]
        });
        this.chargerCatalogue();
        this.chargerFormations();
      }
    });
  }

  setReponse(questionId: string, val: string): void {
    this.quizReponses.set(questionId, val);
  }

  soumettreQuiz(): void {
    const detail = this.coursDetail();
    if (!detail?.inscriptionId) return;
    const reponses = Array.from(this.quizReponses.entries())
        .map(([questionId, reponse]) => ({ questionId, reponse }));
    this.quizEnCours.set(true);
    this.svc.soumettreQuiz(detail.inscriptionId, { reponses }).subscribe({
      next: r => {
        this.quizEnCours.set(false);
        this.quizResult.set(r);
        this.afficherQuiz.set(false);
        if (r.reussi) {
          this.toast.success('Félicitations ! Certificat obtenu : ' + r.certificat?.numeroCertificat);
          this.chargerCertificats();
          this.chargerStats();
          this.chargerCatalogue();
        } else {
          this.toast.warning(`Score : ${r.scoreObtenu}% — Minimum requis : ${r.scoreMinimum}%. Réessayez !`);
        }
      },
      error: () => this.quizEnCours.set(false)
    });
  }

  optionsOf(q: { optionA: string; optionB: string; optionC: string | null; optionD: string | null }) {
    const opts: { key: string; val: string }[] = [
      { key: 'A', val: q.optionA },
      { key: 'B', val: q.optionB },
    ];
    if (q.optionC) opts.push({ key: 'C', val: q.optionC });
    if (q.optionD) opts.push({ key: 'D', val: q.optionD });
    return opts;
  }

  niveauLabel(n: CoursNiveau): string  { return NIVEAU_LABELS[n] ?? n; }
  niveauClass(n: CoursNiveau): string  { return NIVEAU_CLASSES[n] ?? ''; }
  catLabel(c: string): string          { return CATEGORIE_LABELS[c as CoursCategorie] ?? c; }

  statutLabel(s: string): string {
    return s === 'EN_COURS' ? 'En cours' : s === 'TERMINE' ? 'Terminé' : 'Abandonné';
  }
  statutClass(s: string): string {
    return s === 'EN_COURS' ? 'bg-blue-100 text-blue-700'
         : s === 'TERMINE'  ? 'bg-emerald-100 text-emerald-700'
         : 'bg-gray-100 text-gray-500';
  }
}
