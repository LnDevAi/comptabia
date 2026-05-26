package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.GedTag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GedTagRepository extends JpaRepository<GedTag, UUID> {

    List<GedTag> findByEntrepriseIdOrderByLibelleAsc(UUID entrepriseId);

    boolean existsByLibelleIgnoreCaseAndEntrepriseId(String libelle, UUID entrepriseId);

    Optional<GedTag> findByIdAndEntrepriseId(UUID id, UUID entrepriseId);
}
