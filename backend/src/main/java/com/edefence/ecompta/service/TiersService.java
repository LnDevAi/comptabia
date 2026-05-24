package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.Entreprise;
import com.edefence.ecompta.domain.Tiers;
import com.edefence.ecompta.dto.tiers.TiersDto;
import com.edefence.ecompta.repository.EntrepriseRepository;
import com.edefence.ecompta.repository.TiersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TiersService {

    private final TiersRepository tiersRepo;
    private final EntrepriseRepository entrepriseRepo;

    // ─── Queries ─────────────────────────────────────────────────────────────

    public Page<TiersDto.Response> findAll(UUID entrepriseId,
                                           Tiers.TypeTiers type,
                                           String search,
                                           boolean actifOnly,
                                           Pageable pageable) {
        String searchParam = (search != null && !search.isBlank()) ? search.trim() : null;
        return tiersRepo.search(entrepriseId, type, searchParam, actifOnly, pageable)
                        .map(this::toResponse);
    }

    public TiersDto.Stats stats(UUID entrepriseId) {
        long total       = tiersRepo.countByEntrepriseId(entrepriseId);
        long clients     = tiersRepo.countByEntrepriseIdAndType(entrepriseId, Tiers.TypeTiers.CLIENT);
        long fournisseurs= tiersRepo.countByEntrepriseIdAndType(entrepriseId, Tiers.TypeTiers.FOURNISSEUR);
        long actifs      = tiersRepo.countByEntrepriseIdAndActifTrue(entrepriseId);
        return new TiersDto.Stats(total, clients, fournisseurs, actifs);
    }

    // ─── Mutations ────────────────────────────────────────────────────────────

    @Transactional
    public TiersDto.Response create(UUID entrepriseId, TiersDto.Request dto) {
        if (tiersRepo.existsByCodeAndEntrepriseId(dto.code(), entrepriseId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Un tiers avec le code « " + dto.code() + " » existe déjà.");
        }
        Entreprise entreprise = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entreprise introuvable"));

        Tiers tiers = Tiers.builder()
                .entreprise(entreprise)
                .type(dto.type())
                .code(dto.code().toUpperCase().trim())
                .nom(dto.nom().trim())
                .email(dto.email())
                .telephone(dto.telephone())
                .adresse(dto.adresse())
                .compteNumero(dto.compteNumero())
                .build();

        return toResponse(tiersRepo.save(tiers));
    }

    @Transactional
    public TiersDto.Response update(UUID id, UUID entrepriseId, TiersDto.Request dto) {
        Tiers tiers = findOrThrow(id, entrepriseId);

        // Code uniqueness check (exclude self)
        if (!tiers.getCode().equalsIgnoreCase(dto.code()) &&
                tiersRepo.existsByCodeAndEntrepriseId(dto.code(), entrepriseId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Un tiers avec le code « " + dto.code() + " » existe déjà.");
        }

        tiers.setType(dto.type());
        tiers.setCode(dto.code().toUpperCase().trim());
        tiers.setNom(dto.nom().trim());
        tiers.setEmail(dto.email());
        tiers.setTelephone(dto.telephone());
        tiers.setAdresse(dto.adresse());
        tiers.setCompteNumero(dto.compteNumero());

        return toResponse(tiersRepo.save(tiers));
    }

    @Transactional
    public TiersDto.Response toggleActif(UUID id, UUID entrepriseId) {
        Tiers tiers = findOrThrow(id, entrepriseId);
        tiers.setActif(!tiers.isActif());
        return toResponse(tiersRepo.save(tiers));
    }

    @Transactional
    public void delete(UUID id, UUID entrepriseId) {
        Tiers tiers = findOrThrow(id, entrepriseId);
        tiersRepo.delete(tiers);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private Tiers findOrThrow(UUID id, UUID entrepriseId) {
        return tiersRepo.findByIdAndEntrepriseId(id, entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tiers introuvable"));
    }

    private TiersDto.Response toResponse(Tiers t) {
        return new TiersDto.Response(
                t.getId(), t.getCode(), t.getNom(), t.getType().name(),
                t.getEmail(), t.getTelephone(), t.getAdresse(),
                t.getCompteNumero(), t.isActif(), t.getCreatedAt()
        );
    }
}
