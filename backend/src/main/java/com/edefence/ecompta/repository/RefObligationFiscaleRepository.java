package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.RefObligationFiscale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface RefObligationFiscaleRepository extends JpaRepository<RefObligationFiscale, UUID> {

    @Query("SELECT r FROM RefObligationFiscale r WHERE r.codePays = :pays ORDER BY r.ordre ASC")
    List<RefObligationFiscale> findByPays(@Param("pays") String pays);
}
