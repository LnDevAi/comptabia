package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.ReleveBancaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReleveBancaireRepository extends JpaRepository<ReleveBancaire, UUID> {

    List<ReleveBancaire> findByEntrepriseIdAndCompteNumeroOrderByDateReleveAsc(
            UUID entrepriseId, String compteNumero);

    List<ReleveBancaire> findByEntrepriseIdAndCompteNumeroAndStatutOrderByDateReleveAsc(
            UUID entrepriseId, String compteNumero, ReleveBancaire.Statut statut);

    Optional<ReleveBancaire> findByIdAndEntrepriseId(UUID id, UUID entrepriseId);

    @Query("""
            SELECT COALESCE(SUM(CASE WHEN r.sens = 'CREDIT' THEN r.montant ELSE -r.montant END), 0)
            FROM ReleveBancaire r
            WHERE r.entreprise.id = :eid AND r.compteNumero = :compte
            """)
    BigDecimal soldeReleve(@Param("eid") UUID entrepriseId, @Param("compte") String compteNumero);

    long countByEntrepriseIdAndCompteNumeroAndStatut(
            UUID entrepriseId, String compteNumero, ReleveBancaire.Statut statut);

    @Query("""
            SELECT DISTINCT r.compteNumero FROM ReleveBancaire r
            WHERE r.entreprise.id = :eid ORDER BY r.compteNumero ASC
            """)
    List<String> findComptesWithReleve(@Param("eid") UUID entrepriseId);
}
