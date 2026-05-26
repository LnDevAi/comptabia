package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.EcheancePret;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface EcheancePretRepository extends JpaRepository<EcheancePret, UUID> {

    @Query("SELECT e FROM EcheancePret e WHERE e.id = :id AND e.pret.entreprise.id = :eid")
    Optional<EcheancePret> findByIdAndEntreprise(@Param("id") UUID id, @Param("eid") UUID eid);
}
