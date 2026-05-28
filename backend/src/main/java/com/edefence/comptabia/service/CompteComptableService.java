package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.CompteComptable;
import com.edefence.comptabia.domain.Entreprise;
import com.edefence.comptabia.dto.compte.CompteDto;
import com.edefence.comptabia.repository.CompteComptableRepository;
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
        return repository.findByEntrepriseIdOrderByNumeroAsc(entrepriseId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CompteDto.Response> findByClasse(UUID entrepriseId, int classe) {
        return repository.findByEntrepriseIdAndClasseOrderByNumeroAsc(entrepriseId, classe)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CompteDto.Response> search(UUID entrepriseId, String q) {
        return repository.search(entrepriseId, q == null || q.isBlank() ? null : q.trim())
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
    public CompteDto.Response update(UUID id, UUID entrepriseId, CompteDto.UpdateRequest dto) {
        CompteComptable compte = findCompteOrThrow(id, entrepriseId);
        if (dto.numero() != null && !dto.numero().isBlank()) {
            if (repository.existsByNumeroAndEntrepriseIdAndIdNot(dto.numero(), entrepriseId, id)) {
                throw new IllegalStateException("Numéro de compte déjà existant : " + dto.numero());
            }
            compte.setNumero(dto.numero());
        }
        if (dto.intitule() != null && !dto.intitule().isBlank()) {
            compte.setIntitule(dto.intitule());
        }
        return toResponse(repository.save(compte));
    }

    @Transactional
    public CompteDto.Response toggleActif(UUID id, UUID entrepriseId) {
        CompteComptable compte = findCompteOrThrow(id, entrepriseId);
        compte.setActif(!compte.isActif());
        return toResponse(repository.save(compte));
    }

    @Transactional
    public void seedSyscohadaForEntreprise(Entreprise entreprise) {
        try {
            ClassPathResource resource = new ClassPathResource("syscohada.json");
            List<Map<String, Object>> entries = objectMapper.readValue(
                    resource.getInputStream(), new TypeReference<>() {});
            List<CompteComptable> comptes = entries.stream()
                    .map(e -> CompteComptable.builder()
                            .numero((String) e.get("numero"))
                            .intitule((String) e.get("intitule"))
                            .classe((Integer) e.get("classe"))
                            .entreprise(entreprise)
                            .build())
                    .toList();
            repository.saveAll(comptes);
        } catch (IOException e) {
            throw new IllegalStateException("Erreur lors du chargement du référentiel SYSCOHADA", e);
        }
    }

    @Transactional
    public void seedSycebnlForEntreprise(Entreprise entreprise) {
        try {
            ClassPathResource resource = new ClassPathResource("sycebnl.json");
            List<Map<String, Object>> entries = objectMapper.readValue(
                    resource.getInputStream(), new TypeReference<>() {});
            List<CompteComptable> comptes = entries.stream()
                    .map(e -> CompteComptable.builder()
                            .numero((String) e.get("numero"))
                            .intitule((String) e.get("intitule"))
                            .classe((Integer) e.get("classe"))
                            .entreprise(entreprise)
                            .build())
                    .toList();
            repository.saveAll(comptes);
        } catch (IOException e) {
            throw new IllegalStateException("Erreur lors du chargement du référentiel SYCEBNL", e);
        }
    }

    @Transactional
    public void seedCimaForEntreprise(Entreprise entreprise) {
        try {
            ClassPathResource resource = new ClassPathResource("cima.json");
            List<Map<String, Object>> entries = objectMapper.readValue(
                    resource.getInputStream(), new TypeReference<>() {});
            List<CompteComptable> comptes = entries.stream()
                    .map(e -> CompteComptable.builder()
                            .numero((String) e.get("numero"))
                            .intitule((String) e.get("intitule"))
                            .classe((Integer) e.get("classe"))
                            .entreprise(entreprise)
                            .build())
                    .toList();
            repository.saveAll(comptes);
        } catch (IOException e) {
            throw new IllegalStateException("Erreur lors du chargement du référentiel CIMA", e);
        }
    }

    @Transactional
    public void seedSfdForEntreprise(Entreprise entreprise) {
        try {
            ClassPathResource resource = new ClassPathResource("sfd.json");
            List<Map<String, Object>> entries = objectMapper.readValue(
                    resource.getInputStream(), new TypeReference<>() {});
            List<CompteComptable> comptes = entries.stream()
                    .map(e -> CompteComptable.builder()
                            .numero((String) e.get("numero"))
                            .intitule((String) e.get("intitule"))
                            .classe((Integer) e.get("classe"))
                            .entreprise(entreprise)
                            .build())
                    .toList();
            repository.saveAll(comptes);
        } catch (IOException e) {
            throw new IllegalStateException("Erreur lors du chargement du référentiel SFD", e);
        }
    }

    @Transactional
    public void seedFinanceIslamiqueForEntreprise(Entreprise entreprise) {
        try {
            ClassPathResource resource = new ClassPathResource("financeislamique.json");
            List<Map<String, Object>> entries = objectMapper.readValue(
                    resource.getInputStream(), new TypeReference<>() {});
            List<CompteComptable> comptes = entries.stream()
                    .map(e -> CompteComptable.builder()
                            .numero((String) e.get("numero"))
                            .intitule((String) e.get("intitule"))
                            .classe((Integer) e.get("classe"))
                            .entreprise(entreprise)
                            .build())
                    .toList();
            repository.saveAll(comptes);
        } catch (IOException e) {
            throw new IllegalStateException("Erreur lors du chargement du référentiel Finance Islamique", e);
        }
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
