package com.greenpublic.ecommerce.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.greenpublic.ecommerce.repository.UserRepository;

@RestController
@RequestMapping("/actuator/health")
public class HealthController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/auth")
    public ResponseEntity<?> authHealth() {
        try {
            // Test database connectivity
            userRepository.count();
            return ResponseEntity.ok().body(Map.of("status", "UP", "database", "CONNECTED"));
        } catch (Exception e) {
            return ResponseEntity.status(503).body(Map.of("status", "DOWN", "database", "DISCONNECTED"));
        }
    }
}
