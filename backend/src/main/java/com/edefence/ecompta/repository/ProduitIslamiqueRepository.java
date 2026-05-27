package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.ProduitIslamique;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProduitIslamiqueRepository extends JpaRepository<ProduitIslamique, UUID> {

    List<ProduitIslamique> findByEntrepriseIdOrderByJoursRetardDescCreatedAtDesc(UUID entrepriseId);

    Optional<ProduitIslamique> findByIdAndEntrepriseId(UUID id, UUID entrepriseId);

    @Query("""
            SELECT COALESCE(SUM(p.montantEncours), 0)
            FROM ProduitIslamique p
            WHERE p.entreprise.id = :eid
              AND p.statut NOT IN (
                com.edefence.ecompta.domain.ProduitIslamique$Statut.CLOTURE,
                com.edefence.ecompta.domain.ProduitIslamique$Statut.PASSE_EN_PERTES
              )
            """)
    BigDecimal sumEncoursTotalActif(@Param("eid") UUID entrepriseId);

    @Query("""
            SELECT COALESCE(SUM(p.montantEncours), 0)
            FROM ProduitIslamique p
            WHERE p.entreprise.id = :eid
              AND p.joursRetard > 30
              AND p.statut NOT IN (
                com.edefence.ecompta.domain.ProduitIslamique$Statut.CLOTURE,
                com.edefence.ecompta.domain.ProduitIslamique$Statut.PASSE_EN_PERTES
              )
            """)
    BigDecimal sumEncoursPAR30(@Param("eid") UUID entrepriseId);

    @Query("""
            SELECT COUNT(p) FROM ProduitIslamique p
            WHERE p.entreprise.id = :eid
              AND p.statut NOT IN (
                com.edefence.ecompta.domain.ProduitIslamique$Statut.CLOTURE,
                com.edefence.ecompta.domain.ProduitIslamique$Statut.PASSE_EN_PERTES
              )
            """)
    long countActifs(@Param("eid") UUID entrepriseId);

    @Query("""
            SELECT p.typeProduit, COUNT(p), COALESCE(SUM(p.montantEncours), 0), COALESCE(SUM(p.margeBeneficiaire), 0)
            FROM ProduitIslamique p
            WHERE p.entreprise.id = :eid
              AND p.statut NOT IN (
                com.edefence.ecompta.domain.ProduitIslamique$Statut.CLOTURE,
                com.edefence.ecompta.domain.ProduitIslamique$Statut.PASSE_EN_PERTES
              )
            GROUP BY p.typeProduit
            ORDER BY p.typeProduit
            """)
    List<Object[]> repartitionParType(@Param("eid") UUID entrepriseId);

    @Query("""
            SELECT COALESCE(SUM(p.margeBeneficiaire), 0)
            FROM ProduitIslamique p
            WHERE p.entreprise.id = :eid
              AND p.statut NOT IN (
                com.edefence.ecompta.domain.ProduitIslamique$Statut.CLOTURE,
                com.edefence.ecompta.domain.ProduitIslamique$Statut.PASSE_EN_PERTES
              )
            """)
    BigDecimal sumMargeTotale(@Param("eid") UUID entrepriseId);
}
