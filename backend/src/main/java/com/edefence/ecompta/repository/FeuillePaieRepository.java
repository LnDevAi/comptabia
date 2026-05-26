package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.FeuillePaie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FeuillePaieRepository extends JpaRepository<FeuillePaie, UUID> {

    List<FeuillePaie> findByEntrepriseIdAndExerciceOrderByMoisAsc(UUID entrepriseId, int exercice);

    Optional<FeuillePaie> findByIdAndEntrepriseId(UUID id, UUID entrepriseId);

    Optional<FeuillePaie> findByEntrepriseIdAndExerciceAndMois(UUID entrepriseId, int exercice, int mois);

    @Query("""
            SELECT COALESCE(SUM(f.masseSalarialeBrute), 0)
            FROM FeuillePaie f
            WHERE f.entreprise.id = :eid AND f.exercice = :exercice
            AND f.statut = 'COMPTABILISEE'
            """)
    java.math.BigDecimal sumMasseSalarialeByExercice(@Param("eid") UUID eid,
                                                      @Param("exercice") int exercice);

    @Query("""
            SELECT COALESCE(SUM(f.netAPayer), 0)
            FROM FeuillePaie f
            WHERE f.entreprise.id = :eid AND f.exercice = :exercice
            AND f.statut = 'COMPTABILISEE'
            """)
    java.math.BigDecimal sumNetAPayerByExercice(@Param("eid") UUID eid,
                                                 @Param("exercice") int exercice);
}
