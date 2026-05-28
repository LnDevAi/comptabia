package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.RefCotisationSociale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface RefCotisationSocialeRepository extends JpaRepository<RefCotisationSociale, UUID> {

    @Query("SELECT r FROM RefCotisationSociale r WHERE r.codePays = :pays ORDER BY r.codeOrganisme ASC, r.ordre ASC")
    List<RefCotisationSociale> findByPays(@Param("pays") String pays);

    @Query("SELECT r FROM RefCotisationSociale r WHERE r.codePays = :pays AND r.codeOrganisme = :org ORDER BY r.ordre ASC")
    List<RefCotisationSociale> findByPaysAndOrganisme(@Param("pays") String pays, @Param("org") String org);
}
