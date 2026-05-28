package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.Abonnement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AbonnementRepository extends JpaRepository<Abonnement, UUID> {

    @Query("SELECT a FROM Abonnement a WHERE a.entreprise.id = :eid ORDER BY a.nom")
    List<Abonnement> findAllByEntreprise(@Param("eid") UUID eid);

    @Query("SELECT a FROM Abonnement a WHERE a.id = :id AND a.entreprise.id = :eid")
    Optional<Abonnement> findByIdAndEntreprise(@Param("id") UUID id, @Param("eid") UUID eid);

    @Query("""
        SELECT a FROM Abonnement a
        WHERE a.actif = true
          AND a.prochaineEcheance <= :today
          AND (a.dateFin IS NULL OR a.dateFin >= :today)
        """)
    List<Abonnement> findDus(@Param("today") LocalDate today);
}
