package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.GroupeSociete;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GroupeSocieteRepository extends JpaRepository<GroupeSociete, UUID> {

    @Query("SELECT g FROM GroupeSociete g WHERE g.createur.id = :uid ORDER BY g.createdAt DESC")
    List<GroupeSociete> findByCreateur(@Param("uid") UUID userId);

    @Query("SELECT g FROM GroupeSociete g LEFT JOIN FETCH g.membres m LEFT JOIN FETCH m.entreprise WHERE g.id = :id")
    Optional<GroupeSociete> findByIdWithMembres(@Param("id") UUID id);
}
