package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.CompteComptable;
import com.edefence.ecompta.domain.EcritureComptable;
import com.edefence.ecompta.domain.LigneEcriture;
import com.edefence.ecompta.domain.Utilisateur;
import com.edefence.ecompta.dto.ecriture.EcritureDto;
import com.edefence.ecompta.dto.ecriture.LigneDto;
import com.edefence.ecompta.repository.CompteComptableRepository;
import com.edefence.ecompta.repository.EcritureComptableRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EcritureService {

    private final EcritureComptableRepository ecritureRepo;
    private final CompteComptableRepository compteRepo;

    @Transactional(readOnly = true)
    public Page<EcritureDto.Response> findAll(UUID entrepriseId, LocalDate from, LocalDate to, Pageable pageable) {
        Page<EcritureComptable> page = (from != null && to != null)
                ? ecritureRepo.findByEntrepriseIdAndDateEcritureBetweenOrderByDateEcritureDesc(entrepriseId, from, to, pageable)
                : ecritureRepo.findByEntrepriseIdOrderByDateEcritureDesc(entrepriseId, pageable);
        return page.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public EcritureDto.Response findOne(UUID id, UUID entrepriseId) {
        return toResponse(findOrThrow(id, entrepriseId));
    }

    @Transactional
    public EcritureDto.Response create(UUID entrepriseId, EcritureDto.Request dto,
                                       Utilisateur auteur, com.edefence.ecompta.domain.Entreprise entreprise) {
        if (ecritureRepo.existsByNumeroPieceAndEntrepriseId(dto.numeroPiece(), entrepriseId)) {
            throw new IllegalStateException("Numéro de pièce déjà utilisé : " + dto.numeroPiece());
        }

        validatePartieDuble(dto.lignes());

        EcritureComptable ecriture = EcritureComptable.builder()
                .numeroPiece(dto.numeroPiece())
                .dateEcriture(dto.dateEcriture())
                .libelle(dto.libelle())
                .journal(dto.journal())
                .entreprise(entreprise)
                .createdBy(auteur)
                .build();

        for (LigneDto.Request l : dto.lignes()) {
            CompteComptable compte = compteRepo.findById(l.compteId())
                    .orElseThrow(() -> new EntityNotFoundException("Compte introuvable : " + l.compteId()));
            if (!compte.getEntreprise().getId().equals(entrepriseId)) {
                throw new IllegalArgumentException("Compte n'appartient pas à cette entreprise : " + l.compteId());
            }
            ecriture.getLignes().add(LigneEcriture.builder()
                    .ecriture(ecriture)
                    .compte(compte)
                    .libelle(l.libelle())
                    .debit(l.debit())
                    .credit(l.credit())
                    .build());
        }

        return toResponse(ecritureRepo.save(ecriture));
    }

    @Transactional
    public EcritureDto.Response valider(UUID id, UUID entrepriseId) {
        EcritureComptable ecriture = findOrThrow(id, entrepriseId);
        if (ecriture.getStatut() != EcritureComptable.Statut.BROUILLON) {
            throw new IllegalStateException("Seul un brouillon peut être validé");
        }
        ecriture.setStatut(EcritureComptable.Statut.VALIDEE);
        return toResponse(ecritureRepo.save(ecriture));
    }

    @Transactional
    public void supprimer(UUID id, UUID entrepriseId) {
        EcritureComptable ecriture = findOrThrow(id, entrepriseId);
        if (ecriture.getStatut() != EcritureComptable.Statut.BROUILLON) {
            throw new IllegalStateException("Seule une écriture en brouillon peut être supprimée");
        }
        ecritureRepo.delete(ecriture);
    }

    private void validatePartieDuble(List<LigneDto.Request> lignes) {
        BigDecimal totalDebit  = lignes.stream().map(LigneDto.Request::debit).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCredit = lignes.stream().map(LigneDto.Request::credit).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new IllegalArgumentException(
                    "Déséquilibre comptable : débit=" + totalDebit + " ≠ crédit=" + totalCredit);
        }
    }

    private EcritureComptable findOrThrow(UUID id, UUID entrepriseId) {
        EcritureComptable e = ecritureRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Écriture introuvable : " + id));
        if (!e.getEntreprise().getId().equals(entrepriseId)) {
            throw new EntityNotFoundException("Écriture introuvable : " + id);
        }
        return e;
    }

    private EcritureDto.Response toResponse(EcritureComptable e) {
        List<LigneDto.Response> lignes = e.getLignes().stream()
                .map(l -> new LigneDto.Response(
                        l.getId(),
                        l.getCompte().getId(),
                        l.getCompte().getNumero(),
                        l.getCompte().getIntitule(),
                        l.getLibelle(),
                        l.getDebit(),
                        l.getCredit()))
                .toList();
        return new EcritureDto.Response(
                e.getId(), e.getNumeroPiece(), e.getDateEcriture(),
                e.getLibelle(), e.getJournal(), e.getStatut(), lignes, e.getCreatedAt());
    }
}
