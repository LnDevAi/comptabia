package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.NotificationHistory;
import com.edefence.ecompta.domain.NotificationRule;
import com.edefence.ecompta.dto.notification.NotificationDto;
import com.edefence.ecompta.dto.notification.NotificationHistoryDto;
import com.edefence.ecompta.repository.NotificationHistoryRepository;
import com.edefence.ecompta.repository.NotificationRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationHistoryService {

    private final NotificationHistoryRepository histRepo;
    private final NotificationRuleRepository    ruleRepo;

    // ─── Historique ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<NotificationHistoryDto.Item> lister(UUID eid, Boolean luFilter, Pageable pageable) {
        Page<NotificationHistory> page = (luFilter != null)
                ? histRepo.findByEntrepriseIdAndLuOrderByCreatedAtDesc(eid, luFilter, pageable)
                : histRepo.findByEntrepriseIdOrderByCreatedAtDesc(eid, pageable);
        return page.map(n -> new NotificationHistoryDto.Item(
                n.getId(), n.getType(), n.getMessage(), n.getSeverity(),
                n.getLink(), n.isLu(), n.getCreatedAt()));
    }

    @Transactional(readOnly = true)
    public long countUnread(UUID eid) {
        return histRepo.countByEntrepriseIdAndLu(eid, false);
    }

    @Transactional
    public void save(UUID eid, NotificationDto dto) {
        if ("HEARTBEAT".equals(dto.type()) || "CONNECTED".equals(dto.type())) return;
        histRepo.save(NotificationHistory.builder()
                .entrepriseId(eid)
                .type(dto.type())
                .message(dto.message())
                .severity(dto.severity())
                .link(dto.link())
                .lu(false)
                .build());
    }

    @Transactional
    public void markRead(UUID id, UUID eid) {
        histRepo.markRead(id, eid);
    }

    @Transactional
    public void markAllRead(UUID eid) {
        histRepo.markAllRead(eid);
    }

    // ─── Règles ───────────────────────────────────────────────────────────────

    private static final List<DefaultRule> DEFAULTS = List.of(
            new DefaultRule("TRESORERIE_CRITIQUE",   "Trésorerie critique",           null),
            new DefaultRule("FACTURES_ECHEANCE",     "Échéances factures (jours)",    java.math.BigDecimal.valueOf(7)),
            new DefaultRule("BROUILLONS",            "Écritures brouillon",           null),
            new DefaultRule("PAIES_NON_COMPTA",      "Paies non comptabilisées",      null),
            new DefaultRule("RESULTAT_NEGATIF",      "Résultat déficitaire",          null)
    );

    private record DefaultRule(String type, String libelle, java.math.BigDecimal seuil) {}

    @Transactional(readOnly = true)
    public List<NotificationHistoryDto.RuleDto> getRules(UUID eid) {
        ensureDefaultRules(eid);
        return ruleRepo.findByEntrepriseIdOrderByType(eid).stream()
                .map(r -> new NotificationHistoryDto.RuleDto(
                        r.getId(), r.getType(), r.getLibelle(), r.getSeuil(), r.isEnabled()))
                .toList();
    }

    @Transactional
    public NotificationHistoryDto.RuleDto updateRule(UUID id, UUID eid,
                                                      NotificationHistoryDto.RuleUpdateRequest req) {
        NotificationRule rule = ruleRepo.findById(id)
                .filter(r -> r.getEntrepriseId().equals(eid))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Règle introuvable"));
        rule.setEnabled(req.enabled());
        if (req.seuil() != null) rule.setSeuil(req.seuil());
        ruleRepo.save(rule);
        return new NotificationHistoryDto.RuleDto(
                rule.getId(), rule.getType(), rule.getLibelle(), rule.getSeuil(), rule.isEnabled());
    }

    private void ensureDefaultRules(UUID eid) {
        for (DefaultRule d : DEFAULTS) {
            if (ruleRepo.findByEntrepriseIdAndType(eid, d.type()).isEmpty()) {
                ruleRepo.save(NotificationRule.builder()
                        .entrepriseId(eid)
                        .type(d.type())
                        .libelle(d.libelle())
                        .seuil(d.seuil())
                        .enabled(true)
                        .build());
            }
        }
    }
}
