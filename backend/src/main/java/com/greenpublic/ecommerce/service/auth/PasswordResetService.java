package com.greenpublic.ecommerce.service.auth;

import com.greenpublic.ecommerce.entity.PasswordResetToken;
import com.greenpublic.ecommerce.entity.User;
import com.greenpublic.ecommerce.exception.InvalidTokenException;
import com.greenpublic.ecommerce.exception.UserNotFoundException;
import com.greenpublic.ecommerce.repository.PasswordResetTokenRepository;
import com.greenpublic.ecommerce.repository.UserRepository;
import com.greenpublic.ecommerce.service.auth.notification.AuthNoticationService;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PasswordResetService {
    
    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String ATTEMPTS_KEY_PREFIX = "reset-attempt:";
    
    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthNoticationService notificationService;
    private final MeterRegistry meterRegistry;
    private final PasswordValidator passwordValidator;
    
    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;
    
    @Value("${app.security.password-reset.expiration-hours:1}")
    private int tokenExpirationHours;
    
    @Value("${app.security.password-reset.max-attempts:20}")
    private int maxResetAttempts;
    
    @Value("${app.security.password-reset.attempt-ttl:24}")
    private int attemptTtlHours;
    
    // Track attempts with timestamps for proper expiration
    private final Map<String, LocalDateTime> resetAttempts = new ConcurrentHashMap<>();
    
    public PasswordResetService(PasswordResetTokenRepository tokenRepository,
                               UserRepository userRepository,
                               PasswordEncoder passwordEncoder,
                               AuthNoticationService notificationService,
                               MeterRegistry meterRegistry,
                               PasswordValidator passwordValidator) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.notificationService = notificationService;
        this.meterRegistry = meterRegistry;
        this.passwordValidator = passwordValidator;
    }
    
    @Transactional
    public void requestPasswordReset(String email) {
        try {
            User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> {
                    log.warn("Password reset requested for non-existent email: {}", email);
                    meterRegistry.counter("password.reset.requests", "status", "user_not_found").increment();
                    return new UserNotFoundException("If this email exists, you will receive a reset link");
                });
            
            // Delete any existing tokens for this user
            tokenRepository.deleteByUser(user);
            
            // Create new secure token
            PasswordResetToken resetToken = new PasswordResetToken(user, generateSecureToken(), tokenExpirationHours);
            tokenRepository.save(resetToken);
            
            // Send email using template
            notificationService.sendPasswordResetEmail(user, resetToken.getToken());
            
            log.info("Password reset token created for user: {}", user.getEmail());
            meterRegistry.counter("password.reset.requests", "status", "success").increment();
            
        } catch (Exception e) {
            meterRegistry.counter("password.reset.requests", "status", "failed").increment();
            throw e;
        }
    }
    
    private String generateSecureToken() {
        byte[] bytes = new byte[32]; // 256 bits
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
    

    @Transactional
    public void resetPassword(String token, String newPassword) {
        // Clean old attempts for this token first
        cleanOldAttemptsForToken(token);
        
        // Get current non-expired attempts count
        int attempts = getCurrentAttemptsForToken(token);
        
        if (attempts >= maxResetAttempts) {
            log.warn("Too many failed reset attempts for token: {}", token);
            meterRegistry.counter("password.reset.attempts", "status", "blocked").increment();
            throw new InvalidTokenException("Too many failed attempts. Please request a new reset link.");
        }
        
        try {
            PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> {
                    meterRegistry.counter("password.reset.attempts", "status", "invalid_token").increment();
                    return new InvalidTokenException("Invalid password reset token");
                });
            
            if (!resetToken.isValid()) {
                meterRegistry.counter("password.reset.attempts", "status", "expired_token").increment();
                throw new InvalidTokenException("Password reset token has expired or been used");
            }
            
            User user = resetToken.getUser();
            
            // Validate password strength
            passwordValidator.validatePasswordStrength(newPassword);
            
            // Check if new password is different from current
            if (passwordEncoder.matches(newPassword, user.getPassword())) {
                throw new IllegalArgumentException("New password must be different from current password");
            }
            
            // Update password
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            
            // Mark token as used
            resetToken.setUsed(true);
            tokenRepository.save(resetToken);
            
            // Send confirmation email
            notificationService.sendPasswordResetConfirmationEmail(user);
            
            // Clear all attempts for this token on success
            clearAttemptsForToken(token);
            
            log.info("Password reset successfully for user: {}", user.getEmail());
            meterRegistry.counter("password.reset.completed", "status", "success").increment();
            
        } catch (InvalidTokenException e) {
            // Record new attempt with current timestamp
            recordNewAttempt(token);
            meterRegistry.counter("password.reset.attempts", "status", "failed").increment();
            throw e;
        } catch (Exception e) {
            meterRegistry.counter("password.reset.completed", "status", "failed").increment();
            throw e;
        }
    }
    
    private int getCurrentAttemptsForToken(String token) {
        // Count non-expired attempts for this token
        LocalDateTime cutoffTime = LocalDateTime.now().minusHours(attemptTtlHours);
        return (int) resetAttempts.entrySet().stream()
            .filter(entry -> entry.getKey().startsWith(ATTEMPTS_KEY_PREFIX + token + ":"))
            .filter(entry -> entry.getValue().isAfter(cutoffTime))
            .count();
    }
    
    private void cleanOldAttemptsForToken(String token) {
        // Remove expired attempts for this specific token
        LocalDateTime cutoffTime = LocalDateTime.now().minusHours(attemptTtlHours);
        resetAttempts.entrySet().removeIf(entry -> 
            entry.getKey().startsWith(ATTEMPTS_KEY_PREFIX + token + ":") &&
            entry.getValue().isBefore(cutoffTime)
        );
    }
    
    private void clearAttemptsForToken(String token) {
        // Remove all attempts for this token
        resetAttempts.entrySet().removeIf(entry -> 
            entry.getKey().startsWith(ATTEMPTS_KEY_PREFIX + token + ":")
        );
    }
    
    private void recordNewAttempt(String token) {
        // Record attempt with unique timestamp key
        String attemptKey = ATTEMPTS_KEY_PREFIX + token + ":" + System.currentTimeMillis();
        resetAttempts.put(attemptKey, LocalDateTime.now());
    }
    
    
    
    @Transactional
    @Scheduled(cron = "0 0 3 * * ?") // Run daily at 3 AM
    public void cleanupExpiredTokens() {
        try {
            int deletedTokens = tokenRepository.deleteAllExpiredSince(LocalDateTime.now());
            if (deletedTokens > 0) {
                log.info("Cleaned up {} expired password reset tokens", deletedTokens);
                meterRegistry.counter("password.reset.tokens.cleaned").increment(deletedTokens);
            }
        } catch (Exception e) {
            log.error("Failed to cleanup expired tokens", e);
        }
    }
    
    // Additional cleanup for old attempts (runs hourly)
    @Scheduled(fixedRate = 3600000) // Run every hour
    public void cleanupOldAttempts() {
        try {
            LocalDateTime cutoffTime = LocalDateTime.now().minusHours(attemptTtlHours);
            int cleanedCount = resetAttempts.entrySet().removeIf(entry -> 
                entry.getKey().startsWith(ATTEMPTS_KEY_PREFIX) && 
                entry.getValue().isBefore(cutoffTime)
            ) ? 1 : 0;
            
            if (cleanedCount > 0) {
                log.debug("Cleaned up old password reset attempt records");
            }
        } catch (Exception e) {
            log.warn("Failed to cleanup old attempt records", e);
        }
    }
    
    public boolean validateToken(String token) {
        Optional<PasswordResetToken> resetToken = tokenRepository.findByToken(token);
        boolean isValid = resetToken.isPresent() && resetToken.get().isValid();
        
        meterRegistry.counter("password.reset.token.validations", 
            "valid", String.valueOf(isValid)).increment();
        
        return isValid;
    }
    
    // Additional method for admin monitoring
    public int getActiveResetAttempts(String token) {
        return getCurrentAttemptsForToken(token);
    }
    
    // Method for debugging and monitoring
    public Map<String, Object> getAttemptsInfo(String token) {
        Map<String, Object> info = new HashMap<>();
        info.put("currentAttempts", getCurrentAttemptsForToken(token));
        info.put("maxAttempts", maxResetAttempts);
        info.put("attemptTtlHours", attemptTtlHours);
        
        // Count total stored attempts (including expired)
        long totalStored = resetAttempts.entrySet().stream()
            .filter(entry -> entry.getKey().startsWith(ATTEMPTS_KEY_PREFIX + token + ":"))
            .count();
        info.put("totalStoredAttempts", totalStored);
        
        return info;
    }
}