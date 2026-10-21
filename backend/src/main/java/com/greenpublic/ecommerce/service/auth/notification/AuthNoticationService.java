package com.greenpublic.ecommerce.service.auth.notification;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.greenpublic.ecommerce.entity.User;
import com.greenpublic.ecommerce.exception.EmailSendingException;
import com.greenpublic.ecommerce.repository.UserRepository;
import com.greenpublic.ecommerce.service.notifications.NotificationService;

import io.micrometer.core.instrument.MeterRegistry;

@Component
public class AuthNoticationService {

     private static final Logger log = LoggerFactory.getLogger(AuthNoticationService.class);

       public static final String SUPPORT_EMAIL = "support@greenpublic.com";
       private static final String KEY_SUPPORT_EMAIL = "supportEmail";
       private static final String KEY_USER_NAME = "userName";

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final MeterRegistry meterRegistry;

    @Value("${app.login.lockout-minutes:20}")
    private int loginLockoutMinutes;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.security.password-reset.expiration-hours:1}")
    private int tokenExpirationHours;

     @Value("${app.registration.verification-timeout-hours:24}")
    private int verificationTimeoutHours;

    public AuthNoticationService(NotificationService notificationService, UserRepository userRepository, MeterRegistry meterRegistry) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.meterRegistry = meterRegistry;
    }

    // Send security alert email on suspicious login activity
    @Async
    public void sendSecurityAlertEmail(String email, String clientIp, String deviceFingerprint) {
        try {
            User user = userRepository.findByEmail(email).orElse(null);
            if (user != null) {
                Map<String, Object> variables = new HashMap<>();
                variables.put(KEY_USER_NAME, user.getName());
                variables.put("timestamp", LocalDateTime.now().toString());
                variables.put("ipAddress", clientIp);
                variables.put("deviceInfo", deviceFingerprint);
                variables.put("lockoutMinutes", loginLockoutMinutes);
                variables.put(KEY_SUPPORT_EMAIL, SUPPORT_EMAIL);
                variables.put("accountSettingsUrl", frontendUrl + "/security");
                
                notificationService.sendTemplate(
                    email,
                    "Security Alert: Suspicious Login Activity - GreenPublic",
                    "email/security-alert",
                    variables
                );
                meterRegistry.counter("security.alerts.sent").increment();
                log.info("Security alert sent to: {}", email);
            }
        } catch (Exception e) {
            log.warn("Failed to send security alert email to: {}", email, e);
            // Don't throw exception - email failure shouldn't break login flow
        }
    }

    @Async
    public void sendPasswordResetConfirmationEmail(User user) {
        Map<String, Object> variables = new HashMap<>();
        variables.put(KEY_USER_NAME, user.getName());
        variables.put("timestamp", LocalDateTime.now().toString());
        variables.put(KEY_SUPPORT_EMAIL, SUPPORT_EMAIL);
        variables.put("ipAddress", "Unknown");
        
        try {
            notificationService.sendTemplate(
                user.getEmail(),
                "Password Reset Successful - GreenPublic",
                "email/password-reset-confirmation",
                variables
            );
            log.info("Password reset confirmation email sent to: {}", user.getEmail());
            meterRegistry.counter("password.reset.confirmations", "status", "sent").increment();
        } catch (Exception e) {
            log.warn("Failed to send password reset confirmation email to: {}", user.getEmail(), e);
            meterRegistry.counter("password.reset.confirmations", "status", "failed").increment();
        }
    }

    @Async
    public void sendPasswordResetEmail(User user, String token) {
        String resetUrl = frontendUrl + "/reset-password?token=" + token;
        
        Map<String, Object> variables = new HashMap<>();
        variables.put(KEY_USER_NAME, user.getName());
        variables.put("resetUrl", resetUrl);
        variables.put("expirationHours", tokenExpirationHours);
        variables.put(KEY_SUPPORT_EMAIL, SUPPORT_EMAIL);
        
        try {
            notificationService.sendTemplate(
                user.getEmail(),
                "Password Reset Request - GreenPublic",
                "email/password-reset",
                variables
            );
            log.info("Password reset email sent to: {}", user.getEmail());
            meterRegistry.counter("password.reset.emails", "status", "sent").increment();
        } catch (Exception e) {
            log.error("Failed to send password reset email to: {}", user.getEmail(), e);
            meterRegistry.counter("password.reset.emails", "status", "failed").increment();
            throw new EmailSendingException("Failed to send password reset email");
        }
    }

    @Async
     public void sendVerificationEmail(User user) {
        String verificationUrl = frontendUrl + "/verify-email?token=" + user.getEmailVerificationToken();
        
        Map<String, Object> variables = new HashMap<>();
        variables.put(KEY_USER_NAME, user.getName());
        variables.put("verificationUrl", verificationUrl);
        variables.put("expirationHours", verificationTimeoutHours);
        variables.put(KEY_SUPPORT_EMAIL, SUPPORT_EMAIL);
        
        try {
            notificationService.sendTemplate(
                user.getEmail(),
                "Verify Your Email - GreenPublic",
                "email/verify-email",
                variables
            );
            log.info("Verification email sent to: {}", user.getEmail());
            meterRegistry.counter("email.verification", "status", "sent").increment();
        } catch (Exception e) {
            log.error("Failed to send verification email to: {}", user.getEmail(), e);
            meterRegistry.counter("email.verification", "status", "failed").increment();
            throw new EmailSendingException("Failed to send verification email");
        }
    }

    @Async
    public void sendWelcomeEmail(User user) {
        Map<String, Object> variables = new HashMap<>();
        variables.put(KEY_USER_NAME, user.getName());
        variables.put("loginUrl", frontendUrl + "/login");
        variables.put(KEY_SUPPORT_EMAIL, SUPPORT_EMAIL);
        
        try {
            notificationService.sendTemplate(
                user.getEmail(),
                "Welcome to GreenPublic!",
                "email/welcome",
                variables
            );
            meterRegistry.counter("welcome.emails.sent").increment();
        } catch (Exception e) {
            log.warn("Failed to send welcome email to: {}", user.getEmail(), e);
        }
    }

}
