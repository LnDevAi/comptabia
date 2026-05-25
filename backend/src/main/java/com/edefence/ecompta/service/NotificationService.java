package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.Facture;
import com.edefence.ecompta.dto.alerte.AlerteDto;
import com.edefence.ecompta.dto.notification.NotificationDto;
import com.edefence.ecompta.repository.EcritureComptableRepository;
import com.edefence.ecompta.repository.FactureRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final AlerteService               alerteService;
    private final EcritureComptableRepository ecritureRepo;
    private final FactureRepository           factureRepo;

    private final ConcurrentHashMap<UUID, CopyOnWriteArrayList<SseEmitter>> emitters =
            new ConcurrentHashMap<>();

    // ─── Subscribe ────────────────────────────────────────────────────────────

    public SseEmitter subscribe(UUID entrepriseId) {
        SseEmitter emitter = new SseEmitter(180_000L); // 3-min timeout → Angular reconnects

        emitters.computeIfAbsent(entrepriseId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        Runnable remove = () -> {
            CopyOnWriteArrayList<SseEmitter> list = emitters.get(entrepriseId);
            if (list != null) list.remove(emitter);
        };
        emitter.onCompletion(remove);
        emitter.onTimeout(remove);
        emitter.onError(e -> remove.run());

        // Send initial snapshot immediately
        try {
            emitter.send(SseEmitter.event().name("CONNECTED").data("ok"));
        } catch (IOException ignored) {}

        return emitter;
    }

    public Set<UUID> getActiveEntreprises() {
        return new HashSet<>(emitters.keySet());
    }

    // ─── Broadcast ────────────────────────────────────────────────────────────

    public void broadcast(UUID entrepriseId, NotificationDto dto) {
        CopyOnWriteArrayList<SseEmitter> list = emitters.get(entrepriseId);
        if (list == null || list.isEmpty()) return;

        List<SseEmitter> dead = new ArrayList<>();
        for (SseEmitter em : list) {
            try {
                em.send(SseEmitter.event().name(dto.type()).data(dto));
            } catch (IOException e) {
                dead.add(em);
            }
        }
        list.removeAll(dead);
    }

    // ─── Scheduled broadcast ─────────────────────────────────────────────────

    @Scheduled(fixedDelay = 30_000)
    public void scheduledBroadcast() {
        Set<UUID> actifs = getActiveEntreprises();
        if (actifs.isEmpty()) return;

        for (UUID eid : actifs) {
            sendHeartbeat(eid);
            try {
                broadcastStats(eid);
            } catch (Exception e) {
                log.warn("Notification broadcast failed for {}: {}", eid, e.getMessage());
            }
        }
    }

    private void sendHeartbeat(UUID eid) {
        NotificationDto hb = new NotificationDto("HEARTBEAT", "ping", 0, "INFO", null, Instant.now());
        broadcast(eid, hb);
    }

    private void broadcastStats(UUID eid) {
        LocalDate today = LocalDate.now();

        // Brouillons en attente
        long brouillons = ecritureRepo.countBrouillonsByEntrepriseId(eid);
        if (brouillons > 0) {
            broadcast(eid, new NotificationDto(
                    "BROUILLON",
                    brouillons + " écriture(s) en brouillon à valider",
                    (int) brouillons, "WARNING",
                    "/dashboard/ecritures", Instant.now()));
        }

        // Alertes comptables
        AlerteDto.AlerteResponse alertes = alerteService.getAlertes(eid);
        if (alertes.countDanger() > 0) {
            broadcast(eid, new NotificationDto(
                    "ALERTE",
                    alertes.countDanger() + " alerte(s) critique(s)",
                    (int) alertes.countDanger(), "DANGER",
                    "/dashboard/alertes", Instant.now()));
        } else if (alertes.total() > 0) {
            broadcast(eid, new NotificationDto(
                    "ALERTE",
                    alertes.total() + " alerte(s) comptable(s)",
                    (int) alertes.total(), "WARNING",
                    "/dashboard/alertes", Instant.now()));
        }

        // Factures EMISE en retard
        long retard = factureRepo.findAllEmises(eid).stream()
                .filter(f -> {
                    LocalDate due = f.getDateEcheance() != null
                            ? f.getDateEcheance()
                            : f.getDateFacture().plusDays(30);
                    return today.isAfter(due);
                }).count();
        if (retard > 0) {
            int retardInt = (int) Math.min(retard, Integer.MAX_VALUE);
            broadcast(eid, new NotificationDto(
                    "FACTURE_EN_RETARD",
                    retard + " facture(s) en retard de paiement",
                    retardInt, "DANGER",
                    "/dashboard/facturation", Instant.now()));
        }
    }
}
