package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.DeclarationIs;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DeclarationIsRepository extends JpaRepository<DeclarationIs, UUID> {

    Optional<DeclarationIs> findByEntrepriseIdAndExercice(UUID entrepriseId, int exercice);

    List<DeclarationIs> findByEntrepriseIdOrderByExerciceDesc(UUID entrepriseId);

    @Query("""
            SELECT COALESCE(SUM(l.debit - l.credit), 0)
            FROM LigneEcriture l JOIN l.compte c JOIN l.ecriture e
            WHERE e.entreprise.id = :eid AND e.statut = 'VALIDEE'
            AND c.numero LIKE '7%'
            AND e.dateEcriture >= :from AND e.dateEcriture <= :to
            """)
    java.math.BigDecimal sumChiffreAffaires(
            @Param("eid") UUID eid,
            @Param("from") java.time.LocalDate from,
            @Param("to") java.time.LocalDate to);
}
