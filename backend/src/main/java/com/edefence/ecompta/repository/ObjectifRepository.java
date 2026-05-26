package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.Objectif;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ObjectifRepository extends JpaRepository<Objectif, UUID> {

    @Query("SELECT o FROM Objectif o WHERE o.entreprise.id = :eid AND o.collaborateur.id = :uid AND o.annee = :annee ORDER BY o.createdAt ASC")
    List<Objectif> findByCollaborateurAndAnnee(@Param("eid") UUID eid, @Param("uid") UUID uid, @Param("annee") int annee);

    @Query("SELECT o FROM Objectif o WHERE o.entreprise.id = :eid AND o.annee = :annee ORDER BY o.collaborateur.nom ASC, o.createdAt ASC")
    List<Objectif> findByAnnee(@Param("eid") UUID eid, @Param("annee") int annee);

    @Query("SELECT o FROM Objectif o WHERE o.id = :id AND o.entreprise.id = :eid")
    Optional<Objectif> findByIdAndEntreprise(@Param("id") UUID id, @Param("eid") UUID eid);
}
