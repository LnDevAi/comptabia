package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.SouscriptionSaas;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SouscriptionSaasRepository extends JpaRepository<SouscriptionSaas, UUID> {
    Optional<SouscriptionSaas> findByTransactionId(String transactionId);
    Optional<SouscriptionSaas> findByStripeSessionId(String stripeSessionId);
    List<SouscriptionSaas> findByStatutOrderByCreatedAtDesc(SouscriptionSaas.Statut statut);
    List<SouscriptionSaas> findByEntrepriseIdOrderByCreatedAtDesc(UUID entrepriseId);
}
