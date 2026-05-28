package com.edefence.comptabia.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode
public class MembreGroupeId implements Serializable {

    @Column(name = "groupe_id")
    private UUID groupeId;

    @Column(name = "entreprise_id")
    private UUID entrepriseId;
}
