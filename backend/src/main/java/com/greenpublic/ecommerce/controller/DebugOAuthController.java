package com.greenpublic.ecommerce.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/debug")
@Profile("dev")
public class DebugOAuthController {

    @Value("${spring.security.oauth2.client.registration.google.client-id:not-set}")
    private String clientId;
    
    @Value("${spring.security.oauth2.client.registration.google.client-secret:not-set}")
    private String clientSecret;
    
    @Value("${spring.security.oauth2.client.registration.google.redirect-uri:not-set}")
    private String redirectUri;

    @GetMapping("/oauth-config")
    public Map<String, String> getOAuthConfig() {
        return Map.of(
            "clientId", maskSensitive(clientId),
            "clientSecret", maskSensitive(clientSecret),
            "redirectUri", redirectUri,
            "clientIdLength", String.valueOf(clientId.length()),
            "clientSecretLength", String.valueOf(clientSecret.length())
        );
    }
    
    private String maskSensitive(String value) {
        if (value == null || value.length() <= 8) {
            return "***";
        }
        return value.substring(0, 4) + "***" + value.substring(value.length() - 4);
    }

    @GetMapping("/test-oauth")
    public String testOAuth() {
        return "Redirect to Google OAuth: <a href='/oauth2/authorization/google'>Login with Google</a>";
    }
}