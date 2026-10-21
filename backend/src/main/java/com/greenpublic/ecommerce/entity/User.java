package com.greenpublic.ecommerce.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {

       public enum Role {
    USER,
    ADMIN,
    OWNER,
    
}

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String surname;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

     @Column(nullable = false)
    private boolean isActive;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private Role role = Role.USER;

    @Builder.Default
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // 👇 new field for token revocation
    @Builder.Default
    @Column(name = "token_version", nullable = false)
    private Long tokenVersion = 0L; 

    // Additional fields for email verification and password reset
    private String emailVerificationToken;

    private LocalDateTime emailVerificationExpiry;

    private LocalDateTime lastLogin;

    private LocalDateTime lastReminderSent;

    @Builder.Default
    private boolean isLocked = false;

     @Builder.Default
    private boolean isMfaEnabled = false;

    private String lastLoginIp;

    @Builder.Default
    @Column(name = "is_google_login")
    private boolean isGoogleLogin = false;
    
    @Column(name = "google_id")
    private String googleId;

    // ============= NEW PRODUCTION FIELDS =============

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "two_factor_enabled")
    @Builder.Default
    private boolean twoFactorEnabled = false;

    @Column(name = "two_factor_secret")
    private String twoFactorSecret;

    @Column(name = "failed_login_attempts")
    @Builder.Default
    private Integer failedLoginAttempts = 0;

    @Column(name = "account_locked_until")
    private LocalDateTime accountLockedUntil;

    @Column(name = "password_changed_at")
    private LocalDateTime passwordChangedAt;

    @Column(name = "last_ip_address")
    private String lastIpAddress;

    @Column(name = "marketing_consent")
    @Builder.Default
    private boolean marketingConsent = false;

    @Column(name = "data_deletion_requested_at")
    private LocalDateTime dataDeletionRequestedAt;

    @Column(name = "is_verified")
    @Builder.Default
    private boolean isVerified = false;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "email_verified_at")
    private LocalDateTime emailVerifiedAt;

    @Column(name = "phone_verified_at")
    private LocalDateTime phoneVerifiedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_status")
    @Builder.Default
    private AccountStatus accountStatus = AccountStatus.ACTIVE;

    @Column(name = "language_preference")
    @Builder.Default
    private String languagePreference = "en";

    @Column(name = "currency_preference")
    @Builder.Default
    private String currencyPreference = "ZAR";

    // ============= RELATIONSHIPS =============

    // @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    // private List<AuditLog> auditLogs = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CartAbandonmentLog> cartAbandonmentLogs = new ArrayList<>();

    // @OneToMany(mappedBy = "performedBy", cascade = CascadeType.ALL, orphanRemoval = true)
    // private List<AuditLog> performedAuditLogs = new ArrayList<>();

    // ============= ACCOUNT STATUS ENUM =============

    public enum AccountStatus {
        ACTIVE,
        INACTIVE,
        SUSPENDED,
        LOCKED,
        DELETED
    }

   
}
