package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.ia.InvoiceAnalysisDto;
import com.edefence.ecompta.service.IaInvoiceService;
import com.edefence.ecompta.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/ia")
@RequiredArgsConstructor
public class IaController {

    private final IaInvoiceService service;

    @PostMapping(value = "/analyser-facture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public InvoiceAnalysisDto analyserFacture(@RequestPart("file") MultipartFile file) throws IOException {
        return service.analyse(file, TenantContext.get());
    }
}
