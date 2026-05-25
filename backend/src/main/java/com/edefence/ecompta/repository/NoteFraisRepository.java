package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.NoteFrais;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NoteFraisRepository extends JpaRepository<NoteFrais, UUID> {

    @Query("""
        SELECT n FROM NoteFrais n
        WHERE n.entreprise.id = :eid
        ORDER BY n.createdAt DESC
        """)
    List<NoteFrais> findAllByEntreprise(@Param("eid") UUID eid);

    @Query("""
        SELECT n FROM NoteFrais n
        WHERE n.entreprise.id = :eid
          AND n.collaborateur.id = :uid
        ORDER BY n.createdAt DESC
        """)
    List<NoteFrais> findByCollaborateur(@Param("eid") UUID eid, @Param("uid") UUID uid);

    @Query("""
        SELECT n FROM NoteFrais n
        WHERE n.entreprise.id = :eid
          AND n.statut = 'SOUMISE'
        ORDER BY n.createdAt ASC
        """)
    List<NoteFrais> findSoumises(@Param("eid") UUID eid);

    @Query("""
        SELECT n FROM NoteFrais n
        WHERE n.id = :id AND n.entreprise.id = :eid
        """)
    Optional<NoteFrais> findByIdAndEntreprise(@Param("id") UUID id, @Param("eid") UUID eid);
}
