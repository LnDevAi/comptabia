package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.notification.NotificationHistoryDto;
import com.edefence.comptabia.service.NotificationHistoryService;
import com.edefence.comptabia.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationHistoryController {

    private final NotificationHistoryService svc;

    @GetMapping
    public Page<NotificationHistoryDto.Item> lister(
            @RequestParam(required = false) Boolean lu,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "30") int size) {
        return svc.lister(TenantContext.get(), lu, PageRequest.of(page, Math.min(size, 100)));
    }

    @GetMapping("/unread-count")
    public long unreadCount() {
        return svc.countUnread(TenantContext.get());
    }

    @PostMapping("/{id}/lire")
    public void markRead(@PathVariable UUID id) {
        svc.markRead(id, TenantContext.get());
    }

    @PostMapping("/lire-tout")
    public void markAllRead() {
        svc.markAllRead(TenantContext.get());
    }

    @GetMapping("/regles")
    public List<NotificationHistoryDto.RuleDto> getRules() {
        return svc.getRules(TenantContext.get());
    }

    @PutMapping("/regles/{id}")
    public NotificationHistoryDto.RuleDto updateRule(
            @PathVariable UUID id,
            @RequestBody NotificationHistoryDto.RuleUpdateRequest req) {
        return svc.updateRule(id, TenantContext.get(), req);
    }
}
