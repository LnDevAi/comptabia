package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.*;
import com.edefence.ecompta.dto.immobilisation.ImmobilisationDto;
import com.edefence.ecompta.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImmobilisationService {

    private final ImmobilisationRepository    immoRepo;
    private final AmortissementRepository     amortRepo;
    private final EntrepriseRepository        entrepriseRepo;
    private final EcritureComptableRepository ecritureRepo;
    private final CompteComptableRepository   compteRepo;
    private final UtilisateurRepository       utilisateurRepo;

    // ─── Queries ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ImmobilisationDto.Response> findAll(UUID entrepriseId,
                                                     Immobilisation.Categorie categorie,
                                                     Immobilisation.Statut statut,
                                                     String search,
                                                     Pageable pageable) {
        String s = (search != null && !search.isBlank()) ? search.trim() : null;
        return immoRepo.search(entrepriseId, categorie, statut, s, pageable)
                       .map(i -> toResponse(i, cumulFor(i)));
    }

    @Transactional(readOnly = true)
    public ImmobilisationDto.PlanAmortissement planAmortissement(UUID id, UUID entrepriseId) {
        Immobilisation immo = findOrThrow(id, entrepriseId);
        List<ImmobilisationDto.LignePlan> lignes = buildPlan(immo);
        return new ImmobilisationDto.PlanAmortissement(
                immo.getId(), immo.getCode(), immo.getDesignation(),
                immo.getValeurBrute(), immo.getDureeAmortissement(), lignes);
    }

    @Transactional(readOnly = true)
    public ImmobilisationDto.Stats stats(UUID entrepriseId) {
        long total         = immoRepo.countActifs(entrepriseId);
        BigDecimal brute   = immoRepo.sumValeurBrute(entrepriseId);
        BigDecimal cumul   = amortRepo.totalCumulEntreprise(entrepriseId);
        BigDecimal vnc     = brute.subtract(cumul);
        return new ImmobilisationDto.Stats(total, brute, cumul, vnc);
    }

    // ─── Mutations ────────────────────────────────────────────────────────────

    @Transactional
    public ImmobilisationDto.Response create(UUID entrepriseId, ImmobilisationDto.Request dto) {
        if (immoRepo.existsByCodeAndEntrepriseId(dto.code(), entrepriseId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Une immobilisation avec le code « " + dto.code() + " » existe déjà.");
        }
        Entreprise entreprise = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entreprise introuvable"));

        Immobilisation immo = Immobilisation.builder()
                .entreprise(entreprise)
                .code(dto.code().toUpperCase().trim())
                .designation(dto.designation().trim())
                .categorie(dto.categorie())
                .compteNumero(dto.compteNumero())
                .compteAmortNumero(dto.compteAmortNumero())
                .dateAcquisition(dto.dateAcquisition())
                .valeurBrute(dto.valeurBrute())
                .dureeAmortissement(dto.dureeAmortissement())
                .build();

        return toResponse(immoRepo.save(immo), BigDecimal.ZERO);
    }

    @Transactional
    public ImmobilisationDto.Response update(UUID id, UUID entrepriseId, ImmobilisationDto.Request dto) {
        Immobilisation immo = findOrThrow(id, entrepriseId);

        if (!immo.getCode().equalsIgnoreCase(dto.code()) &&
                immoRepo.existsByCodeAndEntrepriseId(dto.code(), entrepriseId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Une immobilisation avec le code « " + dto.code() + " » existe déjà.");
        }
        if (immo.getStatut() != Immobilisation.Statut.ACTIF) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Seule une immobilisation active peut être modifiée.");
        }

        immo.setCode(dto.code().toUpperCase().trim());
        immo.setDesignation(dto.designation().trim());
        immo.setCategorie(dto.categorie());
        immo.setCompteNumero(dto.compteNumero());
        immo.setCompteAmortNumero(dto.compteAmortNumero());
        immo.setDateAcquisition(dto.dateAcquisition());
        immo.setValeurBrute(dto.valeurBrute());
        immo.setDureeAmortissement(dto.dureeAmortissement());

        return toResponse(immoRepo.save(immo), cumulFor(immo));
    }

    @Transactional
    public ImmobilisationDto.Response ceder(UUID id, UUID entrepriseId, LocalDate dateCession) {
        Immobilisation immo = findOrThrow(id, entrepriseId);
        if (immo.getStatut() != Immobilisation.Statut.ACTIF) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Immobilisation déjà cédée ou retirée.");
        }
        immo.setStatut(Immobilisation.Statut.CEDE);
        immo.setDateCession(dateCession);
        return toResponse(immoRepo.save(immo), cumulFor(immo));
    }

    @Transactional
    public void delete(UUID id, UUID entrepriseId) {
        Immobilisation immo = findOrThrow(id, entrepriseId);
        if (!immo.getAmortissements().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Impossible de supprimer une immobilisation ayant des amortissements enregistrés.");
        }
        immoRepo.delete(immo);
    }

    // ─── Dotation ─────────────────────────────────────────────────────────────

    @Transactional
    public ImmobilisationDto.DotationResult doterExercice(UUID id, UUID entrepriseId,
                                                           int exercice, String userEmail) {
        Immobilisation immo = findOrThrow(id, entrepriseId);

        if (immo.getStatut() != Immobilisation.Statut.ACTIF) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Seule une immobilisation active peut être dotée.");
        }
        if (amortRepo.existsByImmobilisationIdAndExercice(immo.getId(), exercice)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La dotation pour l'exercice " + exercice + " a déjà été enregistrée.");
        }

        BigDecimal dotation = immo.getValeurBrute()
                .divide(BigDecimal.valueOf(immo.getDureeAmortissement()), 2, RoundingMode.HALF_UP);

        BigDecimal cumulAvant = amortRepo.cumulAvantExercice(immo.getId(), exercice);
        BigDecimal nouveauCumul = cumulAvant.add(dotation);

        // Cap at valeur brute (last year adjustment)
        if (nouveauCumul.compareTo(immo.getValeurBrute()) > 0) {
            dotation = immo.getValeurBrute().subtract(cumulAvant);
            nouveauCumul = immo.getValeurBrute();
        }
        BigDecimal vnc = immo.getValeurBrute().subtract(nouveauCumul);

        // Generate OD journal entry if accounts are configured
        UUID ecritureId = null;
        if (immo.getCompteAmortNumero() != null && !immo.getCompteAmortNumero().isBlank()) {
            ecritureId = genererEcritureAmortissement(immo, exercice, dotation, userEmail, entrepriseId);
        }

        Amortissement amort = Amortissement.builder()
                .immobilisation(immo)
                .exercice(exercice)
                .dotation(dotation)
                .cumulAmortissement(nouveauCumul)
                .valeurNette(vnc)
                .ecritureId(ecritureId)
                .build();

        amortRepo.save(amort);
        log.info("Dotation immo={} exercice={} dotation={}", immo.getCode(), exercice, dotation);

        return new ImmobilisationDto.DotationResult(immo.getId(), exercice, dotation, ecritureId);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private UUID genererEcritureAmortissement(Immobilisation immo, int exercice,
                                               BigDecimal dotation, String userEmail,
                                               UUID entrepriseId) {
        // Compte d'amortissement (CR) — ex: 281000
        CompteComptable compteAmort = compteRepo
                .findByNumeroAndEntrepriseId(immo.getCompteAmortNumero(), entrepriseId)
                .orElse(null);
        if (compteAmort == null) return null;

        // Compte de dotation (DR) — SYSCOHADA: remplace "2" par "68" sur les 2 premiers chiffres
        // e.g., 241000 → 681000 ; ou utilise 6811 par défaut si non calculable
        String numDotation = computeDotationAccount(immo.getCompteAmortNumero());
        CompteComptable compteDotation = compteRepo
                .findByNumeroAndEntrepriseId(numDotation, entrepriseId)
                .orElse(null);
        if (compteDotation == null) return null;

        Utilisateur auteur = utilisateurRepo.findByEmail(userEmail).orElse(null);
        if (auteur == null) return null;

        String numeroPiece = "AMT-" + immo.getCode() + "-" + exercice;
        if (ecritureRepo.existsByNumeroPieceAndEntrepriseId(numeroPiece, entrepriseId)) return null;

        Entreprise entreprise = immo.getEntreprise();

        EcritureComptable ecriture = EcritureComptable.builder()
                .numeroPiece(numeroPiece)
                .dateEcriture(LocalDate.of(exercice, 12, 31))
                .libelle("Dotation aux amortissements — " + immo.getDesignation() + " (" + exercice + ")")
                .journal(EcritureComptable.Journal.OD)
                .statut(EcritureComptable.Statut.BROUILLON)
                .entreprise(entreprise)
                .createdBy(auteur)
                .build();

        ecriture.getLignes().add(LigneEcriture.builder()
                .ecriture(ecriture)
                .compte(compteDotation)
                .libelle("Dotation amortissement " + immo.getDesignation())
                .debit(dotation)
                .credit(BigDecimal.ZERO)
                .build());

        ecriture.getLignes().add(LigneEcriture.builder()
                .ecriture(ecriture)
                .compte(compteAmort)
                .libelle("Amortissement " + immo.getDesignation())
                .debit(BigDecimal.ZERO)
                .credit(dotation)
                .build());

        return ecritureRepo.save(ecriture).getId();
    }

    private String computeDotationAccount(String compteAmortNumero) {
        // SYSCOHADA: 281xxx → 6811xx, 282xxx → 6812xx, etc.
        // Safe fallback: strip leading "28" and prepend "681"
        if (compteAmortNumero != null && compteAmortNumero.startsWith("28")) {
            return "681" + compteAmortNumero.substring(2);
        }
        return "6811";
    }

    private List<ImmobilisationDto.LignePlan> buildPlan(Immobilisation immo) {
        BigDecimal dotation = immo.getValeurBrute()
                .divide(BigDecimal.valueOf(immo.getDureeAmortissement()), 2, RoundingMode.HALF_UP);
        int anneeDebut = immo.getDateAcquisition().getYear();

        List<Amortissement> existing = amortRepo.findByImmobilisationIdOrderByExerciceAsc(immo.getId());
        List<ImmobilisationDto.LignePlan> plan = new ArrayList<>();

        BigDecimal cumul = BigDecimal.ZERO;
        for (int i = 0; i < immo.getDureeAmortissement(); i++) {
            int exercice = anneeDebut + i;
            BigDecimal dot = dotation;
            BigDecimal newCumul = cumul.add(dot);
            if (newCumul.compareTo(immo.getValeurBrute()) > 0) {
                dot = immo.getValeurBrute().subtract(cumul);
                newCumul = immo.getValeurBrute();
            }
            cumul = newCumul;

            boolean comptabilisee = existing.stream().anyMatch(a -> a.getExercice() == exercice);
            plan.add(new ImmobilisationDto.LignePlan(
                    exercice, dot, cumul, immo.getValeurBrute().subtract(cumul), comptabilisee));

            if (cumul.compareTo(immo.getValeurBrute()) >= 0) break;
        }
        return plan;
    }

    private BigDecimal cumulFor(Immobilisation immo) {
        return amortRepo.findByImmobilisationIdOrderByExerciceAsc(immo.getId())
                .stream()
                .map(Amortissement::getDotation)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Immobilisation findOrThrow(UUID id, UUID entrepriseId) {
        return immoRepo.findByIdAndEntrepriseId(id, entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Immobilisation introuvable"));
    }

    private ImmobilisationDto.Response toResponse(Immobilisation i, BigDecimal cumul) {
        return new ImmobilisationDto.Response(
                i.getId(), i.getCode(), i.getDesignation(), i.getCategorie().name(),
                i.getCompteNumero(), i.getCompteAmortNumero(),
                i.getDateAcquisition(), i.getValeurBrute(),
                i.getDureeAmortissement(), i.getMethode().name(), i.getStatut().name(),
                i.getDateCession(), cumul, i.getValeurBrute().subtract(cumul),
                i.getCreatedAt()
        );
    }
}
