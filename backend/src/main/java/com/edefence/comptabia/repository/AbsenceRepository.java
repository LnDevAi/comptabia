package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.Absence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AbsenceRepository extends JpaRepository<Absence, UUID> {

    @Query("SELECT a FROM Absence a WHERE a.entreprise.id = :eid ORDER BY a.dateDebut DESC")
    List<Absence> findAllByEntreprise(@Param("eid") UUID eid);

    @Query("""
        SELECT a FROM Absence a
        WHERE a.entreprise.id = :eid AND a.collaborateur.id = :collabId
          AND a.dateDebut >= :debut AND a.dateFin <= :fin
        ORDER BY a.dateDebut ASC
        """)
    List<Absence> findByCollaborateurAndPeriode(@Param("eid") UUID eid,
                                                 @Param("collabId") UUID collabId,
                                                 @Param("debut") LocalDate debut,
                                                 @Param("fin") LocalDate fin);

    @Query("SELECT a FROM Absence a WHERE a.id = :id AND a.entreprise.id = :eid")
    Optional<Absence> findByIdAndEntreprise(@Param("id") UUID id, @Param("eid") UUID eid);

    @Query("""
        SELECT COUNT(a) FROM Absence a
        WHERE a.entreprise.id = :eid AND a.collaborateur.id = :collabId
          AND a.statut = 'APPROUVEE'
          AND a.dateDebut >= :debut AND a.dateFin <= :fin
        """)
    long countApprouvees(@Param("eid") UUID eid, @Param("collabId") UUID collabId,
                          @Param("debut") LocalDate debut, @Param("fin") LocalDate fin);
}
