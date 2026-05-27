package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.GedDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GedDocumentRepository extends JpaRepository<GedDocument, UUID> {

    Optional<GedDocument> findByIdAndEntrepriseId(UUID id, UUID entrepriseId);

    @Query("""
            SELECT d FROM GedDocument d
            WHERE d.entreprise.id = :eid
              AND (:statut IS NULL OR d.statut = :statut)
              AND (:typeId IS NULL OR d.typeDocument.id = :typeId)
              AND (:q IS NULL
                   OR LOWER(d.titre) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(d.description) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(d.referenceExterne) LIKE LOWER(CONCAT('%', :q, '%')))
            ORDER BY d.createdAt DESC
            """)
    Page<GedDocument> search(@Param("eid")    UUID entrepriseId,
                             @Param("statut") GedDocument.Statut statut,
                             @Param("typeId") UUID typeId,
                             @Param("q")      String q,
                             Pageable pageable);

    @Query("SELECT COUNT(d) FROM GedDocument d WHERE d.entreprise.id = :eid")
    long countByEntrepriseId(@Param("eid") UUID entrepriseId);

    @Query("SELECT COUNT(d) FROM GedDocument d WHERE d.entreprise.id = :eid AND d.statut = :statut")
    long countByEntrepriseIdAndStatut(@Param("eid") UUID entrepriseId,
                                      @Param("statut") GedDocument.Statut statut);

    @Query("""
            SELECT MONTH(d.createdAt), COUNT(d)
            FROM GedDocument d
            WHERE d.entreprise.id = :eid
              AND YEAR(d.createdAt) = :exercice
            GROUP BY MONTH(d.createdAt)
            ORDER BY MONTH(d.createdAt)
            """)
    List<Object[]> creesParMois(@Param("eid") UUID eid, @Param("exercice") int exercice);
}
