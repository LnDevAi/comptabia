package com.edefence.comptabia.controller;

import com.edefence.comptabia.service.NotificationService;
import com.edefence.comptabia.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/stream")
@RequiredArgsConstructor
public class SseController {

    private final NotificationService notificationService;

    @GetMapping(value = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter events() {
        // TenantContext set by JwtAuthFilter; supports ?token= query param for EventSource
        return notificationService.subscribe(TenantContext.get());
    }
}
