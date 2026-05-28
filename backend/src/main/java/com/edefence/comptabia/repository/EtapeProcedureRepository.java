package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.EtapeProcedure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface EtapeProcedureRepository extends JpaRepository<EtapeProcedure, UUID> {

    @Query("SELECT e FROM EtapeProcedure e WHERE e.dossier.id = :dossierId ORDER BY e.dateEtape")
    List<EtapeProcedure> findByDossier(UUID dossierId);
}
