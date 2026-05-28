package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.CrmContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface CrmContactRepository extends JpaRepository<CrmContact, UUID> {

    @Query("""
        SELECT c FROM CrmContact c
        WHERE c.entreprise.id = :eid
          AND (:q IS NULL OR LOWER(c.nom) LIKE LOWER(CONCAT('%',:q,'%'))
               OR LOWER(c.email) LIKE LOWER(CONCAT('%',:q,'%'))
               OR LOWER(c.societe) LIKE LOWER(CONCAT('%',:q,'%')))
        ORDER BY c.createdAt DESC
        """)
    List<CrmContact> search(@Param("eid") UUID entrepriseId, @Param("q") String q);

    List<CrmContact> findByEntrepriseIdAndStatutOrderByCreatedAtDesc(UUID entrepriseId, CrmContact.Statut statut);

    long countByEntrepriseId(UUID entrepriseId);

    @Query("SELECT COUNT(c) FROM CrmContact c WHERE c.entreprise.id = :eid AND c.statut = 'ACTIF'")
    long countActifs(@Param("eid") UUID entrepriseId);
}
