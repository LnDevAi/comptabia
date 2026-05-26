package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.OffreEmploi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OffreEmploiRepository extends JpaRepository<OffreEmploi, UUID> {

    @Query("SELECT o FROM OffreEmploi o WHERE o.entreprise.id = :eid ORDER BY o.createdAt DESC")
    List<OffreEmploi> findAllByEntreprise(@Param("eid") UUID eid);

    @Query("SELECT o FROM OffreEmploi o WHERE o.id = :id AND o.entreprise.id = :eid")
    Optional<OffreEmploi> findByIdAndEntreprise(@Param("id") UUID id, @Param("eid") UUID eid);
}
