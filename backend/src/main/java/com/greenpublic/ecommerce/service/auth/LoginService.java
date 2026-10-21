package com.greenpublic.ecommerce.service.auth;

import com.greenpublic.ecommerce.dto.auth.LoginResponseDTO;
import com.greenpublic.ecommerce.entity.User;
import com.greenpublic.ecommerce.exception.RateLimitException;
import com.greenpublic.ecommerce.jwt.JwtService;
import com.greenpublic.ecommerce.repository.UserRepository;
import com.greenpublic.ecommerce.service.RateLimiterService;
import com.greenpublic.ecommerce.service.auth.notification.AuthNoticationService;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class LoginService {

    private static final Logger log = LoggerFactory.getLogger(LoginService.class);
    
    private final UserRepository userRepository;
    private final RateLimiterService rateLimiterService;
    private final PasswordEncoder passwordEncoder;
    private final AuthNoticationService notificationService;
    private final MeterRegistry meterRegistry;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    // Track failed login attempts for account locking
    private final Map<String, LoginAttempt> failedLoginAttempts = new ConcurrentHashMap<>();

    @Value("${app.login.rate-limit.ip:50}")
    private int maxLoginPerIp;

    @Value("${app.login.rate-limit.email:15}")
    private int maxLoginPerEmail;

    @Value("${app.login.max-attempts:10}")
    private int maxLoginAttempts;

    @Value("${app.login.lockout-minutes:20}")
    private int loginLockoutMinutes;

    @Value("${app.login.allow-password-check:true}")
    private boolean allowPasswordCheck;

    @Value("${app.security.alert.enabled:true}")
    private boolean securityAlertsEnabled;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    public LoginService(UserRepository userRepository,
                      RateLimiterService rateLimiterService,
                      PasswordEncoder passwordEncoder,
                      AuthNoticationService notificationService,
                      MeterRegistry meterRegistry,
                      JwtService jwtService,
                      RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.rateLimiterService = rateLimiterService;
        this.passwordEncoder = passwordEncoder;
        this.notificationService = notificationService;
        this.meterRegistry = meterRegistry;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    // Add to LoginService class
@Transactional
public LoginResponseDTO googleLogin(String email, HttpServletRequest request) {
    String clientIp = getClientIp(request);
    String deviceFingerprint = generateDeviceFingerprint(request);
    
    User user = userRepository.findByEmail(email.toLowerCase(Locale.ROOT))
            .orElseThrow(() -> new BadCredentialsException("Google user not found"));

    // Check if account is active
    if (!user.isActive()) {
        throw new BadCredentialsException("Account not activated");
    }

    // Check if account is locked by admin
    if (user.isLocked()) {
        meterRegistry.counter("login.attempts", "status", "admin_locked").increment();
        throw new BadCredentialsException("Account has been locked by administrator");
    }

    // Generate tokens
    String accessToken = jwtService.generateAccessToken(user, user.getTokenVersion());
    String refreshToken = refreshTokenService.createRefreshToken(user).getToken();

    // Update last login and track device
    user.setLastLogin(LocalDateTime.now());
    user.setLastLoginIp(clientIp);
    userRepository.save(user);

    // Track successful login
    trackSuccessfulLogin(user, clientIp, deviceFingerprint);

    log.info("Google login successful: {} from IP: {}", email, clientIp);
    meterRegistry.counter("login.attempts", "status", "success", "method", "google").increment();
    
    // Prepare user data for response
    Map<String, Object> userData = new HashMap<>();
    userData.put("role", user.getRole());
    userData.put("email", user.getEmail());
    userData.put("name", user.getName());
    userData.put("isGoogleLogin", true);

    return new LoginResponseDTO(accessToken, refreshToken, userData);
}

    // LOGIN METHOD
    @Transactional
    public LoginResponseDTO login(String email, String password, HttpServletRequest request) {
        String clientIp = getClientIp(request);
        String normalizedEmail = email.toLowerCase(Locale.ROOT);
        String deviceFingerprint = generateDeviceFingerprint(request);
        
        // Rate limiting checks
        checkLoginRateLimits(normalizedEmail, clientIp);
        
        // Check if account is locked due to too many failed attempts
        checkAccountLockout(normalizedEmail);
        
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> {
                    handleFailedLogin(normalizedEmail, clientIp, deviceFingerprint, "user_not_found");
                    return new BadCredentialsException("Invalid credentials");
                });

        // Check if account is active
        if (!user.isActive()) {
            handleFailedLogin(normalizedEmail, clientIp, deviceFingerprint, "inactive_account");
            //trigger email verification resend logic if needed
            throw new BadCredentialsException("Account not activated. Please check your email for verification link.");
        }

        // Check if account is locked by admin
        if (user.isLocked()) {
            meterRegistry.counter("login.attempts", "status", "admin_locked").increment();
            throw new BadCredentialsException("Account has been locked by administrator. Please contact support.");
        }

        // Check password
        if (!passwordEncoder.matches(password, user.getPassword())) {
            handleFailedLogin(normalizedEmail, clientIp, deviceFingerprint, "invalid_password");
            throw new BadCredentialsException("Invalid credentials");
        }

        // Check for common/compromised passwords
        if (allowPasswordCheck) {
            checkPasswordSecurity(user, password);
        }

        // Successful login - reset failed attempts
        resetFailedLoginAttempts(normalizedEmail);
        
        // Generate tokens
        String accessToken = jwtService.generateAccessToken(user, user.getTokenVersion());
        String refreshToken = refreshTokenService.createRefreshToken(user).getToken();

        // Update last login and track device
        user.setLastLogin(LocalDateTime.now());
        user.setLastLoginIp(clientIp);
        userRepository.save(user);

        // Track successful login for security monitoring
        trackSuccessfulLogin(user, clientIp, deviceFingerprint);

        // Log successful login
        log.info("User logged in successfully: {} from IP: {}", normalizedEmail, clientIp);
        meterRegistry.counter("login.attempts", "status", "success").increment();
        // Prepare user data for response (exclude sensitive info)
        Map<String, Object> userData = new HashMap<>();
        userData.put("role", user.getRole());
        userData.put("email", user.getEmail());
        userData.put("name", user.getName());

        return new LoginResponseDTO(accessToken, refreshToken, userData);
    }

    private void checkLoginRateLimits(String email, String clientIp) {
        String ipKey = "login:ip:" + clientIp;
        String emailKey = "login:email:" + email;

        boolean allowedIp = rateLimiterService.tryConsume(ipKey, maxLoginPerIp, Duration.ofHours(1));
        boolean allowedEmail = rateLimiterService.tryConsume(emailKey, maxLoginPerEmail, Duration.ofHours(1));
        
        if (!allowedIp) {
            meterRegistry.counter("login.attempts", "status", "rate_limited_ip").increment();
            throw new RateLimitException("Too many login attempts from your IP address. Please try again later.");
        }
        
        if (!allowedEmail) {
            meterRegistry.counter("login.attempts", "status", "rate_limited_email").increment();
            throw new RateLimitException("Too many login attempts for this email. Please try again later.");
        }
    }

    private void checkAccountLockout(String email) {
        LoginAttempt attempt = failedLoginAttempts.get(email);
        if (attempt != null && attempt.isLocked()) {
            long remainingTime = attempt.getRemainingLockoutTime();
            meterRegistry.counter("login.attempts", "status", "account_locked").increment();
            throw new BadCredentialsException("Account temporarily locked. Please try again in " + 
                TimeUnit.MILLISECONDS.toMinutes(remainingTime) + " minutes.");
        }
    }

    private void handleFailedLogin(String email, String clientIp, String deviceFingerprint, String reason) {
        // Increment failed attempt counter
        LoginAttempt attempt = failedLoginAttempts.compute(email, (key, existing) -> {
            if (existing == null) {
                return new LoginAttempt();
            }
            existing.incrementAttempts();
            return existing;
        });

        log.warn("Failed login attempt for {} from IP {}: {}", email, clientIp, reason);
        meterRegistry.counter("login.attempts", "status", "failed", "reason", reason).increment();

        // Lock account if too many failed attempts
        if (attempt.getAttemptCount() >= maxLoginAttempts) {
            attempt.lockAccount(loginLockoutMinutes);
            log.warn("Account locked for {} due to too many failed attempts", email);
            meterRegistry.counter("login.attempts", "status", "account_locked_triggered").increment();
            
            // Send security alert email
            if (securityAlertsEnabled) {
                notificationService.sendSecurityAlertEmail(email, clientIp, deviceFingerprint);
            }
        }
    }

    private void checkPasswordSecurity(User user, String password) {
        // Check against common passwords
        if (isCommonPassword(password)) {
            meterRegistry.counter("login.security", "status", "common_password").increment();
            log.warn("User {} attempted login with common password", user.getEmail());
            // Consider requiring password change
        }
    }

    private boolean isCommonPassword(String password) {
        // Implement check against common passwords list
        // In production, use a comprehensive list or external service
        String[] commonPasswords = {
            "password", "123456", "qwerty", "letmein", "welcome", 
            "admin", "123456789", "password1", "12345678", "12345"
        };
        
        for (String common : commonPasswords) {
            if (common.equalsIgnoreCase(password)) {
                return true;
            }
        }
        return false;
    }

    private void resetFailedLoginAttempts(String email) {
        failedLoginAttempts.remove(email);
    }

    private void trackSuccessfulLogin(User user, String clientIp, String deviceFingerprint) {
        // Implement login tracking for security monitoring
        // Could store in database for audit purposes
        log.debug("Successful login tracked - User: {}, IP: {}, Device: {}", 
                 user.getEmail(), clientIp, deviceFingerprint);
        
        meterRegistry.counter("login.tracking", "status", "successful").increment();
    }

    private String generateDeviceFingerprint(HttpServletRequest request) {
        // Create a device fingerprint for tracking
        StringBuilder fingerprint = new StringBuilder();
        fingerprint.append(request.getHeader("User-Agent"));
        fingerprint.append("|");
        fingerprint.append(request.getHeader("Accept-Language"));
        fingerprint.append("|");
        fingerprint.append(request.getHeader("Accept-Encoding"));
        // Add more headers as needed for better fingerprinting
        
        return Integer.toHexString(fingerprint.toString().hashCode());
    }

    private String getClientIp(HttpServletRequest request) {
        // Check various headers for client IP (handles proxies and load balancers)
        String[] headersToCheck = {
            "X-Forwarded-For",
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP",
            "HTTP_X_FORWARDED_FOR",
            "HTTP_X_FORWARDED",
            "HTTP_X_CLUSTER_CLIENT_IP",
            "HTTP_CLIENT_IP",
            "HTTP_FORWARDED_FOR",
            "HTTP_FORWARDED",
            "HTTP_VIA",
            "REMOTE_ADDR"
        };

        for (String header : headersToCheck) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isBlank() && !"unknown".equalsIgnoreCase(ip)) {
                // X-Forwarded-For can contain multiple IPs, take the first one
                if (header.equals("X-Forwarded-For")) {
                    return ip.split(",")[0].trim();
                }
                return ip.trim();
            }
        }
        
        return request.getRemoteAddr();
    }

    // Failed login attempt tracking class
    private static class LoginAttempt {
        private int attemptCount;
        private LocalDateTime lockoutUntil;
        private LocalDateTime firstAttempt;
        
        public LoginAttempt() {
            this.attemptCount = 1;
            this.firstAttempt = LocalDateTime.now();
        }
        
        public void incrementAttempts() {
            this.attemptCount++;
        }
        
        public void lockAccount(int minutes) {
            this.lockoutUntil = LocalDateTime.now().plusMinutes(minutes);
        }
        
        public boolean isLocked() {
            return lockoutUntil != null && lockoutUntil.isAfter(LocalDateTime.now());
        }
        
        public long getRemainingLockoutTime() {
            return lockoutUntil != null ? 
                Duration.between(LocalDateTime.now(), lockoutUntil).toMillis() : 0;
        }
        
        public int getAttemptCount() {
            return attemptCount;
        }
        
        public LocalDateTime getFirstAttempt() {
            return firstAttempt;
        }
    }

    // Cleanup old failed login attempts
    @Scheduled(fixedRate = 3600000) // Run every hour
    public void cleanupOldFailedAttempts() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(loginLockoutMinutes * 2L);
        int removed = failedLoginAttempts.entrySet().removeIf(entry -> {
            LoginAttempt attempt = entry.getValue();
            boolean shouldRemove = !attempt.isLocked() && 
                   (attempt.getAttemptCount() == 1 || 
                    attempt.lockoutUntil != null && attempt.lockoutUntil.isBefore(cutoff));
            
            if (shouldRemove) {
                log.debug("Removed old login attempt record for: {}", entry.getKey());
            }
            return shouldRemove;
        }) ? 1 : 0;
        
        if (removed > 0) {
            log.info("Cleaned up {} old failed login attempts", removed);
        }
    }

    // Additional method to get login attempt status
    public Map<String, Object> getLoginAttemptStatus(String email) {
        LoginAttempt attempt = failedLoginAttempts.get(email.toLowerCase(Locale.ROOT));
        if (attempt != null) {
            return Map.of(
                "attemptCount", attempt.getAttemptCount(),
                "isLocked", attempt.isLocked(),
                "remainingLockoutTime", attempt.getRemainingLockoutTime(),
                "firstAttempt", attempt.getFirstAttempt().toString()
            );
        }
        return Map.of(
            "attemptCount", 0, 
            "isLocked", false,
            "remainingLockoutTime", 0,
            "firstAttempt", LocalDateTime.now().toString()
        );
    }

    // Method to manually unlock an account (for admin use)
    public void unlockAccount(String email) {
        String normalizedEmail = email.toLowerCase(Locale.ROOT);
        LoginAttempt attempt = failedLoginAttempts.get(normalizedEmail);
        
        if (attempt != null && attempt.isLocked()) {
            failedLoginAttempts.remove(normalizedEmail);
            log.info("Manually unlocked account: {}", normalizedEmail);
            meterRegistry.counter("login.manual_unlock").increment();
        }
    }

    // Method to check if user exists and is active (for pre-login checks)
    public Map<String, Boolean> checkUserStatus(String email) {
        String normalizedEmail = email.toLowerCase(Locale.ROOT);
        Optional<User> userOptional = userRepository.findByEmail(normalizedEmail);
        
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            return Map.of(
                "exists", true,
                "active", user.isActive(),
                "locked", user.isLocked(),
                "mfaEnabled", user.isMfaEnabled()
            );
        }
        
        return Map.of(
            "exists", false,
            "active", false,
            "locked", false,
            "mfaEnabled", false
        );
    }
    // Change password for authenticated user
    @Transactional
    public void changePassword(User user, String oldPassword, String newPassword) {
        // Verify old password
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            log.warn("Invalid old password for user: {}", user.getEmail());
            throw new IllegalArgumentException("Current password is incorrect");
        }

        // Validate new password strength
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("New password must be at least 8 characters long");
        }

        if (oldPassword.equals(newPassword)) {
            throw new IllegalArgumentException("New password must be different from current password");
        }

        // Encode and save new password
        user.setPassword(passwordEncoder.encode(newPassword));
        
        // Increment token version to invalidate all existing tokens
        user.setTokenVersion(user.getTokenVersion() + 1);
        
        userRepository.save(user);
        
        log.info("Password changed successfully for user: {}", user.getEmail());
        meterRegistry.counter("password.change", "status", "success").increment();
    }
}
