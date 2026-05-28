package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.DocumentRh;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DocumentRhRepository extends JpaRepository<DocumentRh, UUID> {

    @Query("SELECT d FROM DocumentRh d WHERE d.entreprise.id = :eid ORDER BY d.createdAt DESC")
    List<DocumentRh> findAllByEntreprise(@Param("eid") UUID eid);

    @Query("SELECT d FROM DocumentRh d WHERE d.entreprise.id = :eid AND d.collaborateur.id = :uid ORDER BY d.createdAt DESC")
    List<DocumentRh> findByCollaborateur(@Param("eid") UUID eid, @Param("uid") UUID uid);

    @Query("SELECT d FROM DocumentRh d WHERE d.id = :id AND d.entreprise.id = :eid")
    Optional<DocumentRh> findByIdAndEntreprise(@Param("id") UUID id, @Param("eid") UUID eid);

    @Query("SELECT d FROM DocumentRh d WHERE d.entreprise.id = :eid AND d.dateExpiration IS NOT NULL AND d.dateExpiration <= :seuil AND d.statut = 'VALIDE' ORDER BY d.dateExpiration ASC")
    List<DocumentRh> findExpirantAvant(@Param("eid") UUID eid, @Param("seuil") LocalDate seuil);
}
