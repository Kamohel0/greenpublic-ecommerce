package com.greenpublic.ecommerce.service.auth;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.greenpublic.ecommerce.entity.RefreshToken;
import com.greenpublic.ecommerce.exception.TokenExpiredException;
import com.greenpublic.ecommerce.repository.RefreshTokenRepository;

@Component
public class RefreshTokenTransactionalService {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenTransactionalService.class);

    
    private final RefreshTokenRepository refreshTokenRepo;
    
    public RefreshTokenTransactionalService(RefreshTokenRepository refreshTokenRepo) {
        this.refreshTokenRepo = refreshTokenRepo;
    }

     @Transactional(readOnly = true)
    public RefreshToken verifyExpiration(RefreshToken token) {
        Instant now = Instant.now();

        if (token.getExpiryDate().isBefore(now)) {
            log.warn("Expired refresh token for user={}", token.getUser().getId());
            throw new TokenExpiredException("Refresh token expired");
        }
        return token;
    }
    
   @Transactional
    public int purgeExpired() {
        int count = refreshTokenRepo.deleteAllExpiredSince(Instant.now());
        if (count > 0) {
            log.info("Purged {} expired refresh tokens", count);
        }
        return count;
    }
}