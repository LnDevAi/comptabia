package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.CrmLead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface CrmLeadRepository extends JpaRepository<CrmLead, UUID> {

    List<CrmLead> findByEntrepriseIdOrderByCreatedAtDesc(UUID entrepriseId);

    List<CrmLead> findByEntrepriseIdAndEtapeOrderByUpdatedAtDesc(UUID entrepriseId, CrmLead.Etape etape);

    @Query("SELECT COUNT(l) FROM CrmLead l WHERE l.entreprise.id = :eid AND l.etape NOT IN ('GAGNE','PERDU')")
    long countActifs(@Param("eid") UUID entrepriseId);

    @Query("SELECT COALESCE(SUM(l.valeur * l.probabilite / 100), 0) FROM CrmLead l WHERE l.entreprise.id = :eid AND l.etape NOT IN ('GAGNE','PERDU')")
    BigDecimal valeurPonderee(@Param("eid") UUID entrepriseId);

    @Query("SELECT l.etape, COUNT(l), COALESCE(SUM(l.valeur),0) FROM CrmLead l WHERE l.entreprise.id = :eid GROUP BY l.etape")
    List<Object[]> statsParEtape(@Param("eid") UUID entrepriseId);

    @Query("SELECT COUNT(l) FROM CrmLead l WHERE l.entreprise.id = :eid AND l.etape = 'GAGNE'")
    long countGagnes(@Param("eid") UUID entrepriseId);

    long countByEntrepriseIdAndEtape(UUID entrepriseId, CrmLead.Etape etape);
}
