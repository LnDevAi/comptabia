package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.CompteComptable;
import com.edefence.ecompta.domain.Entreprise;
import com.edefence.ecompta.dto.compte.CompteDto;
import com.edefence.ecompta.repository.CompteComptableRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CompteComptableService {

    private final CompteComptableRepository repository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<CompteDto.Response> findAll(UUID entrepriseId) {
        return repository.findByEntrepriseIdAndActifTrueOrderByNumeroAsc(entrepriseId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CompteDto.Response> findByClasse(UUID entrepriseId, int classe) {
        return repository.findByEntrepriseIdAndClasseOrderByNumeroAsc(entrepriseId, classe)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public CompteDto.Response create(UUID entrepriseId, CompteDto.Request dto, Entreprise entreprise) {
        if (repository.existsByNumeroAndEntrepriseId(dto.numero(), entrepriseId)) {
            throw new IllegalStateException("Numéro de compte déjà existant : " + dto.numero());
        }
        CompteComptable compte = repository.save(
                CompteComptable.builder()
                        .numero(dto.numero())
                        .intitule(dto.intitule())
                        .classe(dto.classe())
                        .entreprise(entreprise)
                        .build()
        );
        return toResponse(compte);
    }

    @Transactional
    public void seedSyscohadaForEntreprise(Entreprise entreprise) {
        try {
            ClassPathResource resource = new ClassPathResource("syscohada.json");
            List<Map<String, Object>> entries = objectMapper.readValue(
                    resource.getInputStream(), new TypeReference<>() {});

            List<CompteComptable> comptes = entries.stream()
                    .map(entry -> CompteComptable.builder()
                            .numero((String) entry.get("numero"))
                            .intitule((String) entry.get("intitule"))
                            .classe((Integer) entry.get("classe"))
                            .entreprise(entreprise)
                            .build())
                    .toList();
            repository.saveAll(comptes);
        } catch (IOException e) {
            throw new IllegalStateException("Erreur lors du chargement du référentiel SYSCOHADA", e);
        }
    }

    @Transactional
    public void toggleActif(UUID id, UUID entrepriseId) {
        CompteComptable compte = findCompteOrThrow(id, entrepriseId);
        compte.setActif(!compte.isActif());
        repository.save(compte);
    }

    private CompteComptable findCompteOrThrow(UUID id, UUID entrepriseId) {
        CompteComptable compte = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Compte introuvable : " + id));
        if (!compte.getEntreprise().getId().equals(entrepriseId)) {
            throw new EntityNotFoundException("Compte introuvable : " + id);
        }
        return compte;
    }

    private CompteDto.Response toResponse(CompteComptable c) {
        return new CompteDto.Response(c.getId(), c.getNumero(), c.getIntitule(),
                c.getClasse(), c.isActif(), c.getCreatedAt());
    }
}
