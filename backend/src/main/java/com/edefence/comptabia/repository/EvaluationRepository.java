package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.Evaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EvaluationRepository extends JpaRepository<Evaluation, UUID> {

    @Query("SELECT e FROM Evaluation e WHERE e.entreprise.id = :eid AND e.collaborateur.id = :uid ORDER BY e.annee DESC, e.periode ASC")
    List<Evaluation> findByCollaborateur(@Param("eid") UUID eid, @Param("uid") UUID uid);

    @Query("SELECT e FROM Evaluation e WHERE e.entreprise.id = :eid ORDER BY e.annee DESC, e.collaborateur.nom ASC")
    List<Evaluation> findAllByEntreprise(@Param("eid") UUID eid);

    @Query("SELECT e FROM Evaluation e WHERE e.entreprise.id = :eid AND e.statut = 'SOUMISE' ORDER BY e.createdAt ASC")
    List<Evaluation> findSoumises(@Param("eid") UUID eid);

    @Query("SELECT e FROM Evaluation e WHERE e.id = :id AND e.entreprise.id = :eid")
    Optional<Evaluation> findByIdAndEntreprise(@Param("id") UUID id, @Param("eid") UUID eid);

    @Query("SELECT COUNT(e) FROM Evaluation e WHERE e.entreprise.id = :eid AND e.statut = 'SOUMISE'")
    long countSoumises(@Param("eid") UUID eid);
}
