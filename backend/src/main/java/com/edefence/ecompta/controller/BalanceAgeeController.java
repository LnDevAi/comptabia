package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.balance.BalanceAgeeDto;
import com.edefence.ecompta.service.BalanceAgeeService;
import com.edefence.ecompta.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/balance-agee")
@RequiredArgsConstructor
public class BalanceAgeeController {

    private final BalanceAgeeService svc;

    @GetMapping
    public BalanceAgeeDto.Response calculer(
            @RequestParam(defaultValue = "CLIENT") String type) {
        return svc.calculer(TenantContext.get(), type);
    }
}
