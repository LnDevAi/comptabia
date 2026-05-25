package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.LigneEcriture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
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

    @Query("""
            SELECT l.id, e.dateEcriture, e.numeroPiece, l.libelle, l.debit, l.credit
            FROM LigneEcriture l
            JOIN l.compte c
            JOIN l.ecriture e
            WHERE e.entreprise.id = :id
            AND e.statut = 'VALIDEE'
            AND c.numero = :compte
            ORDER BY e.dateEcriture ASC, e.createdAt ASC
            """)
    List<Object[]> findLignesForCompte(@Param("id") UUID entrepriseId,
                                       @Param("compte") String compteNumero);

    @Query("""
            SELECT l.id, e.dateEcriture, e.numeroPiece, l.libelle, l.debit, l.credit,
                   l.lettre, l.lettreDate
            FROM LigneEcriture l
            JOIN l.compte c
            JOIN l.ecriture e
            WHERE e.entreprise.id = :eid
            AND e.statut = 'VALIDEE'
            AND c.numero = :compte
            ORDER BY l.lettre ASC NULLS LAST, e.dateEcriture ASC
            """)
    List<Object[]> findLignesLettrage(@Param("eid") UUID entrepriseId,
                                      @Param("compte") String compteNumero);

    @Query("""
            SELECT COALESCE(MAX(l.lettre), '')
            FROM LigneEcriture l
            JOIN l.compte c
            JOIN l.ecriture e
            WHERE e.entreprise.id = :eid
            AND c.numero = :compte
            AND l.lettre IS NOT NULL
            """)
    String findMaxLettre(@Param("eid") UUID entrepriseId,
                         @Param("compte") String compteNumero);

    @Modifying
    @Query("""
            UPDATE LigneEcriture l SET l.lettre = :lettre, l.lettreDate = :date
            WHERE l.id IN :ids
            """)
    void lettrer(@Param("ids") List<UUID> ids,
                 @Param("lettre") String lettre,
                 @Param("date") LocalDate date);

    @Modifying
    @Query("""
            UPDATE LigneEcriture l SET l.lettre = NULL, l.lettreDate = NULL
            WHERE l.lettre = :lettre
            AND l.id IN (
                SELECT l2.id FROM LigneEcriture l2
                JOIN l2.compte c JOIN l2.ecriture e
                WHERE e.entreprise.id = :eid AND c.numero = :compte
            )
            """)
    void delettrer(@Param("lettre") String lettre,
                   @Param("eid") UUID entrepriseId,
                   @Param("compte") String compteNumero);

    @Query("""
            SELECT l FROM LigneEcriture l
            JOIN l.compte c JOIN l.ecriture e
            WHERE l.id IN :ids
            AND e.entreprise.id = :eid
            AND c.numero = :compte
            AND e.statut = 'VALIDEE'
            """)
    List<LigneEcriture> findByIdsForLettrage(@Param("ids") List<UUID> ids,
                                             @Param("eid") UUID entrepriseId,
                                             @Param("compte") String compteNumero);

    @Query("""
            SELECT l FROM LigneEcriture l
            JOIN l.ecriture e
            WHERE l.id IN :ids
            AND e.entreprise.id = :eid
            """)
    List<LigneEcriture> findByIdsAndEntreprise(@Param("ids") List<UUID> ids,
                                               @Param("eid") UUID entrepriseId);

    @Query("""
            SELECT c.numero, c.intitule, e.dateEcriture, e.numeroPiece,
                   COALESCE(SUM(l.debit), 0), COALESCE(SUM(l.credit), 0)
            FROM LigneEcriture l
            JOIN l.compte c JOIN l.ecriture e
            WHERE e.entreprise.id = :eid
            AND e.statut = 'VALIDEE'
            AND c.numero LIKE :prefix
            AND l.lettre IS NULL
            GROUP BY c.numero, c.intitule, e.dateEcriture, e.numeroPiece
            ORDER BY c.numero, e.dateEcriture
            """)
    List<Object[]> balanceAgeeRaw(@Param("eid") UUID entrepriseId,
                                   @Param("prefix") String prefix);

    @Query("""
            SELECT c.numero, COALESCE(SUM(l.debit - l.credit), 0)
            FROM LigneEcriture l
            JOIN l.compte c
            JOIN l.ecriture e
            WHERE e.entreprise.id = :eid
            AND e.statut = 'VALIDEE'
            AND c.numero LIKE '411%'
            AND l.lettre IS NULL
            GROUP BY c.numero
            HAVING COALESCE(SUM(l.debit - l.credit), 0) > 0
            ORDER BY c.numero ASC
            """)
    List<Object[]> creancesImpayeesParCompte(@Param("eid") UUID entrepriseId);
}
