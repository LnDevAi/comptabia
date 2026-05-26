package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.Associe;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AssocieRepository extends JpaRepository<Associe, UUID> {

    List<Associe> findByEntrepriseIdOrderByNomAsc(UUID entrepriseId);

    Optional<Associe> findByIdAndEntrepriseId(UUID id, UUID entrepriseId);

    Optional<Associe> findByTokenPortail(UUID token);
}
