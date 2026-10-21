package com.greenpublic.ecommerce.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "password_reset_tokens", indexes = {
    @Index(name = "idx_password_reset_token", columnList = "token"),
    @Index(name = "idx_password_reset_user_id", columnList = "user_id"),
    @Index(name = "idx_password_reset_expiry", columnList = "expiryDate")
})
public class PasswordResetToken {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 44) // Base64 URL encoded 32 bytes
    private String token;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    private LocalDateTime expiryDate;
    
    @Column(nullable = false)
    private boolean used = false;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    // Default constructor for JPA
    protected PasswordResetToken() {}
    
    // Use this constructor instead of the default one
    public PasswordResetToken(User user, String token, int expirationHours) {
        this.user = user;
        this.token = token;
        this.createdAt = LocalDateTime.now();
        this.expiryDate = calculateExpiryDate(expirationHours);
        this.used = false;
    }
    
    private LocalDateTime calculateExpiryDate(int expirationHours) {
        return LocalDateTime.now().plusHours(expirationHours);
    }
    
    public boolean isValid() {
        return !used && !isExpired();
    }
    
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiryDate);
    }
    
    // Getters and setters
    public Long getId() { return id; }
    public String getToken() { return token; }
    public User getUser() { return user; }
    public LocalDateTime getExpiryDate() { return expiryDate; }
    public boolean isUsed() { return used; }
    public void setUsed(boolean used) { this.used = used; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}