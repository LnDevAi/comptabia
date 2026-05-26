package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.CrmCampagne;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CrmCampagneRepository extends JpaRepository<CrmCampagne, UUID> {

    List<CrmCampagne> findByEntrepriseIdOrderByCreatedAtDesc(UUID entrepriseId);
}
