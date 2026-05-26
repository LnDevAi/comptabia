package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.CrmActivite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CrmActiviteRepository extends JpaRepository<CrmActivite, UUID> {

    List<CrmActivite> findByLeadIdOrderByDateActiviteDesc(UUID leadId);

    List<CrmActivite> findByContactIdOrderByDateActiviteDesc(UUID contactId);

    List<CrmActivite> findByEntrepriseIdOrderByDateActiviteDesc(UUID entrepriseId);
}
