package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.CreditSfd;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CreditSfdRepository extends JpaRepository<CreditSfd, UUID> {

    List<CreditSfd> findByEntrepriseIdOrderByJoursRetardDescCreatedAtDesc(UUID entrepriseId);

    Optional<CreditSfd> findByIdAndEntrepriseId(UUID id, UUID entrepriseId);

    // Total encours actif (exclu remboursé + passé en pertes)
    @Query("""
            SELECT COALESCE(SUM(c.montantEncours), 0)
            FROM CreditSfd c
            WHERE c.entreprise.id = :eid
              AND c.statut NOT IN (
                com.edefence.comptabia.domain.CreditSfd$Statut.REMBOURSE,
                com.edefence.comptabia.domain.CreditSfd$Statut.PASSE_EN_PERTES
              )
            """)
    BigDecimal sumEncoursTotalActif(@Param("eid") UUID entrepriseId);

    // Encours PAR30 (portefeuille à risque > 30 jours)
    @Query("""
            SELECT COALESCE(SUM(c.montantEncours), 0)
            FROM CreditSfd c
            WHERE c.entreprise.id = :eid
              AND c.joursRetard > 30
              AND c.statut NOT IN (
                com.edefence.comptabia.domain.CreditSfd$Statut.REMBOURSE,
                com.edefence.comptabia.domain.CreditSfd$Statut.PASSE_EN_PERTES
              )
            """)
    BigDecimal sumEncoursPAR30(@Param("eid") UUID entrepriseId);

    // Encours PAR90
    @Query("""
            SELECT COALESCE(SUM(c.montantEncours), 0)
            FROM CreditSfd c
            WHERE c.entreprise.id = :eid
              AND c.joursRetard > 90
              AND c.statut NOT IN (
                com.edefence.comptabia.domain.CreditSfd$Statut.REMBOURSE,
                com.edefence.comptabia.domain.CreditSfd$Statut.PASSE_EN_PERTES
              )
            """)
    BigDecimal sumEncoursPAR90(@Param("eid") UUID entrepriseId);

    // Encours par statut
    @Query("""
            SELECT COALESCE(SUM(c.montantEncours), 0)
            FROM CreditSfd c
            WHERE c.entreprise.id = :eid AND c.statut = :statut
            """)
    BigDecimal sumEncoursByStatut(@Param("eid") UUID entrepriseId,
                                   @Param("statut") CreditSfd.Statut statut);

    // Nombre de crédits actifs
    @Query("""
            SELECT COUNT(c) FROM CreditSfd c
            WHERE c.entreprise.id = :eid
              AND c.statut NOT IN (
                com.edefence.comptabia.domain.CreditSfd$Statut.REMBOURSE,
                com.edefence.comptabia.domain.CreditSfd$Statut.PASSE_EN_PERTES
              )
            """)
    long countCreditsActifs(@Param("eid") UUID entrepriseId);

    // Répartition par type
    @Query("""
            SELECT c.typeCredit, COUNT(c), COALESCE(SUM(c.montantEncours), 0)
            FROM CreditSfd c
            WHERE c.entreprise.id = :eid
              AND c.statut NOT IN (
                com.edefence.comptabia.domain.CreditSfd$Statut.REMBOURSE,
                com.edefence.comptabia.domain.CreditSfd$Statut.PASSE_EN_PERTES
              )
            GROUP BY c.typeCredit
            ORDER BY c.typeCredit
            """)
    List<Object[]> repartitionParType(@Param("eid") UUID entrepriseId);
}
