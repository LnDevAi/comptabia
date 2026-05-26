package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.Associe;
import com.edefence.ecompta.domain.AssembleeGenerale;
import com.edefence.ecompta.domain.Entreprise;
import com.edefence.ecompta.domain.Resolution;
import com.edefence.ecompta.dto.gouvernance.AssocieDto;
import com.edefence.ecompta.dto.gouvernance.AssembleeDto;
import com.edefence.ecompta.repository.AssocieRepository;
import com.edefence.ecompta.repository.AssembleeGeneraleRepository;
import com.edefence.ecompta.repository.EntrepriseRepository;
import com.edefence.ecompta.repository.LigneEcritureRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AssocieService {

    private final AssocieRepository associeRepo;
    private final AssembleeGeneraleRepository assembleRepo;
    private final EntrepriseRepository entrepriseRepo;
    private final LigneEcritureRepository ligneRepo;

    @Value("${app.base-url:http://localhost:4200}")
    private String baseUrl;

    private static final Map<Associe.TypeAssocie, String> TYPE_LABELS = Map.of(
            Associe.TypeAssocie.ASSOCIE,                   "Associé",
            Associe.TypeAssocie.GERANT,                    "Gérant",
            Associe.TypeAssocie.ADMINISTRATEUR,            "Administrateur",
            Associe.TypeAssocie.COMMISSAIRE_AUX_COMPTES,   "Commissaire aux comptes",
            Associe.TypeAssocie.OBSERVATEUR,               "Observateur"
    );

    private static final Map<AssembleeGenerale.TypeAssemblee, String> ASSEMBLEE_LABELS = Map.of(
            AssembleeGenerale.TypeAssemblee.AG_ORDINAIRE,       "Assemblée Générale Ordinaire",
            AssembleeGenerale.TypeAssemblee.AG_EXTRAORDINAIRE,  "Assemblée Générale Extraordinaire",
            AssembleeGenerale.TypeAssemblee.CONSEIL_ADMINISTRATION, "Conseil d'Administration",
            AssembleeGenerale.TypeAssemblee.AUTRE,              "Réunion / Décision"
    );

    private static final Map<AssembleeGenerale.StatutAssemblee, String> STATUT_AG_LABELS = Map.of(
            AssembleeGenerale.StatutAssemblee.PLANIFIEE,  "Planifiée",
            AssembleeGenerale.StatutAssemblee.TENUE,      "Tenue",
            AssembleeGenerale.StatutAssemblee.CLOTUREE,   "Clôturée",
            AssembleeGenerale.StatutAssemblee.ANNULEE,    "Annulée"
    );

    private static final Map<Resolution.TypeResolution, String> RES_TYPE_LABELS = Map.of(
            Resolution.TypeResolution.APPROBATION_COMPTES,   "Approbation des comptes",
            Resolution.TypeResolution.AFFECTATION_RESULTAT,  "Affectation du résultat",
            Resolution.TypeResolution.NOMINATION_REVOCATION, "Nomination / Révocation",
            Resolution.TypeResolution.MODIFICATION_STATUTS,  "Modification des statuts",
            Resolution.TypeResolution.AUGMENTATION_CAPITAL,  "Augmentation de capital",
            Resolution.TypeResolution.REDUCTION_CAPITAL,     "Réduction de capital",
            Resolution.TypeResolution.DISSOLUTION,           "Dissolution",
            Resolution.TypeResolution.AUTRE,                 "Autre décision"
    );

    private static final Map<Resolution.StatutResolution, String> RES_STATUT_LABELS = Map.of(
            Resolution.StatutResolution.EN_ATTENTE, "En attente",
            Resolution.StatutResolution.ADOPTEE,    "Adoptée",
            Resolution.StatutResolution.REJETEE,    "Rejetée"
    );

    // ─── Associés CRUD ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AssocieDto.Response> listerAssocies(UUID entrepriseId) {
        return associeRepo.findByEntrepriseIdOrderByNomAsc(entrepriseId)
                .stream().map(this::toAssocieResponse).toList();
    }

    @Transactional
    public AssocieDto.Response creerAssocie(UUID entrepriseId, AssocieDto.CreateRequest req) {
        Entreprise e = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Entreprise introuvable"));
        Associe a = associeRepo.save(Associe.builder()
                .entreprise(e)
                .nom(req.nom())
                .prenom(req.prenom())
                .email(req.email())
                .telephone(req.telephone())
                .typeAssocie(req.typeAssocie() != null ? req.typeAssocie() : Associe.TypeAssocie.ASSOCIE)
                .apport(req.apport() != null ? req.apport() : BigDecimal.ZERO)
                .pourcentage(req.pourcentage() != null ? req.pourcentage() : BigDecimal.ZERO)
                .dateEntree(req.dateEntree())
                .notes(req.notes())
                .build());
        return toAssocieResponse(a);
    }

    @Transactional
    public AssocieDto.Response mettreAJourAssocie(UUID entrepriseId, UUID id, AssocieDto.UpdateRequest req) {
        Associe a = getAssocieOrThrow(entrepriseId, id);
        if (req.nom() != null)          a.setNom(req.nom());
        if (req.prenom() != null)       a.setPrenom(req.prenom());
        if (req.email() != null)        a.setEmail(req.email());
        if (req.telephone() != null)    a.setTelephone(req.telephone());
        if (req.typeAssocie() != null)  a.setTypeAssocie(req.typeAssocie());
        if (req.apport() != null)       a.setApport(req.apport());
        if (req.pourcentage() != null)  a.setPourcentage(req.pourcentage());
        if (req.dateSortie() != null)   a.setDateSortie(req.dateSortie());
        if (req.actif() != null)        a.setActif(req.actif());
        if (req.notes() != null)        a.setNotes(req.notes());
        return toAssocieResponse(associeRepo.save(a));
    }

    @Transactional
    public AssocieDto.Response regenererToken(UUID entrepriseId, UUID id) {
        Associe a = getAssocieOrThrow(entrepriseId, id);
        a.setTokenPortail(UUID.randomUUID());
        return toAssocieResponse(associeRepo.save(a));
    }

    @Transactional
    public void supprimerAssocie(UUID entrepriseId, UUID id) {
        associeRepo.delete(getAssocieOrThrow(entrepriseId, id));
    }

    // ─── Assemblées CRUD ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AssembleeDto.Response> listerAssemblees(UUID entrepriseId) {
        return assembleRepo.findAllWithResolutions(entrepriseId)
                .stream().map(this::toAssembleeResponse).toList();
    }

    @Transactional(readOnly = true)
    public AssembleeDto.Response getAssemblee(UUID entrepriseId, UUID id) {
        AssembleeGenerale a = assembleRepo.findByIdWithResolutions(id, entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Assemblée introuvable"));
        return toAssembleeResponse(a);
    }

    @Transactional
    public AssembleeDto.Response creerAssemblee(UUID entrepriseId, AssembleeDto.CreateRequest req) {
        Entreprise e = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Entreprise introuvable"));

        AssembleeGenerale ag = AssembleeGenerale.builder()
                .entreprise(e)
                .typeAssemblee(req.typeAssemblee() != null ? req.typeAssemblee() : AssembleeGenerale.TypeAssemblee.AG_ORDINAIRE)
                .titre(req.titre())
                .dateAssemblee(req.dateAssemblee())
                .lieu(req.lieu())
                .exerciceConcerne(req.exerciceConcerne())
                .quorumRequis(req.quorumRequis())
                .ordreDuJour(req.ordreDuJour())
                .build();

        if (req.resolutions() != null) {
            for (AssembleeDto.ResolutionRequest rr : req.resolutions()) {
                ag.getResolutions().add(buildResolution(rr, ag));
            }
        }
        return toAssembleeResponse(assembleRepo.save(ag));
    }

    @Transactional
    public AssembleeDto.Response mettreAJourAssemblee(UUID entrepriseId, UUID id, AssembleeDto.UpdateRequest req) {
        AssembleeGenerale ag = assembleRepo.findByIdWithResolutions(id, entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Assemblée introuvable"));

        if (req.titre() != null)           ag.setTitre(req.titre());
        if (req.dateAssemblee() != null)   ag.setDateAssemblee(req.dateAssemblee());
        if (req.lieu() != null)            ag.setLieu(req.lieu());
        if (req.exerciceConcerne() != null) ag.setExerciceConcerne(req.exerciceConcerne());
        if (req.quorumRequis() != null)    ag.setQuorumRequis(req.quorumRequis());
        if (req.quorumAtteint() != null)   ag.setQuorumAtteint(req.quorumAtteint());
        if (req.statut() != null)          ag.setStatut(req.statut());
        if (req.ordreDuJour() != null)     ag.setOrdreDuJour(req.ordreDuJour());
        if (req.procesVerbal() != null)    ag.setProcesVerbal(req.procesVerbal());

        if (req.resolutions() != null) {
            ag.getResolutions().clear();
            for (AssembleeDto.ResolutionRequest rr : req.resolutions()) {
                ag.getResolutions().add(buildResolution(rr, ag));
            }
        }
        return toAssembleeResponse(assembleRepo.save(ag));
    }

    @Transactional
    public void supprimerAssemblee(UUID entrepriseId, UUID id) {
        AssembleeGenerale ag = assembleRepo.findByIdAndEntrepriseId(id, entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Assemblée introuvable"));
        assembleRepo.delete(ag);
    }

    // ─── Portail associé (accès par token) ───────────────────────────────────

    @Transactional(readOnly = true)
    public AssembleeDto.PortailResponse getPortail(UUID token) {
        Associe associe = associeRepo.findByTokenPortail(token)
                .orElseThrow(() -> new EntityNotFoundException("Accès invalide"));

        if (!associe.isActif()) {
            throw new EntityNotFoundException("Accès révoqué");
        }

        UUID entrepriseId = associe.getEntreprise().getId();
        List<AssembleeDto.Response> assemblees = assembleRepo.findAllWithResolutions(entrepriseId)
                .stream().map(this::toAssembleeResponse).toList();

        AssembleeDto.PortailDashboard dashboard = buildDashboard(entrepriseId);

        return new AssembleeDto.PortailResponse(
                associe.getEntreprise().getNom(),
                associe.getPrenom() != null
                        ? associe.getPrenom() + " " + associe.getNom()
                        : associe.getNom(),
                TYPE_LABELS.getOrDefault(associe.getTypeAssocie(), associe.getTypeAssocie().name()),
                associe.getPourcentage(),
                assemblees,
                dashboard
        );
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private AssembleeDto.PortailDashboard buildDashboard(UUID entrepriseId) {
        int currentYear = LocalDate.now().getYear();
        List<AssembleeDto.EvolutionAnnuelle> evolution = new ArrayList<>();

        BigDecimal lastActif = BigDecimal.ZERO;
        BigDecimal lastFonds = BigDecimal.ZERO;
        BigDecimal lastResultat = BigDecimal.ZERO;
        BigDecimal lastCA = BigDecimal.ZERO;

        for (int year = currentYear - 2; year <= currentYear; year++) {
            LocalDate from = LocalDate.of(year, 1, 1);
            LocalDate to   = LocalDate.of(year, 12, 31);
            List<Object[]> balance = ligneRepo.balanceParCompte(entrepriseId, from, to);

            BigDecimal actif     = sumDebit(balance, "2", "3", "4", "5");
            BigDecimal fonds     = sumCredit(balance, "1");
            BigDecimal ca        = sumCredit(balance, "70", "71", "72");
            BigDecimal produits  = sumCredit(balance, "7");
            BigDecimal charges   = sumDebit(balance, "6");
            BigDecimal resultat  = produits.subtract(charges);

            evolution.add(new AssembleeDto.EvolutionAnnuelle(year, actif, fonds, resultat, ca));

            if (year == currentYear) {
                lastActif = actif; lastFonds = fonds; lastResultat = resultat; lastCA = ca;
            }
        }

        return new AssembleeDto.PortailDashboard(lastActif, lastFonds, lastResultat, lastCA, currentYear, evolution);
    }

    private BigDecimal sumDebit(List<Object[]> rows, String... prefixes) {
        BigDecimal sum = BigDecimal.ZERO;
        for (Object[] r : rows) {
            String num = (String) r[0];
            for (String p : prefixes) {
                if (num.startsWith(p)) {
                    BigDecimal d = (BigDecimal) r[3], c = (BigDecimal) r[4];
                    sum = sum.add(d.subtract(c).max(BigDecimal.ZERO));
                    break;
                }
            }
        }
        return sum;
    }

    private BigDecimal sumCredit(List<Object[]> rows, String... prefixes) {
        BigDecimal sum = BigDecimal.ZERO;
        for (Object[] r : rows) {
            String num = (String) r[0];
            for (String p : prefixes) {
                if (num.startsWith(p)) {
                    BigDecimal d = (BigDecimal) r[3], c = (BigDecimal) r[4];
                    sum = sum.add(c.subtract(d).max(BigDecimal.ZERO));
                    break;
                }
            }
        }
        return sum;
    }

    private Associe getAssocieOrThrow(UUID entrepriseId, UUID id) {
        return associeRepo.findByIdAndEntrepriseId(id, entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Associé introuvable"));
    }

    private Resolution buildResolution(AssembleeDto.ResolutionRequest rr, AssembleeGenerale ag) {
        return Resolution.builder()
                .assemblee(ag)
                .numeroOrdre(rr.numeroOrdre())
                .titre(rr.titre())
                .texte(rr.texte())
                .typeResolution(rr.typeResolution() != null ? rr.typeResolution() : Resolution.TypeResolution.AUTRE)
                .statut(rr.statut() != null ? rr.statut() : Resolution.StatutResolution.EN_ATTENTE)
                .votesPour(rr.votesPour())
                .votesContre(rr.votesContre())
                .votesAbstention(rr.votesAbstention())
                .build();
    }

    private AssocieDto.Response toAssocieResponse(Associe a) {
        String url = baseUrl + "/portail-associe/" + a.getTokenPortail();
        return new AssocieDto.Response(
                a.getId(), a.getNom(), a.getPrenom(), a.getEmail(), a.getTelephone(),
                a.getTypeAssocie(), TYPE_LABELS.getOrDefault(a.getTypeAssocie(), a.getTypeAssocie().name()),
                a.getApport(), a.getPourcentage(), a.getDateEntree(), a.getDateSortie(),
                a.isActif(), a.getTokenPortail(), url, a.getNotes(), a.getCreatedAt()
        );
    }

    private AssembleeDto.Response toAssembleeResponse(AssembleeGenerale ag) {
        List<AssembleeDto.ResolutionResponse> resolutions = ag.getResolutions().stream()
                .map(r -> new AssembleeDto.ResolutionResponse(
                        r.getId(), r.getNumeroOrdre(), r.getTitre(), r.getTexte(),
                        r.getTypeResolution(), RES_TYPE_LABELS.getOrDefault(r.getTypeResolution(), r.getTypeResolution().name()),
                        r.getStatut(), RES_STATUT_LABELS.getOrDefault(r.getStatut(), r.getStatut().name()),
                        r.getVotesPour(), r.getVotesContre(), r.getVotesAbstention(),
                        r.getCreatedAt()))
                .toList();
        return new AssembleeDto.Response(
                ag.getId(),
                ag.getTypeAssemblee(), ASSEMBLEE_LABELS.getOrDefault(ag.getTypeAssemblee(), ag.getTypeAssemblee().name()),
                ag.getTitre(), ag.getDateAssemblee(), ag.getLieu(), ag.getExerciceConcerne(),
                ag.getQuorumRequis(), ag.getQuorumAtteint(),
                ag.getStatut(), STATUT_AG_LABELS.getOrDefault(ag.getStatut(), ag.getStatut().name()),
                ag.getOrdreDuJour(), ag.getProcesVerbal(),
                resolutions, ag.getCreatedAt(), ag.getUpdatedAt()
        );
    }
}
