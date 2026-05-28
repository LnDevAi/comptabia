package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.NotificationRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationRuleRepository extends JpaRepository<NotificationRule, UUID> {

    List<NotificationRule> findByEntrepriseIdOrderByType(UUID entrepriseId);

    Optional<NotificationRule> findByEntrepriseIdAndType(UUID entrepriseId, String type);
}
