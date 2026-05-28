package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.CompteComptable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CompteComptableRepository extends JpaRepository<CompteComptable, UUID> {

    List<CompteComptable> findByEntrepriseIdAndActifTrueOrderByNumeroAsc(UUID entrepriseId);

    List<CompteComptable> findByEntrepriseIdOrderByNumeroAsc(UUID entrepriseId);

    List<CompteComptable> findByEntrepriseIdAndClasseOrderByNumeroAsc(UUID entrepriseId, int classe);

    Optional<CompteComptable> findByNumeroAndEntrepriseId(String numero, UUID entrepriseId);

    boolean existsByNumeroAndEntrepriseId(String numero, UUID entrepriseId);

    boolean existsByNumeroAndEntrepriseIdAndIdNot(String numero, UUID entrepriseId, UUID excludeId);

    long countByEntrepriseId(UUID entrepriseId);

    @Query("""
            SELECT c FROM CompteComptable c
            WHERE c.entreprise.id = :entrepriseId
            AND (:q IS NULL OR LOWER(c.numero) LIKE LOWER(CONCAT('%',:q,'%'))
                           OR LOWER(c.intitule) LIKE LOWER(CONCAT('%',:q,'%')))
            ORDER BY c.numero ASC
            """)
    List<CompteComptable> search(@Param("entrepriseId") UUID entrepriseId, @Param("q") String q);
}
