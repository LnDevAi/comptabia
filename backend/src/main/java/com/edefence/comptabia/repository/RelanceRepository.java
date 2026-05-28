package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.Relance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RelanceRepository extends JpaRepository<Relance, UUID> {

    List<Relance> findByEntrepriseIdOrderByDateRelanceDesc(UUID entrepriseId);

    List<Relance> findByTiersIdAndEntrepriseIdOrderByDateRelanceDesc(UUID tiersId, UUID entrepriseId);

    Optional<Relance> findByIdAndEntrepriseId(UUID id, UUID entrepriseId);

    @Query("""
            SELECT r.tiers.id, COUNT(r), MAX(r.dateRelance)
            FROM Relance r
            WHERE r.entreprise.id = :eid
            GROUP BY r.tiers.id
            """)
    List<Object[]> countParTiers(@Param("eid") UUID entrepriseId);

    @Query("""
            SELECT COUNT(DISTINCT r.tiers.id)
            FROM Relance r
            WHERE r.entreprise.id = :eid AND r.niveau = 3
            """)
    long countTiersAvecMiseEnDemeure(@Param("eid") UUID entrepriseId);
}
