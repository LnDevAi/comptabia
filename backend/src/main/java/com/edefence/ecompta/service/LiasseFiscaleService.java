package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.Entreprise;
import com.edefence.ecompta.dto.liasse.LiasseFiscaleDto;
import com.edefence.ecompta.repository.EntrepriseRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LiasseFiscaleService {

    private final EtatFinancierService etatService;
    private final EntrepriseRepository entrepriseRepo;

    @Transactional(readOnly = true)
    public LiasseFiscaleDto.Response get(UUID eid, int exercice) {
        Entreprise e = entrepriseRepo.findById(eid)
                .orElseThrow(() -> new EntityNotFoundException("Entreprise introuvable"));

        LiasseFiscaleDto.Entete entete = new LiasseFiscaleDto.Entete(
                e.getNom(),
                e.getRccm(),
                e.getNif(),
                e.getIfu(),
                e.getAdresse(),
                e.getPays(),
                e.getReferentielComptable(),
                exercice,
                LocalDate.now()
        );

        return new LiasseFiscaleDto.Response(
                entete,
                etatService.getBilan(eid, exercice),
                etatService.getCompteResultat(eid, exercice),
                etatService.getFluxTresorerie(eid, exercice),
                etatService.getEvcap(eid, exercice),
                etatService.getNotes(eid, exercice)
        );
    }
}
