package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.Pointage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PointageRepository extends JpaRepository<Pointage, UUID> {

    @Query("""
        SELECT p FROM Pointage p
        WHERE p.entreprise.id = :eid
          AND p.datePointage >= :debut AND p.datePointage <= :fin
        ORDER BY p.datePointage DESC, p.collaborateur.nom ASC
        """)
    List<Pointage> findByPeriode(@Param("eid") UUID eid,
                                  @Param("debut") LocalDate debut,
                                  @Param("fin") LocalDate fin);

    @Query("""
        SELECT p FROM Pointage p
        WHERE p.entreprise.id = :eid AND p.collaborateur.id = :collabId
          AND p.datePointage >= :debut AND p.datePointage <= :fin
        ORDER BY p.datePointage ASC
        """)
    List<Pointage> findByCollaborateurAndPeriode(@Param("eid") UUID eid,
                                                  @Param("collabId") UUID collabId,
                                                  @Param("debut") LocalDate debut,
                                                  @Param("fin") LocalDate fin);

    @Query("SELECT p FROM Pointage p WHERE p.id = :id AND p.entreprise.id = :eid")
    Optional<Pointage> findByIdAndEntreprise(@Param("id") UUID id, @Param("eid") UUID eid);

    @Query("SELECT COUNT(p) FROM Pointage p WHERE p.entreprise.id = :eid AND p.collaborateur.id = :collabId AND p.type = 'RETARD' AND p.datePointage >= :debut AND p.datePointage <= :fin")
    long countRetards(@Param("eid") UUID eid, @Param("collabId") UUID collabId,
                      @Param("debut") LocalDate debut, @Param("fin") LocalDate fin);

    boolean existsByEntrepriseIdAndCollaborateurIdAndDatePointage(UUID entrepriseId, UUID collaborateurId, LocalDate datePointage);
}
