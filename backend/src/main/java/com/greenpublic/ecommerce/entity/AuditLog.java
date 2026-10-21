package com.greenpublic.ecommerce.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity representing an audit log entry.
 * Tracks all significant actions and changes in the system for compliance and debugging.
 */
@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "action", nullable = false)
    private String action; // PRODUCT_CREATED, ORDER_REFUNDED, USER_LOCKED, etc.

    @Column(name = "entity_type", nullable = false)
    private String entityType; // Order, Product, User, Refund, etc.

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "old_value", columnDefinition = "LONGTEXT")
    private String oldValue; // JSON serialized

    @Column(name = "new_value", columnDefinition = "LONGTEXT")
    private String newValue; // JSON serialized

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by_user_id")
    private User performedBy;

    @Column(name = "user_id", nullable = false)
    private Long userId; // User associated with the entity (denormalized for query efficiency)

    @Column(name = "performed_by_ip")
    private String performedByIp;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "metadata", columnDefinition = "JSON")
    private String metadata; // Additional context as JSON
}
