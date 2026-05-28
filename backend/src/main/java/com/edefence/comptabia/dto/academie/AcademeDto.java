package com.edefence.comptabia.dto.academie;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class AcademeDto {

    public record CoursResume(
        UUID id,
        String titre,
        String description,
        String niveau,
        String categorie,
        Integer dureeHeures,
        boolean inscrit,
        Integer progression,
        boolean certifie,
        long nbInscrits
    ) {}

    public record CoursDetail(
        UUID id,
        String titre,
        String description,
        String niveau,
        String categorie,
        Integer dureeHeures,
        List<ChapitreInfo> chapitres,
        QuizInfo quiz,
        boolean inscrit,
        UUID inscriptionId,
        Integer progression,
        List<UUID> chapitresTermines,
        boolean certifie
    ) {}

    public record ChapitreInfo(
        UUID id,
        String titre,
        String contenu,
        Integer ordre,
        Integer dureeMinutes
    ) {}

    public record QuizInfo(
        UUID id,
        String titre,
        Integer scoreMinimum,
        List<QuestionInfo> questions
    ) {}

    public record QuestionInfo(
        UUID id,
        String question,
        String optionA,
        String optionB,
        String optionC,
        String optionD
    ) {}

    public record InscriptionResume(
        UUID id,
        UUID coursId,
        String coursTitre,
        String coursCategorie,
        String coursNiveau,
        Integer dureeHeures,
        String statut,
        Integer progression,
        LocalDate dateDebut,
        LocalDate dateFin
    ) {}

    public record CertificatResponse(
        UUID id,
        String numeroCertificat,
        String coursTitre,
        String coursCategorie,
        String coursNiveau,
        String nomBeneficiaire,
        Integer scoreObtenu,
        LocalDate dateObtention
    ) {}

    public record QuizSubmission(
        List<ReponseItem> reponses
    ) {}

    public record ReponseItem(
        UUID questionId,
        String reponse
    ) {}

    public record QuizResult(
        int scoreObtenu,
        int scoreMinimum,
        boolean reussi,
        CertificatResponse certificat
    ) {}

    public record DashboardStats(
        long totalCours,
        long mesFormations,
        long mesFormationsTerminees,
        long mesCertificats
    ) {}
}
