package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.DocumentReglementaire;
import com.edefence.ecompta.domain.Entreprise;
import com.edefence.ecompta.dto.document.DocumentReglementaireDto;
import com.edefence.ecompta.repository.DocumentReglementaireRepository;
import com.edefence.ecompta.repository.EntrepriseRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentReglementaireService {

    private final DocumentReglementaireRepository repo;
    private final EntrepriseRepository entrepriseRepo;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    // ─── Labels des catégories ─────────────────────────────────────────────────

    private static final Map<DocumentReglementaire.Categorie, String> LABELS = Map.ofEntries(
        Map.entry(DocumentReglementaire.Categorie.DECLARATION_EXISTENCE,    "Déclaration d'existence"),
        Map.entry(DocumentReglementaire.Categorie.RECEPISSE,                "Récépissé de déclaration"),
        Map.entry(DocumentReglementaire.Categorie.PUBLICATION_JO,           "Publication Journal Officiel"),
        Map.entry(DocumentReglementaire.Categorie.STATUTS,                  "Statuts"),
        Map.entry(DocumentReglementaire.Categorie.REGLEMENT_INTERIEUR,      "Règlement intérieur"),
        Map.entry(DocumentReglementaire.Categorie.PV_AG_ORDINAIRE,          "PV Assemblée Générale Ordinaire"),
        Map.entry(DocumentReglementaire.Categorie.PV_AG_EXTRAORDINAIRE,     "PV Assemblée Générale Extraordinaire"),
        Map.entry(DocumentReglementaire.Categorie.RAPPORT_ACTIVITES,        "Rapport annuel d'activités"),
        Map.entry(DocumentReglementaire.Categorie.RAPPORT_FINANCIER,        "Rapport financier annuel"),
        Map.entry(DocumentReglementaire.Categorie.BUDGET_PREVISIONNEL,      "Budget prévisionnel"),
        Map.entry(DocumentReglementaire.Categorie.REGISTRE_MEMBRES,         "Registre des membres"),
        Map.entry(DocumentReglementaire.Categorie.REGISTRE_COMPTABLE,       "Registre de comptabilité"),
        Map.entry(DocumentReglementaire.Categorie.REGISTRE_ACTIFS,          "Registre des actifs"),
        Map.entry(DocumentReglementaire.Categorie.MODIFICATION_STATUTS,     "Déclaration modification statuts"),
        Map.entry(DocumentReglementaire.Categorie.CHANGEMENT_DIRIGEANTS,    "Déclaration changement dirigeants"),
        Map.entry(DocumentReglementaire.Categorie.RENOUVELLEMENT_RECEPISSE, "Renouvellement du récépissé"),
        Map.entry(DocumentReglementaire.Categorie.CONVENTION_ETAT,          "Convention avec l'État"),
        Map.entry(DocumentReglementaire.Categorie.AUTRE,                    "Autre document")
    );

    // ─── Lister ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<DocumentReglementaireDto.Response> lister(UUID entrepriseId) {
        return repo.findByEntrepriseIdOrderByDateEcheanceAscCreatedAtDesc(entrepriseId)
                .stream().map(this::toResponse).toList();
    }

    // ─── Créer ────────────────────────────────────────────────────────────────

    @Transactional
    public DocumentReglementaireDto.Response creer(UUID entrepriseId,
                                                    DocumentReglementaireDto.CreateRequest req) {
        Entreprise e = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Entreprise introuvable"));
        DocumentReglementaire doc = repo.save(DocumentReglementaire.builder()
                .entreprise(e)
                .categorie(req.categorie())
                .nom(req.nom())
                .description(req.description())
                .dateDepot(req.dateDepot())
                .dateEcheance(req.dateEcheance())
                .notes(req.notes())
                .build());
        return toResponse(doc);
    }

    // ─── Mettre à jour ────────────────────────────────────────────────────────

    @Transactional
    public DocumentReglementaireDto.Response mettrAJour(UUID entrepriseId, UUID docId,
                                                         DocumentReglementaireDto.UpdateRequest req) {
        DocumentReglementaire doc = getDoc(entrepriseId, docId);
        if (req.nom() != null)          doc.setNom(req.nom());
        if (req.description() != null)  doc.setDescription(req.description());
        if (req.dateDepot() != null)    doc.setDateDepot(req.dateDepot());
        if (req.dateEcheance() != null) doc.setDateEcheance(req.dateEcheance());
        if (req.statut() != null)       doc.setStatut(req.statut());
        if (req.notes() != null)        doc.setNotes(req.notes());
        return toResponse(repo.save(doc));
    }

    // ─── Upload fichier ───────────────────────────────────────────────────────

    @Transactional
    public DocumentReglementaireDto.Response uploadFichier(UUID entrepriseId, UUID docId,
                                                            MultipartFile fichier) throws IOException {
        DocumentReglementaire doc = getDoc(entrepriseId, docId);

        // Supprimer l'ancien fichier si existant
        if (doc.getCheminFichier() != null) {
            try { Files.deleteIfExists(Paths.get(doc.getCheminFichier())); } catch (IOException ignored) {}
        }

        // Stocker le nouveau fichier
        Path dir = Paths.get(uploadDir, "reglementaires", entrepriseId.toString());
        Files.createDirectories(dir);
        String ext   = getExtension(fichier.getOriginalFilename());
        String fname = docId + "_" + System.currentTimeMillis() + ext;
        Path   dest  = dir.resolve(fname);
        fichier.transferTo(dest.toFile());

        doc.setCheminFichier(dest.toString());
        doc.setNomFichierOriginal(fichier.getOriginalFilename());
        doc.setTailleFichier(fichier.getSize());
        doc.setTypeMime(fichier.getContentType());
        if (doc.getStatut() == DocumentReglementaire.Statut.EN_ATTENTE) {
            doc.setStatut(DocumentReglementaire.Statut.DEPOSE);
        }
        if (doc.getDateDepot() == null) {
            doc.setDateDepot(LocalDate.now());
        }
        return toResponse(repo.save(doc));
    }

    // ─── Télécharger fichier ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Path getFichierPath(UUID entrepriseId, UUID docId) {
        DocumentReglementaire doc = getDoc(entrepriseId, docId);
        if (!doc.hasFichier()) {
            throw new EntityNotFoundException("Aucun fichier attaché à ce document.");
        }
        return Paths.get(doc.getCheminFichier());
    }

    @Transactional(readOnly = true)
    public DocumentReglementaire getDocEntity(UUID entrepriseId, UUID docId) {
        return getDoc(entrepriseId, docId);
    }

    // ─── Supprimer ────────────────────────────────────────────────────────────

    @Transactional
    public void supprimer(UUID entrepriseId, UUID docId) {
        DocumentReglementaire doc = getDoc(entrepriseId, docId);
        if (doc.getCheminFichier() != null) {
            try { Files.deleteIfExists(Paths.get(doc.getCheminFichier())); } catch (IOException ignored) {}
        }
        repo.delete(doc);
    }

    // ─── Échéances proches (30 jours) ─────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<DocumentReglementaireDto.Response> echeancesProches(UUID entrepriseId) {
        return repo.findEcheancesProches(entrepriseId, LocalDate.now().plusDays(30))
                .stream().map(this::toResponse).toList();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private DocumentReglementaire getDoc(UUID entrepriseId, UUID docId) {
        return repo.findByIdAndEntrepriseId(docId, entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Document introuvable"));
    }

    private DocumentReglementaireDto.Response toResponse(DocumentReglementaire d) {
        int jours = 0;
        if (d.getDateEcheance() != null) {
            jours = (int) ChronoUnit.DAYS.between(LocalDate.now(), d.getDateEcheance());
        }
        return new DocumentReglementaireDto.Response(
                d.getId(),
                d.getCategorie(),
                LABELS.getOrDefault(d.getCategorie(), d.getCategorie().name()),
                d.getNom(),
                d.getDescription(),
                d.getDateDepot(),
                d.getDateEcheance(),
                d.getStatut(),
                d.hasFichier(),
                d.getNomFichierOriginal(),
                d.getTailleFichier(),
                d.getTypeMime(),
                d.getNotes(),
                jours,
                d.getCreatedAt(),
                d.getUpdatedAt()
        );
    }

    private String getExtension(String filename) {
        if (filename == null) return "";
        int i = filename.lastIndexOf('.');
        return i >= 0 ? filename.substring(i) : "";
    }
}
