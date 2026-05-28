package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.DepotStock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DepotStockRepository extends JpaRepository<DepotStock, UUID> {
    List<DepotStock> findByEntrepriseIdOrderByNomAsc(UUID entrepriseId);
    Optional<DepotStock> findByIdAndEntrepriseId(UUID id, UUID entrepriseId);
    boolean existsByCodeAndEntrepriseId(String code, UUID entrepriseId);
}
