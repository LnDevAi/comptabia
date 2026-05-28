package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.AssembleeGenerale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AssembleeGeneraleRepository extends JpaRepository<AssembleeGenerale, UUID> {

    List<AssembleeGenerale> findByEntrepriseIdOrderByDateAssembleeDesc(UUID entrepriseId);

    Optional<AssembleeGenerale> findByIdAndEntrepriseId(UUID id, UUID entrepriseId);

    @Query("""
            SELECT a FROM AssembleeGenerale a
            LEFT JOIN FETCH a.resolutions
            WHERE a.id = :id AND a.entreprise.id = :eid
            """)
    Optional<AssembleeGenerale> findByIdWithResolutions(@Param("id") UUID id, @Param("eid") UUID entrepriseId);

    @Query("""
            SELECT a FROM AssembleeGenerale a
            LEFT JOIN FETCH a.resolutions
            WHERE a.entreprise.id = :eid
            ORDER BY a.dateAssemblee DESC
            """)
    List<AssembleeGenerale> findAllWithResolutions(@Param("eid") UUID entrepriseId);
}
