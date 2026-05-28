package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.MembreGroupe;
import com.edefence.comptabia.domain.MembreGroupeId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MembreGroupeRepository extends JpaRepository<MembreGroupe, MembreGroupeId> {

    List<MembreGroupe> findByIdGroupeId(UUID groupeId);
}
