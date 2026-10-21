package com.greenpublic.ecommerce.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity representing an abandoned shopping cart.
 * Tracks carts that users started but didn't complete checkout.
 * Used for marketing and recovery campaigns.
 */
@Entity
@Table(name = "cart_abandonment_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartAbandonmentLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "cart_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal cartValue;

    @Column(name = "abandoned_at", nullable = false)
    private LocalDateTime abandonedAt = LocalDateTime.now();

    @Column(name = "recovery_email_sent_at")
    private LocalDateTime recoveryEmailSentAt;

    @Column(name = "recovery_email_count")
    @Builder.Default
    private Integer recoveryEmailCount = 0;

    @Column(name = "recovered")
    @Builder.Default
    private boolean recovered = false;

    @Column(name = "recovered_at")
    private LocalDateTime recoveredAt;

    @Column(name = "recovery_order_id")
    private Long recoveryOrderId; // Order ID if cart was recovered

    @Column(name = "cart_items_count")
    private Integer cartItemsCount;

    @Column(name = "source")
    private String source; // WEB, MOBILE, etc.

    @Column(name = "last_activity_ip")
    private String lastActivityIp;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
