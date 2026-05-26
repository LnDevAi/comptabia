package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.*;
import com.edefence.ecompta.dto.academie.AcademeDto;
import com.edefence.ecompta.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AcademeService {

    private final AcademeCoursRepository            coursRepo;
    private final AcademeInscriptionRepository      inscriptionRepo;
    private final AcademeCertificatRepository       certificatRepo;
    private final AcademeProgressionChapitreRepository progressionRepo;
    private final UtilisateurRepository             utilisateurRepo;
    private final EntrepriseRepository              entrepriseRepo;

    // ── Catalogue ────────────────────────────────────────────────────────────

    public List<AcademeDto.CoursResume> catalogue(UUID eid, String email, String categorie, String niveau) {
        Utilisateur user = getUser(email);
        Set<UUID> inscrits = Set.copyOf(inscriptionRepo.findCoursIdsByUser(user.getId()));
        Set<UUID> certifies = certificatRepo.findByUtilisateurIdOrderByDateObtentionDesc(user.getId())
                .stream().map(c -> c.getCours().getId()).collect(Collectors.toSet());

        return coursRepo.findFiltered(categorie, niveau).stream().map(c ->
            new AcademeDto.CoursResume(
                c.getId(), c.getTitre(), c.getDescription(),
                c.getNiveau().name(), c.getCategorie().name(),
                c.getDureeHeures(),
                inscrits.contains(c.getId()),
                inscrits.contains(c.getId())
                    ? inscriptionRepo.findByUtilisateurIdAndCoursId(user.getId(), c.getId())
                        .map(AcademeInscription::getProgression).orElse(0)
                    : 0,
                certifies.contains(c.getId()),
                inscriptionRepo.countTerminesForCours(c.getId())
            )
        ).toList();
    }

    public AcademeDto.CoursDetail getDetail(UUID coursId, UUID eid, String email) {
        AcademeCours cours = coursRepo.findById(coursId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Utilisateur user = getUser(email);

        var inscOpt = inscriptionRepo.findByUtilisateurIdAndCoursId(user.getId(), coursId);
        boolean inscrit = inscOpt.isPresent();
        UUID inscriptionId = inscrit ? inscOpt.get().getId() : null;
        int progression = inscrit ? inscOpt.get().getProgression() : 0;
        boolean certifie = certificatRepo.existsByUtilisateurIdAndCoursId(user.getId(), coursId);

        List<UUID> chapTermines = inscrit
            ? progressionRepo.findByInscriptionId(inscriptionId)
                .stream().map(p -> p.getChapitre().getId()).toList()
            : List.of();

        List<AcademeDto.ChapitreInfo> chapitres = cours.getChapitres().stream().map(ch ->
            new AcademeDto.ChapitreInfo(ch.getId(), ch.getTitre(), ch.getContenu(),
                    ch.getOrdre(), ch.getDureeMinutes())
        ).toList();

        AcademeDto.QuizInfo quiz = null;
        if (cours.getQuiz() != null) {
            AcademeQuiz q = cours.getQuiz();
            List<AcademeDto.QuestionInfo> questions = q.getQuestions().stream().map(qu ->
                new AcademeDto.QuestionInfo(qu.getId(), qu.getQuestion(),
                    qu.getOptionA(), qu.getOptionB(), qu.getOptionC(), qu.getOptionD())
            ).toList();
            quiz = new AcademeDto.QuizInfo(q.getId(), q.getTitre(), q.getScoreMinimum(), questions);
        }

        return new AcademeDto.CoursDetail(
            cours.getId(), cours.getTitre(), cours.getDescription(),
            cours.getNiveau().name(), cours.getCategorie().name(), cours.getDureeHeures(),
            chapitres, quiz, inscrit, inscriptionId, progression, chapTermines, certifie
        );
    }

    // ── Inscriptions ─────────────────────────────────────────────────────────

    @Transactional
    public AcademeDto.InscriptionResume inscrire(UUID coursId, UUID eid, String email) {
        AcademeCours cours = coursRepo.findById(coursId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Utilisateur user = getUser(email);

        if (inscriptionRepo.findByUtilisateurIdAndCoursId(user.getId(), coursId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Déjà inscrit à ce cours.");
        }

        AcademeInscription insc = new AcademeInscription();
        insc.setUtilisateur(user);
        insc.setCours(cours);
        insc.setEntreprise(entrepriseRepo.getReferenceById(eid));
        inscriptionRepo.save(insc);

        return toResume(insc);
    }

    public List<AcademeDto.InscriptionResume> mesFormations(UUID eid, String email) {
        Utilisateur user = getUser(email);
        return inscriptionRepo.findByUtilisateurIdOrderByDateDebutDesc(user.getId())
                .stream().map(this::toResume).toList();
    }

    // ── Progression chapitres ────────────────────────────────────────────────

    @Transactional
    public AcademeDto.InscriptionResume marquerChapitre(UUID inscriptionId, UUID chapitreId,
                                                         UUID eid, String email) {
        AcademeInscription insc = inscriptionRepo.findById(inscriptionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        checkOwner(insc, email);

        if (!progressionRepo.existsByInscriptionIdAndChapitreId(inscriptionId, chapitreId)) {
            AcademeProgressionChapitre prog = new AcademeProgressionChapitre();
            prog.setInscription(insc);
            AcademeChapitre chapitre = insc.getCours().getChapitres().stream()
                    .filter(c -> c.getId().equals(chapitreId)).findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
            prog.setChapitre(chapitre);
            progressionRepo.save(prog);
        }

        long done = progressionRepo.countByInscription(inscriptionId);
        int total = insc.getCours().getChapitres().size();
        int pct = total == 0 ? 100 : (int) Math.min(100, done * 100 / total);
        insc.setProgression(pct);
        if (pct == 100 && insc.getStatut() == AcademeInscription.Statut.EN_COURS) {
            insc.setStatut(AcademeInscription.Statut.TERMINE);
            insc.setDateFin(LocalDate.now());
        }
        inscriptionRepo.save(insc);
        return toResume(insc);
    }

    // ── Quiz ─────────────────────────────────────────────────────────────────

    @Transactional
    public AcademeDto.QuizResult soumettreQuiz(UUID inscriptionId, AcademeDto.QuizSubmission submission,
                                               UUID eid, String email) {
        AcademeInscription insc = inscriptionRepo.findById(inscriptionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        checkOwner(insc, email);

        AcademeQuiz quiz = insc.getCours().getQuiz();
        if (quiz == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ce cours n'a pas de quiz.");

        List<AcademeQuestion> questions = quiz.getQuestions();
        long correct = submission.reponses().stream().filter(r -> {
            return questions.stream()
                    .filter(q -> q.getId().equals(r.questionId()))
                    .findFirst()
                    .map(q -> q.getBonneReponse().equalsIgnoreCase(r.reponse()))
                    .orElse(false);
        }).count();

        int score = questions.isEmpty() ? 100 : (int) (correct * 100 / questions.size());
        boolean reussi = score >= quiz.getScoreMinimum();

        AcademeDto.CertificatResponse cert = null;
        if (reussi && !certificatRepo.existsByUtilisateurIdAndCoursId(insc.getUtilisateur().getId(),
                insc.getCours().getId())) {
            cert = creerCertificat(insc, score, eid);
            insc.setStatut(AcademeInscription.Statut.TERMINE);
            insc.setDateFin(LocalDate.now());
            insc.setProgression(100);
            inscriptionRepo.save(insc);
        }

        return new AcademeDto.QuizResult(score, quiz.getScoreMinimum(), reussi, cert);
    }

    // ── Certificats ──────────────────────────────────────────────────────────

    public List<AcademeDto.CertificatResponse> mesCertificats(UUID eid, String email) {
        Utilisateur user = getUser(email);
        return certificatRepo.findByUtilisateurIdOrderByDateObtentionDesc(user.getId())
                .stream().map(this::toCertResponse).toList();
    }

    public AcademeDto.CertificatResponse verifierCertificat(String numero) {
        return certificatRepo.findByNumeroCertificat(numero)
                .map(this::toCertResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    public AcademeDto.DashboardStats stats(UUID eid, String email) {
        Utilisateur user = getUser(email);
        List<AcademeInscription> mes = inscriptionRepo.findByUtilisateurIdOrderByDateDebutDesc(user.getId());
        long terminees = mes.stream().filter(i -> i.getStatut() == AcademeInscription.Statut.TERMINE).count();
        long certs = certificatRepo.findByUtilisateurIdOrderByDateObtentionDesc(user.getId()).size();
        return new AcademeDto.DashboardStats(coursRepo.count(), mes.size(), terminees, certs);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private AcademeDto.CertificatResponse creerCertificat(AcademeInscription insc, int score, UUID eid) {
        AcademeCertificat cert = new AcademeCertificat();
        cert.setUtilisateur(insc.getUtilisateur());
        cert.setCours(insc.getCours());
        cert.setEntreprise(entrepriseRepo.getReferenceById(eid));
        cert.setScoreObtenu(score);
        cert.setNomBeneficiaire(insc.getUtilisateur().getNom());
        cert.setNumeroCertificat(genNumero(insc.getCours()));
        certificatRepo.save(cert);
        return toCertResponse(cert);
    }

    private String genNumero(AcademeCours cours) {
        return "CERT-" + cours.getCategorie().name().substring(0, Math.min(4, cours.getCategorie().name().length()))
               + "-" + LocalDate.now().getYear()
               + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private AcademeDto.InscriptionResume toResume(AcademeInscription i) {
        AcademeCours c = i.getCours();
        return new AcademeDto.InscriptionResume(i.getId(), c.getId(), c.getTitre(),
                c.getCategorie().name(), c.getNiveau().name(), c.getDureeHeures(),
                i.getStatut().name(), i.getProgression(), i.getDateDebut(), i.getDateFin());
    }

    private AcademeDto.CertificatResponse toCertResponse(AcademeCertificat c) {
        return new AcademeDto.CertificatResponse(c.getId(), c.getNumeroCertificat(),
                c.getCours().getTitre(), c.getCours().getCategorie().name(),
                c.getCours().getNiveau().name(), c.getNomBeneficiaire(),
                c.getScoreObtenu(), c.getDateObtention());
    }

    private Utilisateur getUser(String email) {
        return utilisateurRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private void checkOwner(AcademeInscription insc, String email) {
        if (!insc.getUtilisateur().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }
}
