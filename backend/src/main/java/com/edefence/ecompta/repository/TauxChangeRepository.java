package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.TauxChange;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TauxChangeRepository extends JpaRepository<TauxChange, UUID> {

    @Query("""
        SELECT t FROM TauxChange t
        WHERE t.entreprise.id = :eid
        ORDER BY t.devise ASC, t.dateTaux DESC
        """)
    List<TauxChange> findAllByEntreprise(@Param("eid") UUID eid);

    @Query("""
        SELECT t FROM TauxChange t
        WHERE t.entreprise.id = :eid
          AND t.devise = :devise
          AND t.dateTaux <= :date
        ORDER BY t.dateTaux DESC
        LIMIT 1
        """)
    Optional<TauxChange> findLatest(@Param("eid") UUID eid,
                                    @Param("devise") String devise,
                                    @Param("date") LocalDate date);

    @Query("""
        SELECT DISTINCT t.devise FROM TauxChange t
        WHERE t.entreprise.id = :eid
        ORDER BY t.devise
        """)
    List<String> findDevisesActives(@Param("eid") UUID eid);

    Optional<TauxChange> findByEntrepriseIdAndDeviseAndDateTaux(UUID entrepriseId,
                                                                  String devise,
                                                                  LocalDate dateTaux);

    @Query("""
        SELECT t FROM TauxChange t
        WHERE t.entreprise.id = :eid
          AND t.devise = :devise
        ORDER BY t.dateTaux DESC
        LIMIT 1
        """)
    Optional<TauxChange> findDernierTaux(@Param("eid") UUID eid, @Param("devise") String devise);
}
