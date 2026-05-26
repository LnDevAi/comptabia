package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.PaiementAbonnement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PaiementAbonnementRepository extends JpaRepository<PaiementAbonnement, UUID> {
    List<PaiementAbonnement> findByFactureIdOrderByDatePaiementDesc(UUID factureId);
}
