package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.GedTypeDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GedTypeDocumentRepository extends JpaRepository<GedTypeDocument, UUID> {

    List<GedTypeDocument> findByEntrepriseIdOrderByLibelleAsc(UUID entrepriseId);

    boolean existsByCodeAndEntrepriseId(String code, UUID entrepriseId);

    Optional<GedTypeDocument> findByIdAndEntrepriseId(UUID id, UUID entrepriseId);
}
