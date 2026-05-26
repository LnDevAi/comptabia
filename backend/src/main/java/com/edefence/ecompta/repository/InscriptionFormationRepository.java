package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.InscriptionFormation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InscriptionFormationRepository extends JpaRepository<InscriptionFormation, UUID> {

    @Query("SELECT i FROM InscriptionFormation i WHERE i.session.id = :sessionId ORDER BY i.collaborateur.nom")
    List<InscriptionFormation> findBySession(UUID sessionId);

    @Query("SELECT i FROM InscriptionFormation i WHERE i.collaborateur.id = :collabId ORDER BY i.session.dateDebut DESC")
    List<InscriptionFormation> findByCollaborateur(UUID collabId);

    @Query("SELECT i FROM InscriptionFormation i WHERE i.session.entreprise.id = :eid AND i.collaborateur.id = :collabId ORDER BY i.session.dateDebut DESC")
    List<InscriptionFormation> findByEntrepriseAndCollaborateur(UUID eid, UUID collabId);

    @Query("SELECT i FROM InscriptionFormation i WHERE i.id = :id AND i.session.entreprise.id = :eid")
    Optional<InscriptionFormation> findByIdAndEntreprise(UUID id, UUID eid);

    boolean existsBySessionIdAndCollaborateurId(UUID sessionId, UUID collaborateurId);
}
