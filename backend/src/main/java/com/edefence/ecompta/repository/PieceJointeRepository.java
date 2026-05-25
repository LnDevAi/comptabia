package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.PieceJointe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PieceJointeRepository extends JpaRepository<PieceJointe, UUID> {

    @Query("""
            SELECT p FROM PieceJointe p
            WHERE p.entreprise.id = :eid
              AND p.typeEntite = :type
              AND p.entiteId   = :entiteId
            ORDER BY p.createdAt ASC
            """)
    List<PieceJointe> findByEntite(
            @Param("eid")      UUID eid,
            @Param("type")     PieceJointe.TypeEntite type,
            @Param("entiteId") UUID entiteId);

    @Query("SELECT p FROM PieceJointe p WHERE p.id = :id AND p.entreprise.id = :eid")
    Optional<PieceJointe> findByIdAndEntreprise(@Param("id") UUID id, @Param("eid") UUID eid);

    @Query("SELECT COUNT(p) FROM PieceJointe p WHERE p.entreprise.id = :eid")
    long countByEntreprise(@Param("eid") UUID eid);
}
