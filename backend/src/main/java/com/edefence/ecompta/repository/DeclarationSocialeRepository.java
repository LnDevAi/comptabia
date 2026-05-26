package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.DeclarationSociale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DeclarationSocialeRepository extends JpaRepository<DeclarationSociale, UUID> {

    @Query("SELECT d FROM DeclarationSociale d WHERE d.entreprise.id = :eid ORDER BY d.periode DESC, d.codeOrganisme ASC")
    List<DeclarationSociale> findAllByEntreprise(@Param("eid") UUID eid);

    @Query("SELECT d FROM DeclarationSociale d WHERE d.entreprise.id = :eid AND d.periode LIKE :prefix% ORDER BY d.periode DESC")
    List<DeclarationSociale> findByAnnee(@Param("eid") UUID eid, @Param("prefix") String prefix);

    @Query("SELECT d FROM DeclarationSociale d WHERE d.id = :id AND d.entreprise.id = :eid")
    Optional<DeclarationSociale> findByIdAndEntreprise(@Param("id") UUID id, @Param("eid") UUID eid);
}
