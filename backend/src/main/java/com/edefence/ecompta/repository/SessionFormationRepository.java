package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.SessionFormation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SessionFormationRepository extends JpaRepository<SessionFormation, UUID> {

    @Query("SELECT s FROM SessionFormation s WHERE s.formation.id = :formationId ORDER BY s.dateDebut")
    List<SessionFormation> findByFormation(UUID formationId);

    @Query("SELECT s FROM SessionFormation s WHERE s.entreprise.id = :eid ORDER BY s.dateDebut DESC")
    List<SessionFormation> findAllByEntreprise(UUID eid);

    @Query("SELECT s FROM SessionFormation s WHERE s.id = :id AND s.entreprise.id = :eid")
    Optional<SessionFormation> findByIdAndEntreprise(UUID id, UUID eid);

    @Query("SELECT COUNT(i) FROM InscriptionFormation i WHERE i.session.id = :sessionId")
    long countInscrits(UUID sessionId);

    @Query("SELECT COUNT(s) FROM SessionFormation s WHERE s.entreprise.id = :eid AND s.statut = 'EN_COURS'")
    long countEnCours(@org.springframework.data.repository.query.Param("eid") UUID eid);
}
