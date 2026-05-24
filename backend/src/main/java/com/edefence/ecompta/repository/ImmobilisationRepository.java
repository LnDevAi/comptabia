package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.Immobilisation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ImmobilisationRepository extends JpaRepository<Immobilisation, UUID> {

    boolean existsByCodeAndEntrepriseId(String code, UUID entrepriseId);

    Optional<Immobilisation> findByIdAndEntrepriseId(UUID id, UUID entrepriseId);

    @Query("""
            SELECT i FROM Immobilisation i
            WHERE i.entreprise.id = :eid
              AND (:categorie IS NULL OR i.categorie = :categorie)
              AND (:statut IS NULL OR i.statut = :statut)
              AND (:search IS NULL
                   OR LOWER(i.designation) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(i.code) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY i.dateAcquisition DESC
            """)
    Page<Immobilisation> search(
            @Param("eid")       UUID entrepriseId,
            @Param("categorie") Immobilisation.Categorie categorie,
            @Param("statut")    Immobilisation.Statut statut,
            @Param("search")    String search,
            Pageable pageable);

    @Query("""
            SELECT COUNT(i) FROM Immobilisation i
            WHERE i.entreprise.id = :eid AND i.statut = 'ACTIF'
            """)
    long countActifs(@Param("eid") UUID entrepriseId);

    @Query("""
            SELECT COALESCE(SUM(i.valeurBrute), 0) FROM Immobilisation i
            WHERE i.entreprise.id = :eid AND i.statut = 'ACTIF'
            """)
    java.math.BigDecimal sumValeurBrute(@Param("eid") UUID entrepriseId);
}
