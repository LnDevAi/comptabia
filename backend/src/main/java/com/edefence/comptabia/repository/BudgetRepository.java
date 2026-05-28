package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BudgetRepository extends JpaRepository<Budget, UUID> {

    List<Budget> findByEntrepriseIdAndExerciceOrderByCompteNumeroAsc(UUID entrepriseId, int exercice);

    Optional<Budget> findByEntrepriseIdAndExerciceAndCompteNumeroAndSens(
            UUID entrepriseId, int exercice, String compteNumero, Budget.Sens sens);

    Optional<Budget> findByIdAndEntrepriseId(UUID id, UUID entrepriseId);

    @Query("""
            SELECT DISTINCT b.exercice FROM Budget b
            WHERE b.entreprise.id = :eid
            ORDER BY b.exercice DESC
            """)
    List<Integer> findExercicesWithBudget(@Param("eid") UUID entrepriseId);

    @Query("""
            SELECT b.compteNumero, b.montant, b.sens,
                   COALESCE(SUM(CASE WHEN b.sens = 'DEBIT' THEN l.debit - l.credit
                                     ELSE l.credit - l.debit END), 0) AS reel
            FROM Budget b
            LEFT JOIN LigneEcriture l ON l.compte.numero = b.compteNumero
                AND l.ecriture.entreprise.id = :eid
                AND l.ecriture.statut = 'VALIDEE'
                AND YEAR(l.ecriture.dateEcriture) = :exercice
            WHERE b.entreprise.id = :eid AND b.exercice = :exercice AND b.montant > 0
            GROUP BY b.compteNumero, b.montant, b.sens
            HAVING COALESCE(SUM(CASE WHEN b.sens = 'DEBIT' THEN l.debit - l.credit
                                      ELSE l.credit - l.debit END), 0) > b.montant
            """)
    List<Object[]> findBudgetsDépasses(@Param("eid") UUID entrepriseId,
                                       @Param("exercice") int exercice);
}
