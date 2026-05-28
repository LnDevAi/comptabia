package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.ArticleStock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ArticleStockRepository extends JpaRepository<ArticleStock, UUID> {

    Optional<ArticleStock> findByIdAndEntrepriseId(UUID id, UUID entrepriseId);

    boolean existsByCodeAndEntrepriseId(String code, UUID entrepriseId);

    @Query("""
        SELECT a FROM ArticleStock a
        WHERE a.entreprise.id = :entrepriseId
          AND (:categorie IS NULL OR a.categorie = :categorie)
          AND (:actif IS NULL OR a.actif = :actif)
          AND (:search IS NULL
               OR LOWER(a.code) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(a.designation) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY a.code ASC
        """)
    Page<ArticleStock> search(UUID entrepriseId,
                               ArticleStock.Categorie categorie,
                               Boolean actif,
                               String search,
                               Pageable pageable);

    List<ArticleStock> findByEntrepriseIdAndActifTrue(UUID entrepriseId);

    @Query("SELECT COUNT(a) FROM ArticleStock a WHERE a.entreprise.id = :id AND a.actif = TRUE")
    long countActifs(UUID id);

    @Query("SELECT COALESCE(SUM(a.stockActuel * a.coutMoyen), 0) FROM ArticleStock a WHERE a.entreprise.id = :id AND a.actif = TRUE")
    BigDecimal valeurTotaleStock(UUID id);

    @Query("SELECT COUNT(a) FROM ArticleStock a WHERE a.entreprise.id = :id AND a.actif = TRUE AND a.stockActuel <= a.stockMin AND a.stockMin > 0")
    long countEnRupture(UUID id);

    @Query("SELECT COUNT(a) FROM ArticleStock a WHERE a.entreprise.id = :id AND a.actif = TRUE AND a.stockActuel > a.stockMin AND a.stockActuel <= (a.stockMin * 1.2) AND a.stockMin > 0")
    long countEnAlerte(UUID id);
}
