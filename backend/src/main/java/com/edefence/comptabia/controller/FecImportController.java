package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.fec.FecImportDto;
import com.edefence.comptabia.service.FecImportService;
import com.edefence.comptabia.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/import")
@RequiredArgsConstructor
public class FecImportController {

    private final FecImportService svc;

    @PostMapping(value = "/fec", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public FecImportDto.Result importerFec(
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails user) throws IOException {
        return svc.importer(TenantContext.get(), user.getUsername(), file.getBytes());
    }
}
