package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.Conge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CongeRepository extends JpaRepository<Conge, UUID> {

    @Query("SELECT c FROM Conge c WHERE c.entreprise.id = :eid ORDER BY c.createdAt DESC")
    List<Conge> findAllByEntreprise(@Param("eid") UUID eid);

    @Query("""
        SELECT c FROM Conge c
        WHERE c.entreprise.id = :eid AND c.collaborateur.id = :uid
        ORDER BY c.dateDebut DESC
        """)
    List<Conge> findByCollaborateur(@Param("eid") UUID eid, @Param("uid") UUID uid);

    @Query("""
        SELECT c FROM Conge c
        WHERE c.entreprise.id = :eid AND c.statut = 'SOUMISE'
        ORDER BY c.createdAt ASC
        """)
    List<Conge> findSoumises(@Param("eid") UUID eid);

    @Query("""
        SELECT c FROM Conge c
        WHERE c.entreprise.id = :eid AND c.statut = 'APPROUVEE'
          AND c.dateDebut <= :fin AND c.dateFin >= :debut
        ORDER BY c.dateDebut ASC
        """)
    List<Conge> findApprouveesInRange(@Param("eid") UUID eid,
                                      @Param("debut") LocalDate debut,
                                      @Param("fin") LocalDate fin);

    @Query("SELECT c FROM Conge c WHERE c.id = :id AND c.entreprise.id = :eid")
    Optional<Conge> findByIdAndEntreprise(@Param("id") UUID id, @Param("eid") UUID eid);

    @Query("SELECT COUNT(c) FROM Conge c WHERE c.entreprise.id = :eid AND c.statut = 'SOUMISE'")
    long countSoumises(@Param("eid") UUID eid);

    @Query("""
        SELECT COUNT(c) FROM Conge c
        WHERE c.entreprise.id = :eid AND c.statut = 'APPROUVEE'
          AND c.dateDebut <= :today AND c.dateFin >= :today
        """)
    long countEnCours(@Param("eid") UUID eid, @Param("today") java.time.LocalDate today);

    @Query("""
        SELECT COUNT(c) FROM Conge c
        WHERE c.entreprise.id = :eid AND c.statut = 'APPROUVEE'
          AND c.dateDebut >= :debut AND c.dateDebut <= :fin
        """)
    long countApprouveesInPeriod(@Param("eid") UUID eid,
                                  @Param("debut") java.time.LocalDate debut,
                                  @Param("fin") java.time.LocalDate fin);

    @Query("""
        SELECT COALESCE(SUM(c.nombreJours), 0) FROM Conge c
        WHERE c.entreprise.id = :eid AND c.statut = 'APPROUVEE'
          AND c.dateDebut >= :debut AND c.dateDebut <= :fin
        """)
    java.math.BigDecimal sumJoursApprouvesInPeriod(@Param("eid") UUID eid,
                                                    @Param("debut") java.time.LocalDate debut,
                                                    @Param("fin") java.time.LocalDate fin);
}
