package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.Amortissement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AmortissementRepository extends JpaRepository<Amortissement, UUID> {

    List<Amortissement> findByImmobilisationIdOrderByExerciceAsc(UUID immobilisationId);

    Optional<Amortissement> findByImmobilisationIdAndExercice(UUID immobilisationId, int exercice);

    boolean existsByImmobilisationIdAndExercice(UUID immobilisationId, int exercice);

    @Query("""
            SELECT COALESCE(SUM(a.dotation), 0)
            FROM Amortissement a
            WHERE a.immobilisation.id = :immoId
              AND a.exercice < :exercice
            """)
    BigDecimal cumulAvantExercice(@Param("immoId") UUID immoId, @Param("exercice") int exercice);

    @Query("""
            SELECT COALESCE(SUM(a.dotation), 0)
            FROM Amortissement a
            JOIN a.immobilisation i
            WHERE i.entreprise.id = :eid AND i.statut = 'ACTIF'
            """)
    BigDecimal totalCumulEntreprise(@Param("eid") UUID entrepriseId);

    @Query("""
            SELECT i.categorie, COALESCE(SUM(a.dotation), 0)
            FROM Amortissement a JOIN a.immobilisation i
            WHERE i.entreprise.id = :eid AND i.statut = 'ACTIF'
            GROUP BY i.categorie
            """)
    List<Object[]> cumulParCategorie(@Param("eid") UUID eid);
}
