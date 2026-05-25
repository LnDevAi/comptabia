package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.Facture;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface FactureRepository extends JpaRepository<Facture, UUID> {

    @Query("""
            SELECT f FROM Facture f LEFT JOIN FETCH f.tiers
            WHERE f.entreprise.id = :eid
            AND (:statut IS NULL OR f.statut = :statut)
            AND (:from   IS NULL OR f.dateFacture >= :from)
            AND (:to     IS NULL OR f.dateFacture <= :to)
            ORDER BY f.dateFacture DESC, f.createdAt DESC
            """)
    Page<Facture> findWithFilters(
            @Param("eid")    UUID eid,
            @Param("statut") Facture.Statut statut,
            @Param("from")   LocalDate from,
            @Param("to")     LocalDate to,
            Pageable pageable);

    boolean existsByNumeroAndEntrepriseId(String numero, UUID entrepriseId);

    @Query("SELECT COUNT(f) FROM Facture f WHERE f.entreprise.id = :eid AND f.statut = :statut")
    long countByStatut(@Param("eid") UUID eid, @Param("statut") Facture.Statut statut);

    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(f.numero, LENGTH(f.numero)-3, 4) AS int)), 0) FROM Facture f WHERE f.entreprise.id = :eid AND f.numero LIKE :prefix")
    Integer maxNumeroSeq(@Param("eid") UUID eid, @Param("prefix") String prefix);

    @Query("""
            SELECT f FROM Facture f
            WHERE f.entreprise.id = :eid AND f.statut = 'EMISE'
            ORDER BY COALESCE(f.dateEcheance, f.dateFacture) ASC
            """)
    List<Facture> findAllEmises(@Param("eid") UUID eid);

    @Query("SELECT COALESCE(SUM(f.montantTtc), 0) FROM Facture f WHERE f.entreprise.id = :eid AND f.statut = 'EMISE'")
    java.math.BigDecimal sumMontantTtcEmises(@Param("eid") UUID eid);
}
