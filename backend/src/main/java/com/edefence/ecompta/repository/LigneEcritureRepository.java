package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.LigneEcriture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.UUID;

public interface LigneEcritureRepository extends JpaRepository<LigneEcriture, UUID> {

    @Query("SELECT COALESCE(SUM(l.debit),0) FROM LigneEcriture l WHERE l.ecriture.id = :ecritureId")
    BigDecimal sumDebitByEcriture(@Param("ecritureId") UUID ecritureId);

    @Query("SELECT COALESCE(SUM(l.credit),0) FROM LigneEcriture l WHERE l.ecriture.id = :ecritureId")
    BigDecimal sumCreditByEcriture(@Param("ecritureId") UUID ecritureId);
}
