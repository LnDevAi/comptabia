package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.TresorerieAlerte;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TresorerieAlerteRepository extends JpaRepository<TresorerieAlerte, UUID> {

    List<TresorerieAlerte> findByEntrepriseIdAndAcquitteeOrderByCreatedAtDesc(
            UUID entrepriseId, boolean acquittee);

    List<TresorerieAlerte> findByEntrepriseIdOrderByCreatedAtDesc(UUID entrepriseId);

    long countByEntrepriseIdAndAcquittee(UUID entrepriseId, boolean acquittee);

    Optional<TresorerieAlerte> findByIdAndEntrepriseId(UUID id, UUID entrepriseId);
}
