package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.NotificationRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationRuleRepository extends JpaRepository<NotificationRule, UUID> {

    List<NotificationRule> findByEntrepriseIdOrderByType(UUID entrepriseId);

    Optional<NotificationRule> findByEntrepriseIdAndType(UUID entrepriseId, String type);
}
