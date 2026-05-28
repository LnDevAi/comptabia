package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.FluxTresoreriePrevision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface FluxTresoreriePrevisionRepository extends JpaRepository<FluxTresoreriePrevision, UUID> {

    @Query("""
            SELECT f FROM FluxTresoreriePrevision f
            WHERE f.entreprise.id = :eid
              AND f.actif = TRUE
              AND f.dateFlux BETWEEN :from AND :to
            ORDER BY f.dateFlux ASC
            """)
    List<FluxTresoreriePrevision> findByPeriode(
            @Param("eid")  UUID eid,
            @Param("from") LocalDate from,
            @Param("to")   LocalDate to);

    @Query("""
            SELECT f FROM FluxTresoreriePrevision f
            WHERE f.entreprise.id = :eid AND f.actif = TRUE
            ORDER BY f.dateFlux ASC
            """)
    List<FluxTresoreriePrevision> findAllActifs(@Param("eid") UUID eid);
}
