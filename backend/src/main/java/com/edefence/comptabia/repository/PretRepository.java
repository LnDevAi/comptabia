package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.Pret;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PretRepository extends JpaRepository<Pret, UUID> {

    @Query("SELECT p FROM Pret p WHERE p.entreprise.id = :eid ORDER BY p.createdAt DESC")
    List<Pret> findAllByEntreprise(@Param("eid") UUID eid);

    @Query("SELECT p FROM Pret p WHERE p.collaborateur.id = :collabId AND p.entreprise.id = :eid ORDER BY p.createdAt DESC")
    List<Pret> findByCollaborateur(@Param("collabId") UUID collabId, @Param("eid") UUID eid);

    @Query("SELECT p FROM Pret p WHERE p.id = :id AND p.entreprise.id = :eid")
    Optional<Pret> findByIdAndEntreprise(@Param("id") UUID id, @Param("eid") UUID eid);
}
