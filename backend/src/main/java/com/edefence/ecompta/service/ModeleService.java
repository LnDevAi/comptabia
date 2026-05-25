package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.*;
import com.edefence.ecompta.dto.modele.ModeleDto;
import com.edefence.ecompta.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ModeleService {

    private final ModeleEcritureRepository modeleRepo;
    private final CompteComptableRepository compteRepo;
    private final EcritureComptableRepository ecritureRepo;
    private final EntrepriseRepository entrepriseRepo;
    private final UtilisateurRepository utilisateurRepo;

    @Transactional(readOnly = true)
    public List<ModeleDto.Response> lister(UUID entrepriseId) {
        return modeleRepo.findByEntrepriseIdWithLignes(entrepriseId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ModeleDto.Response getOne(UUID entrepriseId, UUID id) {
        return toResponse(findOrThrow(entrepriseId, id));
    }

    @Transactional
    public ModeleDto.Response creer(UUID entrepriseId, ModeleDto.Request req) {
        if (modeleRepo.existsByNomAndEntrepriseId(req.nom(), entrepriseId))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Un modèle nommé « " + req.nom() + " » existe déjà.");

        validateLignes(req);

        Entreprise entreprise = entrepriseRepo.getReferenceById(entrepriseId);
        ModeleEcriture modele = ModeleEcriture.builder()
                .entreprise(entreprise)
                .nom(req.nom())
                .libelleDefaut(req.libelleDefaut())
                .journal(req.journal() != null ? req.journal() : EcritureComptable.Journal.OD)
                .build();

        buildLignes(modele, req.lignes(), entrepriseId);
        return toResponse(modeleRepo.save(modele));
    }

    @Transactional
    public ModeleDto.Response modifier(UUID entrepriseId, UUID id, ModeleDto.Request req) {
        ModeleEcriture modele = findOrThrow(entrepriseId, id);

        if (modeleRepo.existsByNomAndEntrepriseIdAndIdNot(req.nom(), entrepriseId, id))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Un modèle nommé « " + req.nom() + " » existe déjà.");

        validateLignes(req);

        modele.setNom(req.nom());
        modele.setLibelleDefaut(req.libelleDefaut());
        if (req.journal() != null) modele.setJournal(req.journal());
        modele.getLignes().clear();
        buildLignes(modele, req.lignes(), entrepriseId);
        return toResponse(modeleRepo.save(modele));
    }

    @Transactional
    public void supprimer(UUID entrepriseId, UUID id) {
        modeleRepo.delete(findOrThrow(entrepriseId, id));
    }

    @Transactional
    public ModeleDto.Response instancier(UUID entrepriseId, UUID id,
                                          ModeleDto.InstancierRequest req,
                                          String userEmail) {
        ModeleEcriture modele = findOrThrow(entrepriseId, id);

        LocalDate date = req.date() != null ? req.date() : LocalDate.now();
        String numeroPiece = req.numeroPiece();

        if (numeroPiece == null || numeroPiece.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le numéro de pièce est requis.");
        if (ecritureRepo.existsByNumeroPieceAndEntrepriseId(numeroPiece, entrepriseId))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Numéro de pièce déjà utilisé : " + numeroPiece);
        if (modele.getLignes().isEmpty())
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Le modèle ne contient aucune ligne.");

        Entreprise entreprise = entrepriseRepo.getReferenceById(entrepriseId);
        Utilisateur auteur = utilisateurRepo.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable."));

        EcritureComptable ecriture = EcritureComptable.builder()
                .numeroPiece(numeroPiece)
                .dateEcriture(date)
                .libelle(modele.getLibelleDefaut() != null ? modele.getLibelleDefaut() : modele.getNom())
                .journal(modele.getJournal())
                .statut(EcritureComptable.Statut.BROUILLON)
                .entreprise(entreprise)
                .createdBy(auteur)
                .build();

        for (LigneModele lm : modele.getLignes()) {
            ecriture.getLignes().add(LigneEcriture.builder()
                    .ecriture(ecriture)
                    .compte(lm.getCompte())
                    .libelle(lm.getLibelle())
                    .debit(lm.getDebit())
                    .credit(lm.getCredit())
                    .build());
        }

        ecritureRepo.save(ecriture);
        return toResponse(modele);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private ModeleEcriture findOrThrow(UUID entrepriseId, UUID id) {
        return modeleRepo.findByIdAndEntrepriseId(id, entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Modèle introuvable."));
    }

    private void validateLignes(ModeleDto.Request req) {
        if (req.lignes() == null || req.lignes().isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Le modèle doit contenir au moins une ligne.");
        BigDecimal sumD = req.lignes().stream().map(ModeleDto.LigneRequest::debit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal sumC = req.lignes().stream().map(ModeleDto.LigneRequest::credit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (sumD.compareTo(sumC) != 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Déséquilibre : Débit=" + sumD + " ≠ Crédit=" + sumC);
    }

    private void buildLignes(ModeleEcriture modele, List<ModeleDto.LigneRequest> lignes, UUID entrepriseId) {
        for (int i = 0; i < lignes.size(); i++) {
            ModeleDto.LigneRequest l = lignes.get(i);
            CompteComptable compte = compteRepo.findById(l.compteId())
                    .filter(c -> c.getEntreprise().getId().equals(entrepriseId))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Compte introuvable : " + l.compteId()));
            modele.getLignes().add(LigneModele.builder()
                    .modele(modele)
                    .compte(compte)
                    .libelle(l.libelle())
                    .debit(l.debit() != null ? l.debit() : BigDecimal.ZERO)
                    .credit(l.credit() != null ? l.credit() : BigDecimal.ZERO)
                    .ordre(l.ordre() > 0 ? l.ordre() : i)
                    .build());
        }
    }

    private ModeleDto.Response toResponse(ModeleEcriture m) {
        List<ModeleDto.LigneResponse> lignes = m.getLignes().stream()
                .map(l -> new ModeleDto.LigneResponse(
                        l.getId(), l.getCompte().getId(),
                        l.getCompte().getNumero(), l.getCompte().getIntitule(),
                        l.getLibelle(), l.getDebit(), l.getCredit(), l.getOrdre()))
                .toList();
        return new ModeleDto.Response(m.getId(), m.getNom(), m.getLibelleDefaut(),
                m.getJournal().name(), lignes, m.getCreatedAt());
    }
}
