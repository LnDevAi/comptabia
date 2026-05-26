package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.DeclarationFiscale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DeclarationFiscaleRepository extends JpaRepository<DeclarationFiscale, UUID> {

    @Query("SELECT d FROM DeclarationFiscale d WHERE d.entreprise.id = :eid ORDER BY d.dateEcheance ASC")
    List<DeclarationFiscale> findAllByEntreprise(@Param("eid") UUID eid);

    @Query("SELECT d FROM DeclarationFiscale d WHERE d.entreprise.id = :eid AND d.periode LIKE :prefix% ORDER BY d.dateEcheance ASC")
    List<DeclarationFiscale> findByAnnee(@Param("eid") UUID eid, @Param("prefix") String prefix);

    @Query("SELECT d FROM DeclarationFiscale d WHERE d.id = :id AND d.entreprise.id = :eid")
    Optional<DeclarationFiscale> findByIdAndEntreprise(@Param("id") UUID id, @Param("eid") UUID eid);
}
