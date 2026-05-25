package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.Devis;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.UUID;

public interface DevisRepository extends JpaRepository<Devis, UUID> {

    @Query("""
            SELECT d FROM Devis d LEFT JOIN FETCH d.tiers
            WHERE d.entreprise.id = :eid
            AND (:statut IS NULL OR d.statut = :statut)
            AND (:from   IS NULL OR d.dateDevis >= :from)
            AND (:to     IS NULL OR d.dateDevis <= :to)
            ORDER BY d.dateDevis DESC, d.createdAt DESC
            """)
    Page<Devis> findWithFilters(
            @Param("eid")    UUID eid,
            @Param("statut") Devis.Statut statut,
            @Param("from")   LocalDate from,
            @Param("to")     LocalDate to,
            Pageable pageable);

    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(d.numero, LENGTH(d.numero)-3, 4) AS int)), 0) FROM Devis d WHERE d.entreprise.id = :eid AND d.numero LIKE :prefix")
    Integer maxNumeroSeq(@Param("eid") UUID eid, @Param("prefix") String prefix);
}
