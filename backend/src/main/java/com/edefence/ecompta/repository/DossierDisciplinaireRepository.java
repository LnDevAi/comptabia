package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.DossierDisciplinaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DossierDisciplinaireRepository extends JpaRepository<DossierDisciplinaire, UUID> {

    @Query("SELECT d FROM DossierDisciplinaire d WHERE d.entreprise.id = :eid ORDER BY d.createdAt DESC")
    List<DossierDisciplinaire> findAllByEntreprise(UUID eid);

    @Query("SELECT d FROM DossierDisciplinaire d WHERE d.entreprise.id = :eid AND d.collaborateur.id = :collabId ORDER BY d.dateFaits DESC")
    List<DossierDisciplinaire> findByCollaborateur(UUID eid, UUID collabId);

    @Query("SELECT d FROM DossierDisciplinaire d WHERE d.entreprise.id = :eid AND d.statut = 'EN_COURS' ORDER BY d.createdAt DESC")
    List<DossierDisciplinaire> findEnCours(UUID eid);

    @Query("SELECT d FROM DossierDisciplinaire d WHERE d.id = :id AND d.entreprise.id = :eid")
    Optional<DossierDisciplinaire> findByIdAndEntreprise(UUID id, UUID eid);

    @Query("SELECT COUNT(d) FROM DossierDisciplinaire d WHERE d.entreprise.id = :eid AND d.statut = 'EN_COURS'")
    long countEnCours(@org.springframework.data.repository.query.Param("eid") UUID eid);
}
