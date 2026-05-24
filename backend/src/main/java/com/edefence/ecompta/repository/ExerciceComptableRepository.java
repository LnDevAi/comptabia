package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.ExerciceComptable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExerciceComptableRepository extends JpaRepository<ExerciceComptable, UUID> {

    List<ExerciceComptable> findByEntrepriseIdOrderByAnneeDesc(UUID entrepriseId);

    Optional<ExerciceComptable> findByEntrepriseIdAndAnnee(UUID entrepriseId, int annee);

    boolean existsByEntrepriseIdAndAnnee(UUID entrepriseId, int annee);
}
