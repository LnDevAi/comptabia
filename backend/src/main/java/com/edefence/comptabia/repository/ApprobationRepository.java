package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.Approbation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ApprobationRepository extends JpaRepository<Approbation, UUID> {

    @Query("""
        SELECT a FROM Approbation a
        WHERE a.ecriture.id = :ecritureId
          AND a.entreprise.id = :eid
        ORDER BY a.createdAt DESC
        """)
    List<Approbation> findByEcriture(@Param("ecritureId") UUID ecritureId,
                                     @Param("eid") UUID eid);
}
