package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.AcademeCours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AcademeCoursRepository extends JpaRepository<AcademeCours, UUID> {

    List<AcademeCours> findByActifTrueOrderByCategorie();

    @Query("""
        SELECT c FROM AcademeCours c
        WHERE c.actif = TRUE
          AND (:categorie IS NULL OR CAST(c.categorie AS string) = :categorie)
          AND (:niveau IS NULL OR CAST(c.niveau AS string) = :niveau)
        ORDER BY c.categorie, c.niveau, c.titre
        """)
    List<AcademeCours> findFiltered(@Param("categorie") String categorie, @Param("niveau") String niveau);
}
