package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.Regularisation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RegularisationRepository extends JpaRepository<Regularisation, UUID> {

    @Query("""
        SELECT r FROM Regularisation r
        WHERE r.entreprise.id = :eid AND r.exercice = :exercice
        ORDER BY r.type, r.dateRegularisation
        """)
    List<Regularisation> findByExercice(@Param("eid") UUID eid, @Param("exercice") int exercice);

    @Query("""
        SELECT r FROM Regularisation r
        WHERE r.id = :id AND r.entreprise.id = :eid
        """)
    Optional<Regularisation> findByIdAndEntreprise(@Param("id") UUID id, @Param("eid") UUID eid);
}
