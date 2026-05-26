package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.OnboardingPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OnboardingPlanRepository extends JpaRepository<OnboardingPlan, UUID> {

    @Query("SELECT p FROM OnboardingPlan p WHERE p.entreprise.id = :eid ORDER BY p.createdAt DESC")
    List<OnboardingPlan> findAllByEntreprise(@Param("eid") UUID eid);

    @Query("SELECT p FROM OnboardingPlan p WHERE p.id = :id AND p.entreprise.id = :eid")
    Optional<OnboardingPlan> findByIdAndEntreprise(@Param("id") UUID id, @Param("eid") UUID eid);
}
