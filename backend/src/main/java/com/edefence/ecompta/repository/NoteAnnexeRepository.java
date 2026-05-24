package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.NoteAnnexe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NoteAnnexeRepository extends JpaRepository<NoteAnnexe, UUID> {

    List<NoteAnnexe> findByEntrepriseIdAndExerciceOrderByOrdreAscCreatedAtAsc(UUID entrepriseId, int exercice);

    Optional<NoteAnnexe> findByIdAndEntrepriseId(UUID id, UUID entrepriseId);

    @Modifying
    @Query("DELETE FROM NoteAnnexe n WHERE n.id = :id AND n.entreprise.id = :entrepriseId")
    int deleteByIdAndEntrepriseId(@Param("id") UUID id, @Param("entrepriseId") UUID entrepriseId);
}
