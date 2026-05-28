package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.BudgetRh;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BudgetRhRepository extends JpaRepository<BudgetRh, UUID> {

    List<BudgetRh> findByEntrepriseIdAndExerciceOrderByCategorieAscMoisAsc(UUID eid, int exercice);

    Optional<BudgetRh> findByEntrepriseIdAndExerciceAndMoisAndCategorie(
            UUID eid, int exercice, int mois, BudgetRh.Categorie categorie);

    Optional<BudgetRh> findByIdAndEntrepriseId(UUID id, UUID eid);

    @Query("SELECT DISTINCT b.exercice FROM BudgetRh b WHERE b.entreprise.id = :eid ORDER BY b.exercice DESC")
    List<Integer> findExercices(@Param("eid") UUID eid);
}
