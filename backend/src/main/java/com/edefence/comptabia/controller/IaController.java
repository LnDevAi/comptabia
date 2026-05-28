package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.ia.ChatDto;
import com.edefence.comptabia.dto.ia.InvoiceAnalysisDto;
import com.edefence.comptabia.service.IaChatService;
import com.edefence.comptabia.service.IaInvoiceService;
import com.edefence.comptabia.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/ia")
@RequiredArgsConstructor
public class IaController {

    private final IaInvoiceService invoiceService;
    private final IaChatService    chatService;

    @PostMapping(value = "/analyser-facture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public InvoiceAnalysisDto analyserFacture(@RequestPart("file") MultipartFile file) throws IOException {
        return invoiceService.analyse(file, TenantContext.get());
    }

    @PostMapping("/chat")
    public ChatDto.Response chat(@RequestBody ChatDto.Request req) {
        return chatService.chat(req.messages(), req.includeContext(), TenantContext.get());
    }
}
