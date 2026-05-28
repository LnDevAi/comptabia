package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.OnboardingTache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface OnboardingTacheRepository extends JpaRepository<OnboardingTache, UUID> {

    @Query("SELECT t FROM OnboardingTache t WHERE t.id = :id AND t.plan.entreprise.id = :eid")
    Optional<OnboardingTache> findByIdAndEntreprise(@Param("id") UUID id, @Param("eid") UUID eid);
}
