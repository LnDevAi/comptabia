package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.Entreprise;
import com.edefence.comptabia.dto.parametres.ParametresDto;
import com.edefence.comptabia.repository.EntrepriseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ParametresService {

    private final EntrepriseRepository entrepriseRepo;

    @Transactional(readOnly = true)
    public ParametresDto.EntrepriseResponse get(UUID entrepriseId) {
        return toResponse(findOrThrow(entrepriseId));
    }

    @Transactional
    public ParametresDto.EntrepriseResponse update(UUID entrepriseId,
                                                    ParametresDto.UpdateRequest req) {
        Entreprise e = findOrThrow(entrepriseId);

        if (req.nom()       != null) e.setNom(req.nom());
        if (req.pays()      != null) e.setPays(req.pays());
        if (req.nif()       != null) e.setNif(req.nif());
        e.setAdresse(req.adresse());
        e.setTelephone(req.telephone());
        e.setEmail(req.email());
        e.setSiteWeb(req.siteWeb());
        e.setLogoUrl(req.logoUrl());
        if (req.devise()        != null) e.setDevise(req.devise());
        if (req.tauxTvaDefaut() != null) e.setTauxTvaDefaut(req.tauxTvaDefaut());
        if (req.debutExerciceMois() >= 1 && req.debutExerciceMois() <= 12) {
            e.setDebutExerciceMois(req.debutExerciceMois());
        }

        return toResponse(entrepriseRepo.save(e));
    }

    private Entreprise findOrThrow(UUID id) {
        return entrepriseRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Entreprise introuvable"));
    }

    private ParametresDto.EntrepriseResponse toResponse(Entreprise e) {
        return new ParametresDto.EntrepriseResponse(
                e.getId(), e.getNom(), e.getPays(), e.getNif(),
                e.getAdresse(), e.getTelephone(), e.getEmail(),
                e.getSiteWeb(), e.getLogoUrl(),
                e.getDevise(), e.getTauxTvaDefaut(), e.getDebutExerciceMois(),
                e.getSystemeComptable().name(), e.getPlan().name(),
                e.getCodePays(), e.getReferentielComptable());
    }
}
