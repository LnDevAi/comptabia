package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.GedDocumentVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface GedDocumentVersionRepository extends JpaRepository<GedDocumentVersion, UUID> {

    @Query("SELECT MAX(v.versionNumero) FROM GedDocumentVersion v WHERE v.document.id = :docId")
    Optional<Integer> findMaxVersionNumero(@Param("docId") UUID docId);

    @Query("SELECT COUNT(v) FROM GedDocumentVersion v WHERE v.document.id = :docId")
    long countByDocumentId(@Param("docId") UUID docId);

    @Query("SELECT COALESCE(SUM(v.taille), 0) FROM GedDocumentVersion v WHERE v.document.entreprise.id = :eid")
    long sumTailleByEntrepriseId(@Param("eid") UUID entrepriseId);

    @Query("SELECT COUNT(v) FROM GedDocumentVersion v WHERE v.document.entreprise.id = :eid")
    long countByEntrepriseId(@Param("eid") UUID entrepriseId);

    @Query("""
            SELECT v FROM GedDocumentVersion v
            WHERE v.document.id = :docId
            ORDER BY v.versionNumero DESC
            LIMIT 1
            """)
    Optional<GedDocumentVersion> findLatestByDocumentId(@Param("docId") UUID docId);

    Optional<GedDocumentVersion> findByIdAndDocument_Entreprise_Id(UUID id, UUID entrepriseId);
}
