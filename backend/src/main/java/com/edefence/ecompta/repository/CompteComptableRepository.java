package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.CompteComptable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CompteComptableRepository extends JpaRepository<CompteComptable, UUID> {
    List<CompteComptable> findByEntrepriseIdAndActifTrueOrderByNumeroAsc(UUID entrepriseId);
    List<CompteComptable> findByEntrepriseIdAndClasseOrderByNumeroAsc(UUID entrepriseId, int classe);
    Optional<CompteComptable> findByNumeroAndEntrepriseId(String numero, UUID entrepriseId);
    boolean existsByNumeroAndEntrepriseId(String numero, UUID entrepriseId);
    long countByEntrepriseId(UUID entrepriseId);
}
