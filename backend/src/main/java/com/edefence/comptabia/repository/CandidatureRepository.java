package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.Candidature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CandidatureRepository extends JpaRepository<Candidature, UUID> {

    @Query("SELECT c FROM Candidature c WHERE c.entreprise.id = :eid ORDER BY c.createdAt DESC")
    List<Candidature> findAllByEntreprise(@Param("eid") UUID eid);

    @Query("SELECT c FROM Candidature c WHERE c.offre.id = :offreId ORDER BY c.createdAt DESC")
    List<Candidature> findByOffre(@Param("offreId") UUID offreId);

    @Query("SELECT c FROM Candidature c WHERE c.id = :id AND c.entreprise.id = :eid")
    Optional<Candidature> findByIdAndEntreprise(@Param("id") UUID id, @Param("eid") UUID eid);
}
