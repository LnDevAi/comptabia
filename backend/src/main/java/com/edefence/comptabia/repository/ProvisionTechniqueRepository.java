package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.ProvisionTechnique;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProvisionTechniqueRepository extends JpaRepository<ProvisionTechnique, UUID> {

    List<ProvisionTechnique> findByEntrepriseIdAndExerciceOrderByTypeProvisionAscBrancheAsc(
            UUID entrepriseId, int exercice);

    List<ProvisionTechnique> findByEntrepriseIdOrderByExerciceDescTypeProvisionAscBrancheAsc(
            UUID entrepriseId);

    Optional<ProvisionTechnique> findByIdAndEntrepriseId(UUID id, UUID entrepriseId);

    @Query("""
            SELECT SUM(p.montant) FROM ProvisionTechnique p
            WHERE p.entreprise.id = :eid AND p.exercice = :ex
            """)
    BigDecimal sumMontantByEntrepriseIdAndExercice(@Param("eid") UUID entrepriseId,
                                                    @Param("ex") int exercice);

    @Query("""
            SELECT p.typeProvision, p.branche, SUM(p.montant)
            FROM ProvisionTechnique p
            WHERE p.entreprise.id = :eid AND p.exercice = :ex
            GROUP BY p.typeProvision, p.branche
            ORDER BY p.typeProvision, p.branche
            """)
    List<Object[]> sumParTypeEtBranche(@Param("eid") UUID entrepriseId, @Param("ex") int exercice);
}
