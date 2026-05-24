package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.Tiers;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface TiersRepository extends JpaRepository<Tiers, UUID> {

    boolean existsByCodeAndEntrepriseId(String code, UUID entrepriseId);

    Optional<Tiers> findByIdAndEntrepriseId(UUID id, UUID entrepriseId);

    @Query("""
            SELECT t FROM Tiers t
            WHERE t.entreprise.id = :eid
              AND (:type IS NULL OR t.type = :type)
              AND (:actifOnly = FALSE OR t.actif = TRUE)
              AND (:search IS NULL OR LOWER(t.nom) LIKE LOWER(CONCAT('%', :search, '%'))
                                   OR LOWER(t.code) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY t.nom ASC
            """)
    Page<Tiers> search(
            @Param("eid") UUID entrepriseId,
            @Param("type") Tiers.TypeTiers type,
            @Param("search") String search,
            @Param("actifOnly") boolean actifOnly,
            Pageable pageable);

    long countByEntrepriseIdAndType(UUID entrepriseId, Tiers.TypeTiers type);

    long countByEntrepriseIdAndActifTrue(UUID entrepriseId);

    long countByEntrepriseId(UUID entrepriseId);
}
