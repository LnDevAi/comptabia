package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.modele.ModeleDto;
import com.edefence.ecompta.service.ModeleService;
import com.edefence.ecompta.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/modeles")
@RequiredArgsConstructor
public class ModeleController {

    private final ModeleService svc;

    @GetMapping
    public List<ModeleDto.Response> lister() {
        return svc.lister(TenantContext.get());
    }

    @GetMapping("/{id}")
    public ModeleDto.Response getOne(@PathVariable UUID id) {
        return svc.getOne(TenantContext.get(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ModeleDto.Response creer(@RequestBody ModeleDto.Request req) {
        return svc.creer(TenantContext.get(), req);
    }

    @PutMapping("/{id}")
    public ModeleDto.Response modifier(@PathVariable UUID id,
                                        @RequestBody ModeleDto.Request req) {
        return svc.modifier(TenantContext.get(), id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimer(@PathVariable UUID id) {
        svc.supprimer(TenantContext.get(), id);
    }

    @PostMapping("/{id}/instancier")
    @ResponseStatus(HttpStatus.CREATED)
    public ModeleDto.Response instancier(@PathVariable UUID id,
                                          @RequestBody ModeleDto.InstancierRequest req,
                                          @AuthenticationPrincipal UserDetails user) {
        return svc.instancier(TenantContext.get(), id, req, user.getUsername());
    }
}
