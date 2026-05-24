package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.LigneEcriture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface LigneEcritureRepository extends JpaRepository<LigneEcriture, UUID> {

    @Query("SELECT COALESCE(SUM(l.debit),0) FROM LigneEcriture l WHERE l.ecriture.id = :ecritureId")
    BigDecimal sumDebitByEcriture(@Param("ecritureId") UUID ecritureId);

    @Query("SELECT COALESCE(SUM(l.credit),0) FROM LigneEcriture l WHERE l.ecriture.id = :ecritureId")
    BigDecimal sumCreditByEcriture(@Param("ecritureId") UUID ecritureId);

    @Query("""
            SELECT c.numero, c.intitule, c.classe,
                   COALESCE(SUM(l.debit), 0), COALESCE(SUM(l.credit), 0)
            FROM LigneEcriture l
            JOIN l.compte c
            JOIN l.ecriture e
            WHERE e.entreprise.id = :id
            AND e.statut = 'VALIDEE'
            AND e.dateEcriture >= :from
            AND e.dateEcriture <= :to
            GROUP BY c.id, c.numero, c.intitule, c.classe
            ORDER BY c.numero ASC
            """)
    List<Object[]> balanceParCompte(@Param("id") UUID id,
                                    @Param("from") LocalDate from,
                                    @Param("to") LocalDate to);

    @Query("""
            SELECT e.dateEcriture, e.numeroPiece, e.libelle, e.journal,
                   l.debit, l.credit
            FROM LigneEcriture l
            JOIN l.compte c
            JOIN l.ecriture e
            WHERE e.entreprise.id = :id
            AND e.statut = 'VALIDEE'
            AND c.numero = :numero
            AND e.dateEcriture >= :from
            AND e.dateEcriture <= :to
            ORDER BY e.dateEcriture ASC, e.createdAt ASC
            """)
    List<Object[]> grandLivreParCompte(@Param("id") UUID id,
                                       @Param("numero") String numero,
                                       @Param("from") LocalDate from,
                                       @Param("to") LocalDate to);
}
