// package com.greenpublic.ecommerce.controller;


// import com.greenpublic.ecommerce.dto.auth.UserRegisterDTO;
// import com.greenpublic.ecommerce.entity.User;
// import com.greenpublic.ecommerce.exception.DuplicateEmailException;
// import com.greenpublic.ecommerce.exception.EmailSendingException;
// import com.greenpublic.ecommerce.exception.RateLimitException;
// import com.greenpublic.ecommerce.exception.UserNotFoundException;
// import com.greenpublic.ecommerce.service.auth.LoginService;
// import com.greenpublic.ecommerce.service.auth.RegisterService;
// import io.micrometer.core.instrument.MeterRegistry;
// import jakarta.validation.Valid;

// import org.slf4j.Logger;
// import org.slf4j.LoggerFactory;
// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.security.authentication.BadCredentialsException;
// import org.springframework.web.bind.annotation.*;

// import javax.servlet.http.HttpServletRequest;

// import java.time.LocalDateTime;
// import java.util.HashMap;
// import java.util.List;
// import java.util.Map;

// @RestController
// @RequestMapping("/api/v1/auth")
// public class AuthControllerv2 {

//     private static final Logger log = LoggerFactory.getLogger(AuthControllerv2.class);
    
//     private final RegisterService registerService;
//     private final LoginService loginService;
//     private final MeterRegistry meterRegistry;

//     public AuthControllerv2(RegisterService registerService, 
//                          LoginService loginService,
//                          MeterRegistry meterRegistry) {
//         this.registerService = registerService;
//         this.loginService = loginService;
//         this.meterRegistry = meterRegistry;
//     }

//     // REGISTRATION ENDPOINTS

//     // @PostMapping("/register")
//     // public ResponseEntity<?> registerUser(
//     //         @Valid @RequestBody UserRegisterDTO registerDTO,
//     //         HttpServletRequest request) {
        
//     //         log.info("Registration attempt for email: {}", registerDTO.getEmail());
            
//     //         registerService.register(registerDTO, request);
            
//     //         Map<String, Object> response = new HashMap<>();
//     //         response.put("success", true);
//     //         response.put("message", "Registration successful. Please check your email for verification.");
//     //         response.put("timestamp", LocalDateTime.now());
            
//     //         return ResponseEntity.status(HttpStatus.CREATED).body("Registration successful. Please check your email for verification.");
            
//     // }

//     @GetMapping("/verify-email")
//     public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        
//             registerService.verifyEmail(token);
            
//             Map<String, Object> response = new HashMap<>();
//             response.put("success", true);
//             response.put("message", "Email verified successfully. You can now login to your account.");
//             response.put("timestamp", LocalDateTime.now());
            
//             return ResponseEntity.ok(response);
             
//     }

//     @PostMapping("/resend-verification")
//     public ResponseEntity<?> resendVerificationEmail(
//             @RequestParam String email,
//             HttpServletRequest request) {
        
//         try {
//             registerService.resendVerificationEmail(email, request);
            
//             Map<String, Object> response = new HashMap<>();
//             response.put("success", true);
//             response.put("message", "Verification email sent successfully.");
//             response.put("email", email);
//             response.put("timestamp", LocalDateTime.now());
            
//             return ResponseEntity.ok(response);
            
//         } catch (UserNotFoundException e) {
//             return ResponseEntity.status(HttpStatus.NOT_FOUND)
//                     .body(createErrorResponse("USER_NOT_FOUND", e.getMessage()));
                    
//         } catch (IllegalArgumentException e) {
//             return ResponseEntity.status(HttpStatus.BAD_REQUEST)
//                     .body(createErrorResponse("ALREADY_ACTIVE", e.getMessage()));
                    
//         } catch (RateLimitException e) {
//             return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
//                     .body(createErrorResponse("RATE_LIMITED", e.getMessage()));
                    
//         } catch (Exception e) {
//             log.error("Error resending verification email: {}", email, e);
//             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                     .body(createErrorResponse("RESEND_FAILED", "Failed to resend verification email. Please try again."));
//         }
//     }

//     // LOGIN ENDPOINTS

//     @PostMapping("/login")
//     public ResponseEntity<?> loginUser(
//             @RequestParam String email,
//             @RequestParam String password,
//             HttpServletRequest request) {
        
//         try {
//             log.info("Login attempt for email: {}", email);
            
//             Map<String, Object> loginResponse = loginService.login(email, password, request);
            
//             Map<String, Object> response = new HashMap<>();
//             response.put("success", true);
//             response.put("message", "Login successful");
//             response.put("data", loginResponse);
//             response.put("timestamp", LocalDateTime.now());
            
//             return ResponseEntity.ok(response);
            
//         } catch (BadCredentialsException e) {
//             log.warn("Failed login attempt for email: {}", email);
//             return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
//                     .body(createErrorResponse("INVALID_CREDENTIALS", e.getMessage()));
                    
//         } catch (RateLimitException e) {
//             log.warn("Rate limited login attempt for email: {}", email);
//             return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
//                     .body(createErrorResponse("RATE_LIMITED", e.getMessage()));
                    
//         } catch (Exception e) {
//             log.error("Unexpected error during login: {}", email, e);
//             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                     .body(createErrorResponse("LOGIN_FAILED", "An unexpected error occurred during login."));
//         }
//     }

//     @GetMapping("/check-user/{email}")
//     public ResponseEntity<?> checkUserStatus(@PathVariable String email) {
//         try {
//             Map<String, Boolean> status = loginService.checkUserStatus(email);
            
//             Map<String, Object> response = new HashMap<>();
//             response.put("success", true);
//             response.put("data", status);
//             response.put("timestamp", LocalDateTime.now());
            
//             return ResponseEntity.ok(response);
            
//         } catch (Exception e) {
//             log.error("Error checking user status: {}", email, e);
//             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                     .body(createErrorResponse("CHECK_FAILED", "Failed to check user status."));
//         }
//     }

//     @GetMapping("/login-attempts/{email}")
//     public ResponseEntity<?> getLoginAttemptStatus(@PathVariable String email) {
//         try {
//             Map<String, Object> status = loginService.getLoginAttemptStatus(email);
            
//             Map<String, Object> response = new HashMap<>();
//             response.put("success", true);
//             response.put("data", status);
//             response.put("timestamp", LocalDateTime.now());
            
//             return ResponseEntity.ok(response);
            
//         } catch (Exception e) {
//             log.error("Error getting login attempt status: {}", email, e);
//             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                     .body(createErrorResponse("STATUS_CHECK_FAILED", "Failed to get login attempt status."));
//         }
//     }

//     @PostMapping("/unlock-account/{email}")
//     public ResponseEntity<?> unlockAccount(@PathVariable String email) {
//         try {
//             loginService.unlockAccount(email);
            
//             Map<String, Object> response = new HashMap<>();
//             response.put("success", true);
//             response.put("message", "Account unlocked successfully");
//             response.put("email", email);
//             response.put("timestamp", LocalDateTime.now());
            
//             return ResponseEntity.ok(response);
            
//         } catch (Exception e) {
//             log.error("Error unlocking account: {}", email, e);
//             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                     .body(createErrorResponse("UNLOCK_FAILED", "Failed to unlock account."));
//         }
//     }

//     // ADMIN/MONITORING ENDPOINTS

//     @GetMapping("/admin/stats")
//     public ResponseEntity<?> getAuthStats() {
//         try {
//             Map<String, Object> stats = new HashMap<>();
//             stats.put("activeUsers", registerService.getActiveUserCount());
//             stats.put("pendingVerification", registerService.getPendingVerificationCount());
//             stats.put("expiredVerifications", registerService.getExpiredVerificationCount());
//             stats.put("timestamp", LocalDateTime.now());
            
//             Map<String, Object> response = new HashMap<>();
//             response.put("success", true);
//             response.put("data", stats);
            
//             return ResponseEntity.ok(response);
            
//         } catch (Exception e) {
//             log.error("Error getting auth statistics", e);
//             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                     .body(createErrorResponse("STATS_FAILED", "Failed to retrieve authentication statistics."));
//         }
//     }

//     @GetMapping("/admin/expired-verifications")
//     public ResponseEntity<?> getExpiredVerifications() {
//         try {
//             List<User> expiredUsers = registerService.getUsersWithExpiredVerification();
            
//             Map<String, Object> response = new HashMap<>();
//             response.put("success", true);
//             response.put("count", expiredUsers.size());
//             response.put("users", expiredUsers);
//             response.put("timestamp", LocalDateTime.now());
            
//             return ResponseEntity.ok(response);
            
//         } catch (Exception e) {
//             log.error("Error getting expired verifications", e);
//             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                     .body(createErrorResponse("FETCH_FAILED", "Failed to retrieve expired verifications."));
//         }
//     }

//     @GetMapping("/admin/old-unverified-users")
//     public ResponseEntity<?> getOldUnverifiedUsers() {
//         try {
//             List<User> oldUsers = registerService.getOldUnverifiedUsers();
            
//             Map<String, Object> response = new HashMap<>();
//             response.put("success", true);
//             response.put("count", oldUsers.size());
//             response.put("users", oldUsers);
//             response.put("timestamp", LocalDateTime.now());
            
//             return ResponseEntity.ok(response);
            
//         } catch (Exception e) {
//             log.error("Error getting old unverified users", e);
//             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                     .body(createErrorResponse("FETCH_FAILED", "Failed to retrieve old unverified users."));
//         }
//     }

//     // HEALTH CHECK ENDPOINT

//     @GetMapping("/health")
//     public ResponseEntity<?> healthCheck() {
//         Map<String, Object> response = new HashMap<>();
//         response.put("status", "UP");
//         response.put("service", "auth-service");
//         response.put("timestamp", LocalDateTime.now());
//         response.put("version", "1.0.0");
        
//         return ResponseEntity.ok(response);
//     }

//     // HELPER METHODS

//     private Map<String, Object> createErrorResponse(String errorCode, String message) {
//         Map<String, Object> errorResponse = new HashMap<>();
//         errorResponse.put("success", false);
//         errorResponse.put("error", errorCode);
//         errorResponse.put("message", message);
//         errorResponse.put("timestamp", LocalDateTime.now());
        
//         return errorResponse;
//     }

//     // EXCEPTION HANDLERS

//     @ExceptionHandler(BadCredentialsException.class)
//     public ResponseEntity<?> handleBadCredentials(BadCredentialsException ex) {
//         return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
//                 .body(createErrorResponse("INVALID_CREDENTIALS", ex.getMessage()));
//     }

//     @ExceptionHandler(RateLimitException.class)
//     public ResponseEntity<?> handleRateLimit(RateLimitException ex) {
//         return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
//                 .body(createErrorResponse("RATE_LIMITED", ex.getMessage()));
//     }

//     @ExceptionHandler(DuplicateEmailException.class)
//     public ResponseEntity<?> handleDuplicateEmail(DuplicateEmailException ex) {
//         return ResponseEntity.status(HttpStatus.CONFLICT)
//                 .body(createErrorResponse("EMAIL_EXISTS", ex.getMessage()));
//     }

//     @ExceptionHandler(UserNotFoundException.class)
//     public ResponseEntity<?> handleUserNotFound(UserNotFoundException ex) {
//         return ResponseEntity.status(HttpStatus.NOT_FOUND)
//                 .body(createErrorResponse("USER_NOT_FOUND", ex.getMessage()));
//     }

//     @ExceptionHandler(Exception.class)
//     public ResponseEntity<?> handleGenericException(Exception ex) {
//         log.error("Unhandled exception occurred", ex);
//         return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                 .body(createErrorResponse("INTERNAL_ERROR", "An unexpected error occurred. Please try again later."));
//     }
// }