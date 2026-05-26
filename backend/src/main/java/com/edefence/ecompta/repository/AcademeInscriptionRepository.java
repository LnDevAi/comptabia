package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.AcademeInscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AcademeInscriptionRepository extends JpaRepository<AcademeInscription, UUID> {

    Optional<AcademeInscription> findByUtilisateurIdAndCoursId(UUID utilisateurId, UUID coursId);

    List<AcademeInscription> findByUtilisateurIdOrderByDateDebutDesc(UUID utilisateurId);

    @Query("SELECT COUNT(i) FROM AcademeInscription i WHERE i.cours.id = :coursId AND i.statut = 'TERMINE'")
    long countTerminesForCours(@Param("coursId") UUID coursId);

    @Query("""
        SELECT i.cours.id FROM AcademeInscription i
        WHERE i.utilisateur.id = :uid
        """)
    List<UUID> findCoursIdsByUser(@Param("uid") UUID utilisateurId);
}
