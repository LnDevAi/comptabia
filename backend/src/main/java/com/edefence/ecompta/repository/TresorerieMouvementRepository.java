package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.TresorerieMouvement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TresorerieMouvementRepository extends JpaRepository<TresorerieMouvement, UUID> {

    Page<TresorerieMouvement> findByEntrepriseIdOrderByDateOperationDescCreatedAtDesc(
            UUID entrepriseId, Pageable pageable);

    @Query("""
            SELECT m FROM TresorerieMouvement m
            WHERE m.entreprise.id = :eid
              AND (:compteId IS NULL OR m.compte.id = :compteId)
            ORDER BY m.dateOperation DESC, m.createdAt DESC
            """)
    Page<TresorerieMouvement> search(@Param("eid") UUID entrepriseId,
                                     @Param("compteId") UUID compteId,
                                     Pageable pageable);

    @Query("""
            SELECT m FROM TresorerieMouvement m
            WHERE m.entreprise.id = :eid
            ORDER BY m.createdAt DESC
            LIMIT 10
            """)
    List<TresorerieMouvement> findRecents(@Param("eid") UUID entrepriseId);

    Optional<TresorerieMouvement> findByIdAndEntrepriseId(UUID id, UUID entrepriseId);

    @Query("""
            SELECT MONTH(m.dateOperation),
                   COALESCE(SUM(CASE WHEN m.typeMouvement IN :entrees THEN m.montant ELSE 0 END), 0),
                   COALESCE(SUM(CASE WHEN m.typeMouvement IN :sorties THEN m.montant ELSE 0 END), 0)
            FROM TresorerieMouvement m
            WHERE m.entreprise.id = :eid
              AND m.dateOperation >= :from AND m.dateOperation <= :to
            GROUP BY MONTH(m.dateOperation)
            ORDER BY MONTH(m.dateOperation)
            """)
    List<Object[]> fluxMensuel(
            @Param("eid") UUID eid,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("entrees") List<TresorerieMouvement.TypeMouvement> entrees,
            @Param("sorties") List<TresorerieMouvement.TypeMouvement> sorties);
}
