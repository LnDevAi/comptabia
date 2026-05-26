package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.EliminationInterco;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EliminationIntercoRepository extends JpaRepository<EliminationInterco, UUID> {

    List<EliminationInterco> findByGroupeIdAndExercice(UUID groupeId, int exercice);

    void deleteByGroupeIdAndExercice(UUID groupeId, int exercice);
}
