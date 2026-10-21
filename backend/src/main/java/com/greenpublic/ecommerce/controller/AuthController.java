package com.greenpublic.ecommerce.controller;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;

import com.greenpublic.ecommerce.config.CustomUserDetails;
import com.greenpublic.ecommerce.dto.auth.LoginRequestDTO;
import com.greenpublic.ecommerce.dto.auth.LoginResponseDTO;
import com.greenpublic.ecommerce.dto.auth.PasswordResetConfirmDTO;
import com.greenpublic.ecommerce.dto.auth.PasswordResetRequestDTO;
import com.greenpublic.ecommerce.dto.auth.UserRegisterDTO;
import com.greenpublic.ecommerce.entity.RefreshToken;
import com.greenpublic.ecommerce.entity.User;

import com.greenpublic.ecommerce.exception.RateLimitException;
import com.greenpublic.ecommerce.exception.UserNotFoundException;
import com.greenpublic.ecommerce.jwt.JwtService;
import com.greenpublic.ecommerce.repository.UserRepository;
import com.greenpublic.ecommerce.service.RateLimiterService;
import com.greenpublic.ecommerce.service.auth.LoginService;
import com.greenpublic.ecommerce.service.auth.PasswordResetService;

import com.greenpublic.ecommerce.service.auth.RefreshTokenService;
import com.greenpublic.ecommerce.service.auth.RegisterService;
import com.greenpublic.ecommerce.util.ResponseBuilder;
import com.greenpublic.ecommerce.util.ResponseConstants;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private static final String AUTHENTICATION_FAILED = "Authentication failed";
    private static final long SEVEN_DAYS_IN_SECONDS = 7L * 24 * 60 * 60;

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final PasswordResetService passwordResetService;
    private final RateLimiterService rateLimiterService;
    private final RegisterService registerService;
    private final LoginService loginService;

    public AuthController(UserRepository userRepository,
            JwtService jwtService,
            RefreshTokenService refreshTokenService,
            PasswordResetService passwordResetService,
            RateLimiterService rateLimiterService,
            RegisterService registerService,
            LoginService loginService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.passwordResetService = passwordResetService;
        this.rateLimiterService = rateLimiterService;
        this.registerService = registerService;
        this.loginService = loginService;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> registerUser(
            @Valid @RequestBody UserRegisterDTO registerDTO,
            HttpServletRequest request) {

        log.info("Registration attempt for email: {}", registerDTO.getEmail());
        registerService.register(registerDTO, request);

        return ResponseEntity.ok(ResponseBuilder.success(ResponseConstants.MSG_REGISTRATION_SUCCESS));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<Map<String, Object>> verifyEmail(@RequestParam String token) {
        registerService.verifyEmail(token);
        return ResponseEntity.ok(ResponseBuilder.success(ResponseConstants.MSG_EMAIL_VERIFIED));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, Object>> resendVerificationEmail(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {
        String email = body.get("email"); // note: "emai" not "email"
        registerService.resendVerificationEmail(email, request);

        return ResponseEntity.ok(ResponseBuilder.success("Verification email sent successfully."));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> loginUser(
            @RequestBody LoginRequestDTO dto,
            HttpServletRequest request) {

        log.info("Login attempt for email: {}", dto.getEmail());

        LoginResponseDTO loginResponse = loginService.login(dto.getEmail(), dto.getPassword(), request);

        boolean secureFlag = request.isSecure();
        String sameSite = secureFlag ? "None" : "Strict";

        ResponseCookie cookie = ResponseCookie.from("refreshToken", loginResponse.getRefreshToken())
                .httpOnly(true)
                .secure(secureFlag)
                .path("/")
                .maxAge(SEVEN_DAYS_IN_SECONDS)
                .sameSite(sameSite)
                .build();

        Map<String, Object> response = ResponseBuilder.authSuccess(
                ResponseConstants.MSG_LOGIN_SUCCESS,
                loginResponse.getAccessToken(),
                loginResponse.getUser()
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getProfile(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal() == null || authentication.getPrincipal() instanceof String) {
            return ResponseEntity.status(401).body(ResponseBuilder.error("UNAUTHORIZED", "Not authenticated"));
        }

        try {
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            User user = userDetails.getUser();

                Map<String, Object> userData = Map.of(
                    "email", user.getEmail(),
                    "name", user.getName(),
                    "surname", user.getSurname() != null ? user.getSurname() : "",
                    "phoneNumber", user.getPhoneNumber() != null ? user.getPhoneNumber() : "",
                    "marketingConsent", user.isMarketingConsent(),
                    "languagePreference", user.getLanguagePreference() != null ? user.getLanguagePreference() : "en",
                    "currencyPreference", user.getCurrencyPreference() != null ? user.getCurrencyPreference() : "ZAR",
                    "role", user.getRole(),
                    "isGoogleLogin", user.isGoogleLogin()
                );

            return ResponseEntity.ok(ResponseBuilder.success("Profile fetched", Map.of("user", userData)));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(ResponseBuilder.error("INTERNAL_ERROR", "Failed to fetch profile"));
        }
    }

    @PutMapping("/me")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @RequestBody Map<String, Object> updates,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(ResponseBuilder.error("UNAUTHORIZED", "Not authenticated"));
        }

        try {
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            User user = userDetails.getUser();

            // Update allowed fields
            if (updates.containsKey("name")) {
                String name = getStringValue(updates.get("name"));
                if (name != null) {
                    user.setName(name);
                }
            }
            if (updates.containsKey("surname")) {
                String surname = getStringValue(updates.get("surname"));
                if (surname != null) {
                    user.setSurname(surname);
                }
            }
            if (updates.containsKey("phoneNumber")) {
                String phoneNumber = getStringValue(updates.get("phoneNumber"));
                if (phoneNumber != null) {
                    user.setPhoneNumber(phoneNumber);
                }
            }
            if (updates.containsKey("marketingConsent")) {
                Boolean marketingConsent = getBooleanValue(updates.get("marketingConsent"));
                if (marketingConsent != null) {
                    user.setMarketingConsent(marketingConsent);
                }
            }
            if (updates.containsKey("languagePreference")) {
                String languagePreference = getStringValue(updates.get("languagePreference"));
                if (languagePreference != null) {
                    user.setLanguagePreference(languagePreference);
                }
            }
            if (updates.containsKey("currencyPreference")) {
                String currencyPreference = getStringValue(updates.get("currencyPreference"));
                if (currencyPreference != null) {
                    user.setCurrencyPreference(currencyPreference);
                }
            }

            userRepository.save(user);

                Map<String, Object> userData = Map.of(
                    "email", user.getEmail(),
                    "name", user.getName(),
                    "surname", user.getSurname() != null ? user.getSurname() : "",
                    "phoneNumber", user.getPhoneNumber() != null ? user.getPhoneNumber() : "",
                    "marketingConsent", user.isMarketingConsent(),
                    "languagePreference", user.getLanguagePreference() != null ? user.getLanguagePreference() : "en",
                    "currencyPreference", user.getCurrencyPreference() != null ? user.getCurrencyPreference() : "ZAR",
                    "role", user.getRole()
                );

            return ResponseEntity.ok(ResponseBuilder.success("Profile updated successfully", Map.of("user", userData)));
        } catch (Exception ex) {
            log.error("Failed to update profile", ex);
            return ResponseEntity.status(500).body(ResponseBuilder.error("INTERNAL_ERROR", "Failed to update profile"));
        }
    }

    private String getStringValue(Object value) {
        if (value == null) {
            return null;
        }

        String stringValue = String.valueOf(value).trim();
        return stringValue.isEmpty() ? null : stringValue;
    }

    private Boolean getBooleanValue(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof Boolean) {
            return (Boolean) value;
        }

        if (value instanceof Number) {
            return ((Number) value).intValue() != 0;
        }

        if (value instanceof String) {
            return Boolean.parseBoolean(((String) value).trim());
        }

        return null;
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(
            @RequestBody Map<String, String> passwordData,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(ResponseBuilder.error("UNAUTHORIZED", "Not authenticated"));
        }

        String oldPassword = passwordData.get("oldPassword");
        String newPassword = passwordData.get("newPassword");

        if (oldPassword == null || newPassword == null) {
            return ResponseEntity.badRequest().body(ResponseBuilder.error("INVALID_REQUEST", "Old and new passwords are required"));
        }

        try {
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            User user = userDetails.getUser();
            
            loginService.changePassword(user, oldPassword, newPassword);
            
            return ResponseEntity.ok(ResponseBuilder.success("Password changed successfully"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ResponseBuilder.error("INVALID_PASSWORD", ex.getMessage()));
        } catch (Exception ex) {
            log.error("Failed to change password", ex);
            return ResponseEntity.status(500).body(ResponseBuilder.error("INTERNAL_ERROR", "Failed to change password"));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refreshToken(
            @CookieValue(name = "refreshToken", required = false) String requestToken,
            HttpServletRequest request) {

        String ipKey = "refresh:" + request.getRemoteAddr();
        if (!rateLimiterService.tryConsume(ipKey, 20, Duration.ofMinutes(1))) {
            log.warn("Rate limit exceeded for token refresh from IP: {}", request.getRemoteAddr());
            throw new RateLimitException("Too many refresh attempts");
        }

        if (requestToken == null) {
            throw new UserNotFoundException(AUTHENTICATION_FAILED);
        }

        Optional<RefreshToken> consumedToken = refreshTokenService.consumeAndVerifyToken(requestToken);

        if (consumedToken.isPresent()) {
            RefreshToken oldToken = consumedToken.get();
            User user = oldToken.getUser();

            String newAccessToken = jwtService.generateAccessToken(user, user.getTokenVersion());
            RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user);

            boolean secureFlag = request.isSecure();
            String sameSite = secureFlag ? "None" : "Lax";

            ResponseCookie cookie = ResponseCookie.from("refreshToken", newRefreshToken.getToken())
                    .httpOnly(true)
                    .secure(secureFlag)
                    .path("/")
                    .maxAge(SEVEN_DAYS_IN_SECONDS)
                    .sameSite(sameSite)
                    .build();

            // Re-authenticate for this request
            UserDetails userDetails = new CustomUserDetails(user);
            UsernamePasswordAuthenticationToken authToken
                    = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(authToken);

            log.info("Token refreshed for user: {}", user.getEmail());

            Map<String, Object> response = Map.of(
                    "accessToken", newAccessToken,
                    "message", "Token refreshed successfully"
            );

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(response);
        } else {
            throw new UserNotFoundException(AUTHENTICATION_FAILED);
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(
            @Valid @RequestBody PasswordResetRequestDTO requestDTO,
            HttpServletRequest servletRequest) {

        String email = requestDTO.getEmail().toLowerCase();
        String ipAddress = servletRequest.getRemoteAddr();

        // IP-based rate limiting
        String ipKey = "forgot-password-ip:" + ipAddress;
        if (!rateLimiterService.tryConsume(ipKey, 5, Duration.ofMinutes(10))) {
            log.warn("IP rate limit exceeded for password reset from: {}", ipAddress);
            throw new RateLimitException("Too many password reset attempts");
        }

        // Email-based rate limiting
        String emailKey = "forgot-password-email:" + email;
        if (!rateLimiterService.tryConsume(emailKey, 3, Duration.ofHours(1))) {
            log.warn("Email rate limit exceeded for: {}", email);
            // Still return generic message for security
            return ResponseEntity.ok(ResponseBuilder.success("If the email exists, a password reset link has been sent"));
        }

        passwordResetService.requestPasswordReset(email);
        return ResponseEntity.ok(ResponseBuilder.success("If the email exists, a password reset link has been sent"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(
            @Valid @RequestBody PasswordResetConfirmDTO requestDTO,
            HttpServletRequest servletRequest) {

        String ipAddress = servletRequest.getRemoteAddr();

        // IP-based rate limiting
        String ipKey = "reset-password-ip:" + ipAddress;
        if (!rateLimiterService.tryConsume(ipKey, 15, Duration.ofMinutes(10))) {
            log.warn("Rate limit exceeded for password reset confirmation from IP: {}", ipAddress);
            throw new RateLimitException("Too many password reset attempts");
        }

        // Token-based rate limiting
        String tokenKey = "reset-password-token:" + requestDTO.getToken();
        if (!rateLimiterService.tryConsume(tokenKey, 10, Duration.ofHours(1))) {
            log.warn("Rate limit exceeded for token: {}", requestDTO.getToken());
            throw new RateLimitException("Too many attempts for this reset token");
        }

        if (!requestDTO.getNewPassword().equals(requestDTO.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        passwordResetService.resetPassword(requestDTO.getToken(), requestDTO.getNewPassword());
        return ResponseEntity.ok(ResponseBuilder.success("Password has been reset successfully"));
    }

    @GetMapping("/validate-reset-token")
    public ResponseEntity<Map<String, Object>> validateResetToken(@RequestParam String token) {
        boolean isValid = passwordResetService.validateToken(token);
        return ResponseEntity.ok(Map.of("valid", isValid));
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAll() {
        return ResponseEntity.ok(userRepository.findAll());
    }
}
