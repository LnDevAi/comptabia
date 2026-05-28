package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.Entreprise;
import com.edefence.comptabia.domain.Tiers;
import com.edefence.comptabia.dto.tiers.TiersDto;
import com.edefence.comptabia.repository.EntrepriseRepository;
import com.edefence.comptabia.repository.TiersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TiersService {

    private final TiersRepository tiersRepo;
    private final EntrepriseRepository entrepriseRepo;
    private final AuditService auditSvc;

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

    public TiersDto.StatsEvolution getStatsEvolution(UUID eid, int exercice) {
        if (exercice <= 0) exercice = LocalDate.now().getYear();
        String[] moisFr = {"Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"};
        List<Object[]> raw = tiersRepo.creesParMoisEtType(eid, exercice);
        Map<Integer, Map<String, Long>> byMois = new HashMap<>();
        for (Object[] r : raw) {
            int mois  = ((Number) r[0]).intValue();
            String tp = r[1].toString();
            long nb   = ((Number) r[2]).longValue();
            byMois.computeIfAbsent(mois, k -> new HashMap<>()).put(tp, nb);
        }
        List<TiersDto.MoisTiers> mensuel = new ArrayList<>();
        long total = 0;
        for (int m = 1; m <= 12; m++) {
            Map<String, Long> bt = byMois.getOrDefault(m, new HashMap<>());
            long cli = bt.getOrDefault("CLIENT",      0L);
            long fou = bt.getOrDefault("FOURNISSEUR", 0L);
            long aut = bt.getOrDefault("AUTRE",       0L);
            mensuel.add(new TiersDto.MoisTiers(m, moisFr[m - 1], cli, fou, aut));
            total += cli + fou + aut;
        }
        return new TiersDto.StatsEvolution(exercice, total, mensuel);
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

        TiersDto.Response result = toResponse(tiersRepo.save(tiers));
        auditSvc.logCurrent(entrepriseId, "TIERS_CREE", "TIERS", tiers.getCode() + " — " + tiers.getNom());
        return result;
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

        TiersDto.Response result = toResponse(tiersRepo.save(tiers));
        auditSvc.logCurrent(entrepriseId, "TIERS_MODIFIE", "TIERS", tiers.getCode() + " — " + tiers.getNom());
        return result;
    }

    @Transactional
    public TiersDto.Response toggleActif(UUID id, UUID entrepriseId) {
        Tiers tiers = findOrThrow(id, entrepriseId);
        tiers.setActif(!tiers.isActif());
        TiersDto.Response result = toResponse(tiersRepo.save(tiers));
        auditSvc.logCurrent(entrepriseId,
                tiers.isActif() ? "TIERS_ACTIVE" : "TIERS_DESACTIVE",
                "TIERS", tiers.getCode() + " — " + tiers.getNom());
        return result;
    }

    @Transactional
    public void delete(UUID id, UUID entrepriseId) {
        Tiers tiers = findOrThrow(id, entrepriseId);
        String ref = tiers.getCode() + " — " + tiers.getNom();
        tiersRepo.delete(tiers);
        auditSvc.logCurrent(entrepriseId, "TIERS_SUPPRIME", "TIERS", ref);
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
