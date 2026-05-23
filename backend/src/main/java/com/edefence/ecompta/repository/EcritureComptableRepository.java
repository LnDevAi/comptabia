package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.EcritureComptable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.UUID;

public interface EcritureComptableRepository extends JpaRepository<EcritureComptable, UUID> {
    Page<EcritureComptable> findByEntrepriseIdOrderByDateEcritureDesc(UUID entrepriseId, Pageable pageable);
    Page<EcritureComptable> findByEntrepriseIdAndDateEcritureBetweenOrderByDateEcritureDesc(
            UUID entrepriseId, LocalDate from, LocalDate to, Pageable pageable);
    boolean existsByNumeroPieceAndEntrepriseId(String numeroPiece, UUID entrepriseId);
    long countByEntrepriseId(UUID entrepriseId);
}
