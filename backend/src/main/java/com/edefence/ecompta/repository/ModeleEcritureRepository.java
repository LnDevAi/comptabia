package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.ModeleEcriture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ModeleEcritureRepository extends JpaRepository<ModeleEcriture, UUID> {

    @Query("SELECT m FROM ModeleEcriture m LEFT JOIN FETCH m.lignes l LEFT JOIN FETCH l.compte WHERE m.entreprise.id = :eid ORDER BY m.nom ASC")
    List<ModeleEcriture> findByEntrepriseIdWithLignes(@Param("eid") UUID entrepriseId);

    @Query("SELECT m FROM ModeleEcriture m LEFT JOIN FETCH m.lignes l LEFT JOIN FETCH l.compte WHERE m.id = :id AND m.entreprise.id = :eid")
    Optional<ModeleEcriture> findByIdAndEntrepriseId(@Param("id") UUID id, @Param("eid") UUID entrepriseId);

    boolean existsByNomAndEntrepriseId(String nom, UUID entrepriseId);

    boolean existsByNomAndEntrepriseIdAndIdNot(String nom, UUID entrepriseId, UUID excludeId);
}
