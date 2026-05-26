package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.CrmDestinataire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface CrmDestinataireRepository extends JpaRepository<CrmDestinataire, UUID> {

    List<CrmDestinataire> findByCampagneIdOrderByCreatedAtAsc(UUID campagneId);

    long countByCampagneId(UUID campagneId);

    @Modifying
    @Query("UPDATE CrmDestinataire d SET d.statut = 'OUVERT', d.openedAt = CURRENT_TIMESTAMP WHERE d.id = :id")
    void marquerOuvert(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE CrmDestinataire d SET d.statut = 'CLIQUE', d.openedAt = COALESCE(d.openedAt, CURRENT_TIMESTAMP) WHERE d.id = :id")
    void marquerClique(@Param("id") UUID id);
}
