package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.NoteFrais;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NoteFraisRepository extends JpaRepository<NoteFrais, UUID> {

    @Query("""
        SELECT n FROM NoteFrais n
        WHERE n.entreprise.id = :eid
        ORDER BY n.createdAt DESC
        """)
    List<NoteFrais> findAllByEntreprise(@Param("eid") UUID eid);

    @Query("""
        SELECT n FROM NoteFrais n
        WHERE n.entreprise.id = :eid
          AND n.collaborateur.id = :uid
        ORDER BY n.createdAt DESC
        """)
    List<NoteFrais> findByCollaborateur(@Param("eid") UUID eid, @Param("uid") UUID uid);

    @Query("""
        SELECT n FROM NoteFrais n
        WHERE n.entreprise.id = :eid
          AND n.statut = 'SOUMISE'
        ORDER BY n.createdAt ASC
        """)
    List<NoteFrais> findSoumises(@Param("eid") UUID eid);

    @Query("""
        SELECT n FROM NoteFrais n
        WHERE n.id = :id AND n.entreprise.id = :eid
        """)
    Optional<NoteFrais> findByIdAndEntreprise(@Param("id") UUID id, @Param("eid") UUID eid);

    @Query("SELECT COUNT(n) FROM NoteFrais n WHERE n.entreprise.id = :eid AND n.statut = 'SOUMISE'")
    long countSoumises(@Param("eid") UUID eid);

    @Query("SELECT COALESCE(SUM(n.montant), 0) FROM NoteFrais n WHERE n.entreprise.id = :eid AND n.statut = 'SOUMISE'")
    java.math.BigDecimal sumMontantSoumises(@Param("eid") UUID eid);

    @Query("""
        SELECT COUNT(n) FROM NoteFrais n
        WHERE n.entreprise.id = :eid AND n.statut = 'REMBOURSEE'
          AND n.dateDebut >= :debut AND n.dateDebut <= :fin
        """)
    long countRembourseesInPeriod(@Param("eid") UUID eid,
                                   @Param("debut") java.time.LocalDate debut,
                                   @Param("fin") java.time.LocalDate fin);

    @Query("""
        SELECT COALESCE(SUM(n.montant), 0) FROM NoteFrais n
        WHERE n.entreprise.id = :eid AND n.statut = 'REMBOURSEE'
          AND n.dateDebut >= :debut AND n.dateDebut <= :fin
        """)
    java.math.BigDecimal sumMontantRembourseesInPeriod(@Param("eid") UUID eid,
                                                        @Param("debut") java.time.LocalDate debut,
                                                        @Param("fin") java.time.LocalDate fin);

    @Query("""
        SELECT n.statut, COUNT(n), COALESCE(SUM(n.montant), 0)
        FROM NoteFrais n
        WHERE n.entreprise.id = :eid AND YEAR(n.dateDebut) = :exercice
        GROUP BY n.statut
        """)
    List<Object[]> statsParStatut(@Param("eid") UUID eid, @Param("exercice") int exercice);

    @Query("""
        SELECT n.categorie, COUNT(n), COALESCE(SUM(n.montant), 0)
        FROM NoteFrais n
        WHERE n.entreprise.id = :eid AND YEAR(n.dateDebut) = :exercice
        GROUP BY n.categorie
        """)
    List<Object[]> statsParCategorie(@Param("eid") UUID eid, @Param("exercice") int exercice);

    @Query("""
        SELECT MONTH(n.dateDebut), COUNT(n), COALESCE(SUM(n.montant), 0)
        FROM NoteFrais n
        WHERE n.entreprise.id = :eid AND n.statut = 'REMBOURSEE'
          AND YEAR(n.dateDebut) = :exercice
        GROUP BY MONTH(n.dateDebut)
        ORDER BY MONTH(n.dateDebut)
        """)
    List<Object[]> remboursementsMensuels(@Param("eid") UUID eid, @Param("exercice") int exercice);
}
