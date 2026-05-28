package com.edefence.comptabia.licence;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class LicenceWebConfig implements WebMvcConfigurer {

    private final LicenceInterceptor licenceInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(licenceInterceptor)
                .addPathPatterns("/api/**");
    }
}
