package com.greenpublic.ecommerce.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;

/**
 * Health check controller for AWS load balancers and monitoring.
 */
@RestController
@RequestMapping("/api/health")
@Slf4j
public class HealthCheckController {

    /**
     * Basic health check endpoint.
     * 
     * @return Health status
     */
    @GetMapping
    public ResponseEntity<?> health() {
        log.debug("Health check requested");
        
        return ResponseEntity.ok(new HealthResponse(
            "UP",
            "GreenPublic Ecommerce API",
            System.currentTimeMillis(),
            "1.0.0"
        ));
    }

    /**
     * Liveness probe for Kubernetes/ECS.
     */
    @GetMapping("/live")
    public ResponseEntity<?> liveness() {
        return ResponseEntity.ok(new StatusResponse("UP", "Application is running"));
    }

    /**
     * Readiness probe for Kubernetes/ECS.
     */
    @GetMapping("/ready")
    public ResponseEntity<?> readiness() {
        return ResponseEntity.ok(new StatusResponse("UP", "Application is ready to serve requests"));
    }

    /**
     * Startup probe for Kubernetes/ECS.
     */
    @GetMapping("/startup")
    public ResponseEntity<?> startup() {
        return ResponseEntity.ok(new StatusResponse("UP", "Application startup completed"));
    }

    /**
     * Health response DTO.
     */
    public static class HealthResponse {
        public String status;
        public String service;
        public long timestamp;
        public String version;

        public HealthResponse(String status, String service, long timestamp, String version) {
            this.status = status;
            this.service = service;
            this.timestamp = timestamp;
            this.version = version;
        }
    }

    /**
     * Simple status response DTO.
     */
    public static class StatusResponse {
        public String status;
        public String message;

        public StatusResponse(String status, String message) {
            this.status = status;
            this.message = message;
        }
    }
}
