package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.Formation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FormationRepository extends JpaRepository<Formation, UUID> {

    @Query("SELECT f FROM Formation f WHERE f.entreprise.id = :eid ORDER BY f.annee DESC, f.titre")
    List<Formation> findAllByEntreprise(UUID eid);

    @Query("SELECT f FROM Formation f WHERE f.entreprise.id = :eid AND f.annee = :annee ORDER BY f.titre")
    List<Formation> findByAnnee(UUID eid, int annee);

    @Query("SELECT f FROM Formation f WHERE f.id = :id AND f.entreprise.id = :eid")
    Optional<Formation> findByIdAndEntreprise(UUID id, UUID eid);
}
