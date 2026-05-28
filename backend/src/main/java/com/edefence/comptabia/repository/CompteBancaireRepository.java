package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.CompteBancaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CompteBancaireRepository extends JpaRepository<CompteBancaire, UUID> {

    List<CompteBancaire> findByEntrepriseIdAndActifTrueOrderByLibelleAsc(UUID entrepriseId);

    List<CompteBancaire> findByEntrepriseIdOrderByLibelleAsc(UUID entrepriseId);

    Optional<CompteBancaire> findByIdAndEntrepriseId(UUID id, UUID entrepriseId);

    boolean existsByIbanAndEntrepriseId(String iban, UUID entrepriseId);

    @Query("SELECT COALESCE(SUM(c.soldeReel), 0) FROM CompteBancaire c WHERE c.entreprise.id = :eid AND c.actif = TRUE")
    BigDecimal soldeConsolide(@Param("eid") UUID entrepriseId);
}
