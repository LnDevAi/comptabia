package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.AcademeProgressionChapitre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AcademeProgressionChapitreRepository extends JpaRepository<AcademeProgressionChapitre, UUID> {

    boolean existsByInscriptionIdAndChapitreId(UUID inscriptionId, UUID chapitreId);

    List<AcademeProgressionChapitre> findByInscriptionId(UUID inscriptionId);

    @Query("SELECT COUNT(p) FROM AcademeProgressionChapitre p WHERE p.inscription.id = :inscriptionId")
    long countByInscription(@Param("inscriptionId") UUID inscriptionId);

    Optional<AcademeProgressionChapitre> findByInscriptionIdAndChapitreId(UUID inscriptionId, UUID chapitreId);
}
