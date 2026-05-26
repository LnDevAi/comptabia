package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.ZakatCalcul;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ZakatCalculRepository extends JpaRepository<ZakatCalcul, UUID> {

    List<ZakatCalcul> findByEntrepriseIdOrderByExerciceDesc(UUID entrepriseId);

    Optional<ZakatCalcul> findByEntrepriseIdAndExercice(UUID entrepriseId, int exercice);

    Optional<ZakatCalcul> findByIdAndEntrepriseId(UUID id, UUID entrepriseId);
}
