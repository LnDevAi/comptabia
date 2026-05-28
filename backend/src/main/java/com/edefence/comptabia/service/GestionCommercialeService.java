package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.*;
import com.edefence.comptabia.dto.commercial.CommercialDto;
import com.edefence.comptabia.licence.LicenceInfo;
import com.edefence.comptabia.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.LocalDate;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class GestionCommercialeService {

    private final PlanTarifaireRepository     planRepo;
    private final AbonnementClientRepository  abonnementRepo;
    private final FactureAbonnementRepository  factureRepo;
    private final PaiementAbonnementRepository paiementRepo;
    private final ObjectMapper objectMapper;

    @Value("${app.licence.private-key:}")
    private String privateKeyBase64;

    // ─── Plans ───────────────────────────────────────────────────────────────

    public List<CommercialDto.PlanResponse> listerPlans() {
        return planRepo.findAllByOrderByPrixMensuelAsc().stream().map(this::toPlanResponse).toList();
    }

    public CommercialDto.PlanResponse creerPlan(CommercialDto.PlanRequest req) {
        PlanTarifaire p = new PlanTarifaire();
        appliquerPlan(p, req);
        return toPlanResponse(planRepo.save(p));
    }

    public CommercialDto.PlanResponse mettreAJourPlan(UUID id, CommercialDto.PlanRequest req) {
        PlanTarifaire p = planRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        appliquerPlan(p, req);
        return toPlanResponse(planRepo.save(p));
    }

    public void supprimerPlan(UUID id) { planRepo.deleteById(id); }

    // ─── Abonnements ─────────────────────────────────────────────────────────

    public List<CommercialDto.AbonnementResponse> listerAbonnements() {
        return abonnementRepo.findAllByOrderByCreatedAtDesc().stream().map(this::toAbonnementResponse).toList();
    }

    public CommercialDto.AbonnementResponse creerAbonnement(CommercialDto.AbonnementRequest req) {
        AbonnementClient a = new AbonnementClient();
        appliquerAbonnement(a, req);
        return toAbonnementResponse(abonnementRepo.save(a));
    }

    public CommercialDto.AbonnementResponse mettreAJourAbonnement(UUID id, CommercialDto.AbonnementRequest req) {
        AbonnementClient a = abonnementRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        appliquerAbonnement(a, req);
        return toAbonnementResponse(abonnementRepo.save(a));
    }

    public void supprimerAbonnement(UUID id) { abonnementRepo.deleteById(id); }

    // ─── Factures ────────────────────────────────────────────────────────────

    public List<CommercialDto.FactureResponse> listerFactures() {
        return factureRepo.findAllByOrderByCreatedAtDesc().stream().map(this::toFactureResponse).toList();
    }

    public List<CommercialDto.FactureResponse> listerFacturesClient(UUID abonnementId) {
        return factureRepo.findByAbonnementIdOrderByCreatedAtDesc(abonnementId).stream()
                .map(this::toFactureResponse).toList();
    }

    public CommercialDto.FactureResponse genererFacture(CommercialDto.FactureRequest req) {
        AbonnementClient abonnement = abonnementRepo.findById(UUID.fromString(req.abonnementId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Abonnement introuvable"));
        BigDecimal tva = req.tauxTva() != null ? req.tauxTva() : BigDecimal.ZERO;
        BigDecimal ttc = req.montantHt().multiply(
                BigDecimal.ONE.add(tva.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)));
        FactureAbonnement f = new FactureAbonnement();
        f.setNumero(genererNumeroFacture());
        f.setAbonnement(abonnement);
        f.setPeriodeDebut(LocalDate.parse(req.periodeDebut()));
        f.setPeriodeFin(LocalDate.parse(req.periodeFin()));
        f.setMontantHt(req.montantHt());
        f.setTauxTva(tva);
        f.setMontantTtc(ttc.setScale(2, RoundingMode.HALF_UP));
        f.setDateEcheance(LocalDate.parse(req.dateEcheance()));
        f.setNotes(req.notes());
        return toFactureResponse(factureRepo.save(f));
    }

    public CommercialDto.FactureResponse changerStatutFacture(UUID id, String statut) {
        FactureAbonnement f = factureRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        f.setStatut(FactureAbonnement.Statut.valueOf(statut));
        return toFactureResponse(factureRepo.save(f));
    }

    // ─── Paiements ───────────────────────────────────────────────────────────

    public CommercialDto.PaiementResponse enregistrerPaiement(CommercialDto.PaiementRequest req) {
        FactureAbonnement facture = factureRepo.findById(UUID.fromString(req.factureId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Facture introuvable"));
        PaiementAbonnement p = new PaiementAbonnement();
        p.setFacture(facture);
        p.setModePaiement(PaiementAbonnement.ModePaiement.valueOf(req.modePaiement()));
        p.setMontant(req.montant());
        p.setDatePaiement(LocalDate.parse(req.datePaiement()));
        p.setReference(req.reference());
        p.setNotes(req.notes());
        paiementRepo.save(p);
        // Marquer facture payée
        facture.setStatut(FactureAbonnement.Statut.PAYEE);
        facture.setDatePaiement(p.getDatePaiement());
        factureRepo.save(facture);
        return toPaiementResponse(p);
    }

    // ─── Dashboard ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CommercialDto.DashboardCommercial getDashboard() {
        BigDecimal mrrMensuel = abonnementRepo.sumMrrMensuel();
        BigDecimal mrrAnnuel  = abonnementRepo.sumMrrAnnuel()
                .divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);
        BigDecimal mrr = mrrMensuel.add(mrrAnnuel);
        BigDecimal arr = mrr.multiply(BigDecimal.valueOf(12));

        List<AbonnementClient> tous = abonnementRepo.findAllByOrderByCreatedAtDesc();
        List<CommercialDto.RevenusParPlan> revenusParPlan = planRepo.findByActifTrue().stream()
                .map(plan -> {
                    List<AbonnementClient> actifsPlan = tous.stream()
                            .filter(a -> a.getPlan() != null
                                    && a.getPlan().getId().equals(plan.getId())
                                    && a.getStatut() == AbonnementClient.Statut.ACTIF)
                            .toList();
                    BigDecimal rev = actifsPlan.stream()
                            .map(AbonnementClient::getMontantActuel)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new CommercialDto.RevenusParPlan(plan.getNom(), actifsPlan.size(), rev);
                }).toList();

        return new CommercialDto.DashboardCommercial(
                abonnementRepo.countByStatut(AbonnementClient.Statut.ACTIF),
                abonnementRepo.countByStatut(AbonnementClient.Statut.ESSAI),
                abonnementRepo.countByStatut(AbonnementClient.Statut.SUSPENDU),
                abonnementRepo.countByStatut(AbonnementClient.Statut.RESILIE),
                mrr, arr,
                factureRepo.countByStatut(FactureAbonnement.Statut.EN_ATTENTE),
                factureRepo.countByStatut(FactureAbonnement.Statut.EN_RETARD),
                abonnementRepo.findRenouvellementsDans(LocalDate.now(), LocalDate.now().plusDays(30)).size(),
                revenusParPlan
        );
    }

    // ─── Génération fichier licence ───────────────────────────────────────────

    public byte[] genererFichierLicence(UUID abonnementId) {
        if (privateKeyBase64 == null || privateKeyBase64.isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED,
                    "LICENCE_PRIVATE_KEY non configurée sur ce serveur");
        }
        AbonnementClient a = abonnementRepo.findById(abonnementId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (a.getPlan() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Abonnement sans plan associé");
        }
        String expiry = a.getDateFin() != null
                ? a.getDateFin().toString()
                : LocalDate.now().plusYears(1).toString();

        LicenceInfo info = new LicenceInfo(
                UUID.randomUUID().toString(),
                a.getNomEntreprise(),
                a.getId().toString(),
                a.getPlan().getModulesList(),
                a.getPlan().getMaxUtilisateurs(),
                a.getDateDebut().toString(),
                expiry,
                null
        );
        try {
            byte[] payloadBytes = objectMapper.writeValueAsBytes(info);
            String payloadB64   = Base64.getUrlEncoder().withoutPadding().encodeToString(payloadBytes);
            byte[] keyBytes     = Base64.getDecoder().decode(privateKeyBase64.replaceAll("\\s", ""));
            PrivateKey privKey  = KeyFactory.getInstance("RSA")
                    .generatePrivate(new PKCS8EncodedKeySpec(keyBytes));
            Signature sig = Signature.getInstance("SHA256withRSA");
            sig.initSign(privKey);
            sig.update(payloadBytes);
            String sigB64 = Base64.getUrlEncoder().withoutPadding().encodeToString(sig.sign());
            return (payloadB64 + "." + sigB64).getBytes(StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Erreur génération licence: " + e.getMessage());
        }
    }

    // ─── Mappers ─────────────────────────────────────────────────────────────

    private void appliquerPlan(PlanTarifaire p, CommercialDto.PlanRequest req) {
        p.setNom(req.nom()); p.setCode(req.code()); p.setDescription(req.description());
        p.setPrixMensuel(req.prixMensuel()); p.setPrixAnnuel(req.prixAnnuel());
        p.setModules(req.modules() != null ? String.join(",", req.modules()) : "");
        p.setMaxUtilisateurs(req.maxUtilisateurs()); p.setActif(req.actif());
    }

    private void appliquerAbonnement(AbonnementClient a, CommercialDto.AbonnementRequest req) {
        a.setNomEntreprise(req.nomEntreprise()); a.setEmailContact(req.emailContact());
        a.setTelephone(req.telephone()); a.setPays(req.pays());
        if (req.planId() != null && !req.planId().isBlank())
            planRepo.findById(UUID.fromString(req.planId())).ifPresent(a::setPlan);
        else a.setPlan(null);
        a.setStatut(AbonnementClient.Statut.valueOf(req.statut() != null ? req.statut() : "ESSAI"));
        a.setPeriodicite(AbonnementClient.Periodicite.valueOf(req.periodicite() != null ? req.periodicite() : "MENSUEL"));
        a.setDateDebut(req.dateDebut() != null ? LocalDate.parse(req.dateDebut()) : LocalDate.now());
        a.setDateFin(req.dateFin() != null && !req.dateFin().isBlank() ? LocalDate.parse(req.dateFin()) : null);
        a.setDateProchainRenouvellement(req.dateProchainRenouvellement() != null
                && !req.dateProchainRenouvellement().isBlank()
                ? LocalDate.parse(req.dateProchainRenouvellement()) : null);
        a.setMontantActuel(req.montantActuel() != null ? req.montantActuel() : BigDecimal.ZERO);
        a.setNotes(req.notes());
    }

    private String genererNumeroFacture() {
        int year = LocalDate.now().getYear();
        long seq  = factureRepo.countByYear(year) + 1;
        return "INV-" + year + "-" + String.format("%04d", seq);
    }

    private CommercialDto.PlanResponse toPlanResponse(PlanTarifaire p) {
        return new CommercialDto.PlanResponse(
                p.getId().toString(), p.getNom(), p.getCode(), p.getDescription(),
                p.getPrixMensuel(), p.getPrixAnnuel(), p.getModulesList(),
                p.getMaxUtilisateurs(), p.isActif(),
                p.getCreatedAt() != null ? p.getCreatedAt().toString() : null);
    }

    private CommercialDto.AbonnementResponse toAbonnementResponse(AbonnementClient a) {
        return new CommercialDto.AbonnementResponse(
                a.getId().toString(), a.getNomEntreprise(), a.getEmailContact(),
                a.getTelephone(), a.getPays(),
                a.getPlan() != null ? toPlanResponse(a.getPlan()) : null,
                a.getStatut().name(), a.getPeriodicite().name(),
                a.getDateDebut() != null ? a.getDateDebut().toString() : null,
                a.getDateFin() != null ? a.getDateFin().toString() : null,
                a.getDateProchainRenouvellement() != null ? a.getDateProchainRenouvellement().toString() : null,
                a.getMontantActuel(), a.getNotes(),
                a.getCreatedAt() != null ? a.getCreatedAt().toString() : null);
    }

    private CommercialDto.FactureResponse toFactureResponse(FactureAbonnement f) {
        return new CommercialDto.FactureResponse(
                f.getId().toString(), f.getNumero(),
                f.getAbonnement() != null ? toAbonnementResponse(f.getAbonnement()) : null,
                f.getPeriodeDebut().toString(), f.getPeriodeFin().toString(),
                f.getMontantHt(), f.getTauxTva(), f.getMontantTtc(),
                f.getStatut().name(), f.getDateEcheance().toString(),
                f.getDatePaiement() != null ? f.getDatePaiement().toString() : null,
                f.getNotes(), f.getCreatedAt() != null ? f.getCreatedAt().toString() : null);
    }

    private CommercialDto.PaiementResponse toPaiementResponse(PaiementAbonnement p) {
        return new CommercialDto.PaiementResponse(
                p.getId().toString(),
                p.getFacture().getId().toString(), p.getFacture().getNumero(),
                p.getModePaiement().name(), p.getMontant(),
                p.getDatePaiement().toString(), p.getReference(), p.getNotes(),
                p.getCreatedAt() != null ? p.getCreatedAt().toString() : null);
    }
}
