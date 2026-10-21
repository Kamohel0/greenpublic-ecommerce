package com.greenpublic.ecommerce.service.auth;

import com.greenpublic.ecommerce.dto.auth.UserRegisterDTO;
import com.greenpublic.ecommerce.entity.User;
import com.greenpublic.ecommerce.exception.DuplicateEmailException;

import com.greenpublic.ecommerce.exception.RateLimitException;
import com.greenpublic.ecommerce.exception.UserNotFoundException;

import com.greenpublic.ecommerce.repository.UserRepository;
import com.greenpublic.ecommerce.repository.OrderRepository;
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


import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;

import java.util.List;
import java.util.Locale;

import java.util.Optional;


@Service
public class RegisterService {

    private static final Logger log = LoggerFactory.getLogger(RegisterService.class);
    
    private final UserRepository userRepository;
    private final RateLimiterService rateLimiterService;
    private final PasswordValidator passwordValidator;
    private final PasswordEncoder passwordEncoder;
    private final AuthNoticationService notificationService;
    private final MeterRegistry meterRegistry;
    private final OrderRepository orderRepository;
   

    @Value("${app.registration.rate-limit.ip:15}")
    private int maxPerIp;

    @Value("${app.registration.rate-limit.email:10}")
    private int maxPerEmail;

    @Value("${app.registration.activate-immediately:false}")
    private boolean activateImmediately;

    @Value("${app.registration.verification-timeout-hours:24}")
    private int verificationTimeoutHours;

    @Value("${app.registration.auto-cleanup-days:7}")
    private int autoCleanupDays;


    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.registration.allow-reregister:true}")
    private boolean allowReregister;

    public RegisterService(UserRepository userRepository,
                      RateLimiterService rateLimiterService,
                      PasswordValidator passwordValidator,
                      PasswordEncoder passwordEncoder,
                      AuthNoticationService notificationService,
                      MeterRegistry meterRegistry,
                      OrderRepository orderRepository
                      ) {
        this.userRepository = userRepository;
        this.rateLimiterService = rateLimiterService;
        this.passwordValidator = passwordValidator;
        this.passwordEncoder = passwordEncoder;
        this.notificationService = notificationService;
        this.meterRegistry = meterRegistry;
        this.orderRepository = orderRepository;
       
    }

    @Transactional
    public User register(UserRegisterDTO dto, HttpServletRequest request) {
        String clientIp = getClientIp(request);
        String ipKey = "register:ip:" + clientIp;
        String emailKey = "register:email:" + dto.getEmail().toLowerCase(Locale.ROOT);

        // Combined rate limiting
        boolean allowedIp = rateLimiterService.tryConsume(ipKey, maxPerIp, Duration.ofHours(1));
        boolean allowedEmail = rateLimiterService.tryConsume(emailKey, maxPerEmail, Duration.ofHours(1));
        if (!allowedIp || !allowedEmail) {
            meterRegistry.counter("registration.attempts", "status", "rate_limited").increment();
            throw new RateLimitException("Too many registration attempts");
        }

        // Normalize email for lookup
        String emailNorm = dto.getEmail().toLowerCase(Locale.ROOT);
        Optional<User> existingUser = userRepository.findByEmail(emailNorm);
        
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            
            // Handle existing unverified user
            if (!user.isActive() && allowReregister) {
                return handleUnverifiedUserReregistration(user, dto, request);
            }
            
            meterRegistry.counter("registration.attempts", "status", "duplicate_email").increment();
            throw new DuplicateEmailException("Email already exists");
        }

        // Validate password strength
        passwordValidator.validatePasswordStrength(dto.getPassword());

        // Create new user
        User user = createNewUser(dto);
        userRepository.save(user);
        linkGuestOrders(user);

        // Send verification email if not active immediately
        if (!activateImmediately) {
            notificationService.sendVerificationEmail(user);
            meterRegistry.counter("registration.emails", "status", "verification_sent").increment();
        } else {
            meterRegistry.counter("registration.completed", "status", "active").increment();
        }

        meterRegistry.counter("registration.attempts", "status", "success").increment();
        return user;
    }

    private void linkGuestOrders(User user) {
        if (user == null || user.getEmail() == null) {
            return;
        }

        List<com.greenpublic.ecommerce.entity.Order> guestOrders =
                orderRepository.findByGuestEmailIgnoreCaseAndUserIsNull(user.getEmail());

        if (guestOrders.isEmpty()) {
            return;
        }

        for (com.greenpublic.ecommerce.entity.Order order : guestOrders) {
            order.setUser(user);
            order.setGuestEmail(null); // Clear guest email once linked to user
            if (order.getShippingAddress() != null && order.getShippingAddress().getUser() == null) {
                order.getShippingAddress().setUser(user);
            }
        }

        orderRepository.saveAll(guestOrders);
        log.info("Linked {} guest orders to user: {}", guestOrders.size(), user.getEmail());
    }

    private User handleUnverifiedUserReregistration(User existingUser, UserRegisterDTO dto, HttpServletRequest request) {
        boolean expired = isVerificationTokenExpired(existingUser);
    boolean missingToken = existingUser.getEmailVerificationToken() == null;
        
        // Check if verification token is expired
        if (expired || missingToken) {
            log.info("Allowing reregistration for expired unverified user: {}", existingUser.getEmail());
            
            // Validate new password strength
             passwordValidator.validatePasswordStrength(dto.getPassword());

            // Update user details and generate new token
            existingUser.setName(dto.getName());
            existingUser.setPassword(passwordEncoder.encode(dto.getPassword()));
            existingUser.setEmailVerificationToken(generateVerificationToken());
            existingUser.setEmailVerificationExpiry(LocalDateTime.now().plusHours(verificationTimeoutHours));
            existingUser.setCreatedAt(LocalDateTime.now()); // Reset creation time
            
            userRepository.save(existingUser);
            
            // Resend verification email
            notificationService.sendVerificationEmail(existingUser);
            meterRegistry.counter("registration.emails", "status", "reregistration_sent").increment();
            
            return existingUser;
        } else {
            // Token still valid, don't allow reregistration
            meterRegistry.counter("registration.attempts", "status", "duplicate_email").increment();
            throw new DuplicateEmailException("Email already exists. Please check your email for verification link.");
        }
    }

    private String generateVerificationToken() {
    byte[] bytes = new byte[32]; // 256-bit token
    new SecureRandom().nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
}


    private User createNewUser(UserRegisterDTO dto) {
        User user = User.builder()
                .name(dto.getName())
                .email(dto.getEmail().toLowerCase(Locale.ROOT))
                .password(passwordEncoder.encode(dto.getPassword()))
                .isActive(activateImmediately)
                .role(User.Role.USER)
                .createdAt(LocalDateTime.now())
                .build();

        if (!activateImmediately) {
            user.setEmailVerificationToken(generateVerificationToken());
            user.setEmailVerificationExpiry(LocalDateTime.now().plusHours(verificationTimeoutHours));
        }

        return user;
    }

    @Transactional
    public void verifyEmail(String token) {
        User user = userRepository.findByEmailVerificationToken(token)
                .orElseThrow(() -> {
                    meterRegistry.counter("email.verification", "status", "invalid_token").increment();
                    return new BadCredentialsException("Invalid verification token");
                });

        if (isVerificationTokenExpired(user)) {
            meterRegistry.counter("email.verification", "status", "expired_token").increment();
            throw new BadCredentialsException("Verification token has expired. Please request a new one.");
        }

        user.setActive(true);
        user.setEmailVerificationToken(null);
        user.setEmailVerificationExpiry(null);
        userRepository.save(user);

        meterRegistry.counter("email.verification", "status", "success").increment();
        
        // Send welcome email
        notificationService.sendWelcomeEmail(user);
    }

    private boolean isVerificationTokenExpired(User user) {
        return user.getEmailVerificationExpiry() != null && 
               user.getEmailVerificationExpiry().isBefore(LocalDateTime.now());
    }

    @Transactional
    public void resendVerificationEmail(String email, HttpServletRequest request) {
        String clientIp = getClientIp(request);
        String ipKey = "resend-verification:ip:" + clientIp;
        
        if (!rateLimiterService.tryConsume(ipKey, 50, Duration.ofHours(1))) {
            throw new RateLimitException("Too many verification email requests");
        }

        User user = userRepository.findByEmail(email.toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        if (user.isActive()) {
            throw new IllegalArgumentException("Account is already activated");
        }

        // Check if existing token is expired
        if (isVerificationTokenExpired(user)) {
            // Generate new token if expired
            user.setEmailVerificationToken(generateVerificationToken());
            user.setEmailVerificationExpiry(LocalDateTime.now().plusHours(verificationTimeoutHours));
        }
        
        userRepository.save(user);
        notificationService.sendVerificationEmail(user);
        
        meterRegistry.counter("email.verification", "status", "resent").increment();
    }

    // SCHEDULED CLEANUP JOBS

    @Scheduled(cron = "0 0 2 * * ?") // Run daily at 2 AM
    @Transactional
    public void cleanupExpiredVerificationTokens() {
        int cleared = userRepository.clearExpiredVerificationTokens();
        if (cleared > 0) {
            log.info("Cleared {} expired verification tokens", cleared);
            meterRegistry.counter("verification.tokens.cleared").increment(cleared);
        }
    }

    @Scheduled(cron = "0 0 3 * * ?") // Run daily at 3 AM
    @Transactional
    public void cleanupOldUnverifiedUsers() {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(autoCleanupDays);
        List<User> oldUnverifiedUsers = userRepository.findOldUnverifiedUsers(cutoffDate);
        
        int deletedCount = 0;
        for (User user : oldUnverifiedUsers) {
            userRepository.delete(user);
            deletedCount++;
            log.debug("Deleted old unverified user: {}", user.getEmail());
        }
        
        if (deletedCount > 0) {
            log.info("Deleted {} old unverified accounts (older than {} days)", deletedCount, autoCleanupDays);
            meterRegistry.counter("unverified.users.cleaned").increment(deletedCount);
        }
    }


    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isBlank()) {
            return xfHeader.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    // Additional methods for admin and monitoring
    public long getActiveUserCount() {
        return userRepository.countByIsActive(true);
    }

    public long getPendingVerificationCount() {
        return userRepository.countByIsActiveFalseAndEmailVerificationTokenIsNotNull();
    }

    public long getExpiredVerificationCount() {
        return userRepository.countByIsActiveFalseAndEmailVerificationExpiryBefore(LocalDateTime.now());
    }

    public List<User> getUsersWithExpiredVerification() {
        return userRepository.findUsersWithExpiredVerificationTokens();
    }

    public List<User> getOldUnverifiedUsers() {
        return userRepository.findOldUnverifiedUsers(LocalDateTime.now().minusDays(autoCleanupDays));
    }
}