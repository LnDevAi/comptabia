package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.AcademeCertificat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AcademeCertificatRepository extends JpaRepository<AcademeCertificat, UUID> {

    List<AcademeCertificat> findByUtilisateurIdOrderByDateObtentionDesc(UUID utilisateurId);

    Optional<AcademeCertificat> findByNumeroCertificat(String numero);

    boolean existsByUtilisateurIdAndCoursId(UUID utilisateurId, UUID coursId);
}
