package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.DeclarationTva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DeclarationTvaRepository extends JpaRepository<DeclarationTva, UUID> {

    List<DeclarationTva> findByEntrepriseIdOrderByPeriodeDebutDesc(UUID entrepriseId);

    Optional<DeclarationTva> findByIdAndEntrepriseId(UUID id, UUID entrepriseId);

    boolean existsByEntrepriseIdAndPeriodeDebutAndPeriodeFin(
            UUID entrepriseId, LocalDate debut, LocalDate fin);

    @Query("""
            SELECT COALESCE(SUM(l.credit - l.debit), 0)
            FROM LigneEcriture l
            JOIN l.compte c
            JOIN l.ecriture e
            WHERE e.entreprise.id = :eid
            AND e.statut = 'VALIDEE'
            AND e.dateEcriture BETWEEN :from AND :to
            AND c.numero LIKE '443%'
            """)
    java.math.BigDecimal sumTvaCollectee(
            @Param("eid") UUID entrepriseId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Query("""
            SELECT COALESCE(SUM(l.debit - l.credit), 0)
            FROM LigneEcriture l
            JOIN l.compte c
            JOIN l.ecriture e
            WHERE e.entreprise.id = :eid
            AND e.statut = 'VALIDEE'
            AND e.dateEcriture BETWEEN :from AND :to
            AND c.numero LIKE '445%'
            """)
    java.math.BigDecimal sumTvaDeductible(
            @Param("eid") UUID entrepriseId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Query("""
            SELECT c.numero, c.intitule,
                   COALESCE(SUM(l.debit), 0), COALESCE(SUM(l.credit), 0)
            FROM LigneEcriture l
            JOIN l.compte c
            JOIN l.ecriture e
            WHERE e.entreprise.id = :eid
            AND e.statut = 'VALIDEE'
            AND e.dateEcriture BETWEEN :from AND :to
            AND (c.numero LIKE '443%' OR c.numero LIKE '445%')
            GROUP BY c.numero, c.intitule
            ORDER BY c.numero ASC
            """)
    List<Object[]> detailParCompte(
            @Param("eid") UUID entrepriseId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Query("""
            SELECT MONTH(e.dateEcriture),
                   COALESCE(SUM(CASE WHEN c.numero LIKE '443%' THEN l.credit - l.debit ELSE 0 END), 0),
                   COALESCE(SUM(CASE WHEN c.numero LIKE '445%' THEN l.debit - l.credit ELSE 0 END), 0)
            FROM LigneEcriture l
            JOIN l.compte c
            JOIN l.ecriture e
            WHERE e.entreprise.id = :eid
            AND e.statut = 'VALIDEE'
            AND (c.numero LIKE '443%' OR c.numero LIKE '445%')
            AND e.dateEcriture >= :from AND e.dateEcriture <= :to
            GROUP BY MONTH(e.dateEcriture)
            ORDER BY MONTH(e.dateEcriture)
            """)
    List<Object[]> tvaParMois(
            @Param("eid") UUID entrepriseId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);
}
