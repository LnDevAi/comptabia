package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.DocumentReglementaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DocumentReglementaireRepository extends JpaRepository<DocumentReglementaire, UUID> {

    List<DocumentReglementaire> findByEntrepriseIdOrderByDateEcheanceAscCreatedAtDesc(UUID entrepriseId);

    Optional<DocumentReglementaire> findByIdAndEntrepriseId(UUID id, UUID entrepriseId);

    @Query("""
            SELECT d FROM DocumentReglementaire d
            WHERE d.entreprise.id = :eid
              AND d.dateEcheance IS NOT NULL
              AND d.dateEcheance <= :horizon
              AND d.statut NOT IN (com.edefence.comptabia.domain.DocumentReglementaire$Statut.VALIDE,
                                   com.edefence.comptabia.domain.DocumentReglementaire$Statut.EXPIRE)
            ORDER BY d.dateEcheance ASC
            """)
    List<DocumentReglementaire> findEcheancesProches(@Param("eid") UUID entrepriseId,
                                                      @Param("horizon") LocalDate horizon);
}
