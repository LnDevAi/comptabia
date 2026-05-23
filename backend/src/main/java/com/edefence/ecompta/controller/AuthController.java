package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.auth.AuthResponseDto;
import com.edefence.ecompta.dto.auth.LoginDto;
import com.edefence.ecompta.dto.auth.RegisterDto;
import com.edefence.ecompta.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final StringRedisTemplate redisTemplate;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponseDto register(@Valid @RequestBody RegisterDto dto) {
        return authService.register(dto);
    }

    @PostMapping("/login")
    public AuthResponseDto login(@Valid @RequestBody LoginDto dto) {
        return authService.login(dto);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestHeader("Authorization") String authHeader,
                       @AuthenticationPrincipal UserDetails user) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            // Blacklist for 24h (matches JWT TTL)
            redisTemplate.opsForValue().set("blacklist:" + token, "1", Duration.ofHours(24));
        }
    }
}
