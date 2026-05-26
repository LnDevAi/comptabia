package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.FactureAbonnement;
import com.edefence.ecompta.domain.FactureAbonnement.Statut;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface FactureAbonnementRepository extends JpaRepository<FactureAbonnement, UUID> {

    List<FactureAbonnement> findByAbonnementIdOrderByCreatedAtDesc(UUID abonnementId);

    List<FactureAbonnement> findAllByOrderByCreatedAtDesc();

    List<FactureAbonnement> findByStatut(Statut statut);

    @Query("SELECT COUNT(f) FROM FactureAbonnement f WHERE YEAR(f.createdAt) = :year")
    long countByYear(int year);

    long countByStatut(Statut statut);
}
