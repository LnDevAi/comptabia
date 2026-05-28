package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.PlanTarifaire;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PlanTarifaireRepository extends JpaRepository<PlanTarifaire, UUID> {
    List<PlanTarifaire> findAllByOrderByPrixMensuelAsc();
    List<PlanTarifaire> findByActifTrue();
}
