package com.greenpublic.ecommerce.service;

import java.time.Instant;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

@Service
public class TokenBlacklistService {

    private final Cache<String, Instant> blacklist;

    public TokenBlacklistService() {
        this.blacklist = Caffeine.newBuilder()
            .expireAfterWrite(30, TimeUnit.DAYS)
            .maximumSize(100_000)
            .build();
    }

    public void blacklistToken(String jti, Instant expiresAt) {
        blacklist.put(jti, expiresAt);
    }

    public boolean isBlacklisted(String jti) {
        return blacklist.getIfPresent(jti) != null;
    }

    public void removeFromBlacklist(String jti) {
        blacklist.invalidate(jti);
    }
}