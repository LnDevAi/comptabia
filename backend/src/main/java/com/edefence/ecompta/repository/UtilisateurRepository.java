package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UtilisateurRepository extends JpaRepository<Utilisateur, UUID> {
    Optional<Utilisateur> findByEmail(String email);
    boolean existsByEmail(String email);
    List<Utilisateur> findByEntrepriseId(UUID entrepriseId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(u) FROM Utilisateur u WHERE u.entreprise.id = :eid AND u.actif = true")
    long countActifs(@org.springframework.data.repository.query.Param("eid") UUID eid);
}
