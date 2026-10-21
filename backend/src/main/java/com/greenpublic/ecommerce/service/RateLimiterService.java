package com.greenpublic.ecommerce.service;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple in-memory rate limiter.
 * Tracks counts per key (e.g., per IP or per user) with time window.
 * Not distributed, so works only for a single server instance.
 */
@Service
public class RateLimiterService {

    private static class RateLimitEntry {
        private int count;
        private Instant windowStart;

        public RateLimitEntry() {
            this.count = 0;
            this.windowStart = Instant.now();
        }
    }

    private final Map<String, RateLimitEntry> rateLimits = new ConcurrentHashMap<>();

    /**
     * Try to consume one "permit" for the given key.
     *
     * @param key    e.g., "login:127.0.0.1" or "register:user@example.com"
     * @param limit  max allowed actions in the window
     * @param window duration of the time window
     * @return true if allowed, false if rate limit exceeded
     */
    public boolean tryConsume(String key, int limit, Duration window) {
        RateLimitEntry entry = rateLimits.computeIfAbsent(key, k -> new RateLimitEntry());

        synchronized (entry) {
            Instant now = Instant.now();
            // reset window if expired
            if (now.isAfter(entry.windowStart.plus(window))) {
                entry.count = 0;
                entry.windowStart = now;
            }

            if (entry.count < limit) {
                entry.count++;
                return true;
            } else {
                return false;
            }
        }
    }
}
