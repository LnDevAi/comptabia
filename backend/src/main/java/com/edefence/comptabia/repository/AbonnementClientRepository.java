package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.AbonnementClient;
import com.edefence.comptabia.domain.AbonnementClient.Statut;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface AbonnementClientRepository extends JpaRepository<AbonnementClient, UUID> {

    List<AbonnementClient> findAllByOrderByCreatedAtDesc();

    long countByStatut(Statut statut);

    @Query("SELECT COALESCE(SUM(a.montantActuel), 0) FROM AbonnementClient a WHERE a.statut = 'ACTIF' AND a.periodicite = 'MENSUEL'")
    BigDecimal sumMrrMensuel();

    @Query("SELECT COALESCE(SUM(a.montantActuel), 0) FROM AbonnementClient a WHERE a.statut = 'ACTIF' AND a.periodicite = 'ANNUEL'")
    BigDecimal sumMrrAnnuel();

    @Query("SELECT a FROM AbonnementClient a WHERE a.dateProchainRenouvellement BETWEEN :debut AND :fin AND a.statut = 'ACTIF'")
    List<AbonnementClient> findRenouvellementsDans(LocalDate debut, LocalDate fin);
}
