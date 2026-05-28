package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.ReferentielFiscalPays;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReferentielFiscalPaysRepository extends JpaRepository<ReferentielFiscalPays, String> {
    Optional<ReferentielFiscalPays> findByCode(String code);
}
