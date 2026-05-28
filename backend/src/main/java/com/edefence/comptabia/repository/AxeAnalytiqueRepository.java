package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.AxeAnalytique;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AxeAnalytiqueRepository extends JpaRepository<AxeAnalytique, UUID> {

    List<AxeAnalytique> findByEntrepriseIdOrderByCodeAsc(UUID entrepriseId);

    List<AxeAnalytique> findByEntrepriseIdAndTypeOrderByCodeAsc(UUID entrepriseId, String type);

    List<AxeAnalytique> findByParentIdOrderByCodeAsc(UUID parentId);

    Optional<AxeAnalytique> findByIdAndEntrepriseId(UUID id, UUID entrepriseId);

    boolean existsByCodeAndEntrepriseId(String code, UUID entrepriseId);

    // ─── Rapport général (groupé par axe + compte) ──────────────────────────

    @Query("""
            SELECT l.axeAnalytique.id, l.axeAnalytique.code, l.axeAnalytique.intitule,
                   l.axeAnalytique.type, l.axeAnalytique.montantBudget,
                   c.numero, c.intitule,
                   COALESCE(SUM(l.debit), 0), COALESCE(SUM(l.credit), 0)
            FROM LigneEcriture l
            JOIN l.compte c
            JOIN l.ecriture e
            WHERE e.entreprise.id = :eid
            AND e.statut = 'VALIDEE'
            AND e.dateEcriture BETWEEN :from AND :to
            AND l.axeAnalytique IS NOT NULL
            GROUP BY l.axeAnalytique.id, l.axeAnalytique.code, l.axeAnalytique.intitule,
                     l.axeAnalytique.type, l.axeAnalytique.montantBudget,
                     c.numero, c.intitule
            ORDER BY l.axeAnalytique.code ASC, c.numero ASC
            """)
    List<Object[]> rapportParAxe(@Param("eid") UUID entrepriseId,
                                 @Param("from") LocalDate from,
                                 @Param("to") LocalDate to);

    // ─── Rapport bailleur : lignes pour un axe donné ─────────────────────────

    @Query("""
            SELECT c.numero, c.intitule,
                   COALESCE(SUM(l.debit), 0), COALESCE(SUM(l.credit), 0)
            FROM LigneEcriture l
            JOIN l.compte c
            JOIN l.ecriture e
            WHERE e.entreprise.id = :eid
            AND e.statut = 'VALIDEE'
            AND e.dateEcriture BETWEEN :from AND :to
            AND l.axeAnalytique.id = :axeId
            GROUP BY c.numero, c.intitule
            ORDER BY c.numero ASC
            """)
    List<Object[]> lignesParAxe(@Param("eid") UUID entrepriseId,
                                @Param("axeId") UUID axeId,
                                @Param("from") LocalDate from,
                                @Param("to") LocalDate to);

    // ─── Solde d'un axe ──────────────────────────────────────────────────────

    @Query("""
            SELECT COALESCE(SUM(l.debit - l.credit), 0)
            FROM LigneEcriture l JOIN l.ecriture e
            WHERE e.entreprise.id = :eid
            AND e.statut = 'VALIDEE'
            AND e.dateEcriture BETWEEN :from AND :to
            AND l.axeAnalytique.id = :axeId
            """)
    BigDecimal soldeAxe(@Param("eid") UUID entrepriseId,
                        @Param("axeId") UUID axeId,
                        @Param("from") LocalDate from,
                        @Param("to") LocalDate to);
}
