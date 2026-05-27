package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.MouvementStock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface MouvementStockRepository extends JpaRepository<MouvementStock, UUID> {

    List<MouvementStock> findByArticleIdOrderByDateMouvementAscCreatedAtAsc(UUID articleId);

    @Query("""
        SELECT m FROM MouvementStock m
        WHERE m.entreprise.id = :entrepriseId
          AND (:articleId IS NULL OR m.article.id = :articleId)
          AND (:type IS NULL OR m.typeMouvement = :type)
          AND (:debut IS NULL OR m.dateMouvement >= :debut)
          AND (:fin IS NULL OR m.dateMouvement <= :fin)
        ORDER BY m.dateMouvement DESC, m.createdAt DESC
        """)
    Page<MouvementStock> search(UUID entrepriseId,
                                 UUID articleId,
                                 MouvementStock.TypeMouvement type,
                                 LocalDate debut,
                                 LocalDate fin,
                                 Pageable pageable);

    @Query("""
        SELECT COALESCE(SUM(m.montant), 0) FROM MouvementStock m
        WHERE m.article.id = :articleId
          AND m.typeMouvement IN ('ENTREE', 'AJUSTEMENT_POS', 'TRANSFERT_ENTREE')
        """)
    java.math.BigDecimal totalEntrees(UUID articleId);

    @Query("""
        SELECT COALESCE(SUM(m.montant), 0) FROM MouvementStock m
        WHERE m.article.id = :articleId
          AND m.typeMouvement IN ('SORTIE', 'AJUSTEMENT_NEG', 'TRANSFERT_SORTIE')
        """)
    java.math.BigDecimal totalSorties(UUID articleId);

    @Query("""
        SELECT m FROM MouvementStock m
        WHERE m.entreprise.id = :entrepriseId
          AND m.dateMouvement >= :debut
        ORDER BY m.dateMouvement DESC
        """)
    List<MouvementStock> findRecents(UUID entrepriseId, LocalDate debut);

    @Query("""
        SELECT MONTH(m.dateMouvement),
               COALESCE(SUM(CASE WHEN m.typeMouvement IN ('ENTREE','AJUSTEMENT_POS','TRANSFERT_ENTREE')
                                 THEN m.quantite ELSE 0 END), 0),
               COALESCE(SUM(CASE WHEN m.typeMouvement IN ('SORTIE','AJUSTEMENT_NEG','TRANSFERT_SORTIE')
                                 THEN m.quantite ELSE 0 END), 0),
               COALESCE(SUM(CASE WHEN m.typeMouvement IN ('ENTREE','AJUSTEMENT_POS','TRANSFERT_ENTREE')
                                 THEN m.montant ELSE 0 END), 0),
               COALESCE(SUM(CASE WHEN m.typeMouvement IN ('SORTIE','AJUSTEMENT_NEG','TRANSFERT_SORTIE')
                                 THEN m.montant ELSE 0 END), 0)
        FROM MouvementStock m
        WHERE m.entreprise.id = :eid
          AND m.dateMouvement >= :from AND m.dateMouvement <= :to
        GROUP BY MONTH(m.dateMouvement)
        ORDER BY MONTH(m.dateMouvement)
        """)
    List<Object[]> mouvementsMensuels(@Param("eid") UUID eid,
                                       @Param("from") LocalDate from,
                                       @Param("to") LocalDate to);
}
