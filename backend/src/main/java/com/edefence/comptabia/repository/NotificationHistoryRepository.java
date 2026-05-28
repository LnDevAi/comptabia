package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.NotificationHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface NotificationHistoryRepository extends JpaRepository<NotificationHistory, UUID> {

    Page<NotificationHistory> findByEntrepriseIdOrderByCreatedAtDesc(UUID entrepriseId, Pageable pageable);

    Page<NotificationHistory> findByEntrepriseIdAndLuOrderByCreatedAtDesc(
            UUID entrepriseId, boolean lu, Pageable pageable);

    long countByEntrepriseIdAndLu(UUID entrepriseId, boolean lu);

    @Modifying
    @Query("UPDATE NotificationHistory n SET n.lu = TRUE WHERE n.entrepriseId = :eid AND n.lu = FALSE")
    void markAllRead(@Param("eid") UUID entrepriseId);

    @Modifying
    @Query("UPDATE NotificationHistory n SET n.lu = TRUE WHERE n.id = :id AND n.entrepriseId = :eid")
    void markRead(@Param("id") UUID id, @Param("eid") UUID entrepriseId);
}
