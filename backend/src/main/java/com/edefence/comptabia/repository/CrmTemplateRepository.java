package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.CrmTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CrmTemplateRepository extends JpaRepository<CrmTemplate, UUID> {

    List<CrmTemplate> findByEntrepriseIdOrderByCreatedAtDesc(UUID entrepriseId);

    List<CrmTemplate> findByEntrepriseIdAndTypeOrderByCreatedAtDesc(UUID entrepriseId, CrmTemplate.Type type);
}
