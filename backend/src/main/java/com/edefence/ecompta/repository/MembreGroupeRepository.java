package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.MembreGroupe;
import com.edefence.ecompta.domain.MembreGroupeId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MembreGroupeRepository extends JpaRepository<MembreGroupe, MembreGroupeId> {

    List<MembreGroupe> findByIdGroupeId(UUID groupeId);
}
