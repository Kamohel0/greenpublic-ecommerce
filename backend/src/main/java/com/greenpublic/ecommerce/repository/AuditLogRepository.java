package com.greenpublic.ecommerce.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.greenpublic.ecommerce.entity.AuditLog;

/**
 * Repository for AuditLog entity.
 * Handles all database operations for audit trail records.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    /**
     * Find all audit logs for a specific entity
     */
    List<AuditLog> findByEntityTypeAndEntityId(String entityType, Long entityId);

    /**
     * Find all logs for a specific action
     */
    List<AuditLog> findByAction(String action);

    /**
     * Find all logs performed by a specific user
     */
    List<AuditLog> findByPerformedById(Long userId);

    /**
     * Find logs created within a date range
     */
    List<AuditLog> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    /**
     * Find audit logs with pagination
     */
    Page<AuditLog> findByEntityTypeAndEntityId(String entityType, Long entityId, Pageable pageable);

    /**
     * Find logs for specific action with pagination
     */
    Page<AuditLog> findByAction(String action, Pageable pageable);

    /**
     * Find logs by user with pagination
     */
    Page<AuditLog> findByPerformedById(Long userId, Pageable pageable);

    /**
     * Find all changes to a specific entity in order
     */
    @Query("SELECT al FROM AuditLog al WHERE al.entityType = :entityType AND al.entityId = :entityId ORDER BY al.createdAt DESC")
    List<AuditLog> findEntityHistory(@Param("entityType") String entityType, @Param("entityId") Long entityId);

    /**
     * Find all sensitive action logs (for compliance)
     */
    @Query("SELECT al FROM AuditLog al WHERE al.action IN ('USER_LOCKED', 'PASSWORD_RESET', 'DATA_DELETION_REQUESTED') ORDER BY al.createdAt DESC")
    List<AuditLog> findSensitiveActions();

    /**
     * Count logs by action type
     */
    long countByAction(String action);

    /**
     * Find recent audit logs
     */
    @Query(value = "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT :limit", nativeQuery = true)
    List<AuditLog> findRecent(@Param("limit") int limit);
}
