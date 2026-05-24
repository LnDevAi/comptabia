package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.EcritureComptable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface EcritureComptableRepository extends JpaRepository<EcritureComptable, UUID> {

    @Query("""
            SELECT e FROM EcritureComptable e
            WHERE e.entreprise.id = :entrepriseId
            AND (:journal IS NULL OR e.journal = :journal)
            AND (:statut  IS NULL OR e.statut  = :statut)
            AND (:from    IS NULL OR e.dateEcriture >= :from)
            AND (:to      IS NULL OR e.dateEcriture <= :to)
            ORDER BY e.dateEcriture DESC, e.createdAt DESC
            """)
    Page<EcritureComptable> findWithFilters(
            @Param("entrepriseId") UUID entrepriseId,
            @Param("journal") EcritureComptable.Journal journal,
            @Param("statut") EcritureComptable.Statut statut,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            Pageable pageable);

    boolean existsByNumeroPieceAndEntrepriseId(String numeroPiece, UUID entrepriseId);

    long countByEntrepriseId(UUID entrepriseId);

    @Query("SELECT e.journal, COUNT(e), COALESCE(SUM(l.debit),0) FROM EcritureComptable e JOIN e.lignes l WHERE e.entreprise.id = :id GROUP BY e.journal")
    List<Object[]> statsParJournal(@Param("id") UUID entrepriseId);

    @Query("SELECT e FROM EcritureComptable e WHERE e.entreprise.id = :id AND e.dateEcriture >= :from ORDER BY e.dateEcriture ASC")
    List<EcritureComptable> findSince(@Param("id") UUID id, @Param("from") java.time.LocalDate from);

    @Query("""
            SELECT e FROM EcritureComptable e JOIN FETCH e.lignes l JOIN FETCH l.compte
            WHERE e.entreprise.id = :id ORDER BY e.createdAt DESC
            LIMIT 8
            """)
    List<EcritureComptable> findRecent(@Param("id") UUID id);

    @Query("""
            SELECT COALESCE(SUM(l.debit),0) FROM LigneEcriture l
            WHERE l.ecriture.entreprise.id = :id AND l.ecriture.statut = 'VALIDEE'
            """)
    BigDecimal totalDebitValide(@Param("id") UUID id);

    @Query("""
            SELECT COALESCE(SUM(l.credit),0) FROM LigneEcriture l
            WHERE l.ecriture.entreprise.id = :id AND l.ecriture.statut = 'VALIDEE'
            """)
    BigDecimal totalCreditValide(@Param("id") UUID id);

    @Query("SELECT COUNT(e) FROM EcritureComptable e WHERE e.entreprise.id = :id AND e.statut = 'BROUILLON'")
    long countBrouillonsByEntrepriseId(@Param("id") UUID entrepriseId);

    @Query("SELECT COUNT(e) FROM EcritureComptable e WHERE e.entreprise.id = :id AND e.statut = 'VALIDEE'")
    long countValideesByEntrepriseId(@Param("id") UUID entrepriseId);

    @Query("""
            SELECT e FROM EcritureComptable e JOIN FETCH e.lignes l JOIN FETCH l.compte
            WHERE e.entreprise.id = :id
            AND e.statut = 'VALIDEE'
            AND e.dateEcriture >= :from
            AND e.dateEcriture <= :to
            ORDER BY e.dateEcriture ASC, e.createdAt ASC
            """)
    List<EcritureComptable> findValideesByPeriod(@Param("id") UUID id,
                                                  @Param("from") java.time.LocalDate from,
                                                  @Param("to") java.time.LocalDate to);
}
