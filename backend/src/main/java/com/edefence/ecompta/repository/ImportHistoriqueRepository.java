package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.ImportHistorique;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ImportHistoriqueRepository extends JpaRepository<ImportHistorique, UUID> {

    List<ImportHistorique> findByEntrepriseIdOrderByCreatedAtDesc(UUID entrepriseId);

    Optional<ImportHistorique> findByIdAndEntrepriseId(UUID id, UUID entrepriseId);
}
