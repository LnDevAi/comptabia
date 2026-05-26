package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.PlanTarifaire;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PlanTarifaireRepository extends JpaRepository<PlanTarifaire, UUID> {
    List<PlanTarifaire> findAllByOrderByPrixMensuelAsc();
    List<PlanTarifaire> findByActifTrue();
}
