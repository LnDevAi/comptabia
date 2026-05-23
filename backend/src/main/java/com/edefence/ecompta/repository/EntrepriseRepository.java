package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.Entreprise;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface EntrepriseRepository extends JpaRepository<Entreprise, UUID> {
    boolean existsByNom(String nom);
}
