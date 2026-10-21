package com.greenpublic.ecommerce.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Stateless controller for handling Google OAuth2 login failures.
 * All successful login logic is handled in OAuth2SuccessHandler.
 */
@RestController
public class GoogleAuthController {

    @GetMapping("/api/auth/google/failure")
    public ResponseEntity<Map<String, Object>> handleGoogleLoginFailure(
            @RequestParam(required = false) String error) {

        return ResponseEntity.badRequest()
                .body(Map.of(
                        "success", false,
                        "message", "Google login failed",
                        "error", error != null ? error : "Unknown error"
                ));
    }
}
