package com.greenpublic.ecommerce.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.greenpublic.ecommerce.entity.Refund;
import com.greenpublic.ecommerce.entity.enums.RefundStatus;

/**
 * Repository for Refund entity.
 * Handles all database operations for refund records.
 */
@Repository
public interface RefundRepository extends JpaRepository<Refund, Long> {

    /**
     * Find all refunds for a specific order
     */
    List<Refund> findByOrderId(Long orderId);

    /**
     * Find refunds with a specific status
     */
    List<Refund> findByStatus(RefundStatus status);

    /**
     * Find a refund by its gateway refund ID
     */
    Optional<Refund> findByGatewayRefundId(String gatewayRefundId);

    /**
     * Find refunds requested within a date range
     */
    List<Refund> findByRequestedAtBetween(LocalDateTime start, LocalDateTime end);

    /**
     * Find pending refunds that need processing
     */
    @Query("SELECT r FROM Refund r WHERE r.status = 'PENDING' ORDER BY r.requestedAt ASC")
    List<Refund> findPendingRefunds();

    /**
     * Count refunds by status
     */
    long countByStatus(RefundStatus status);

    /**
     * Find failed refunds for retry
     */
    @Query("SELECT r FROM Refund r WHERE r.status = 'FAILED' ORDER BY r.requestedAt DESC")
    List<Refund> findFailedRefunds();

    /**
     * Check if an order already has a refund request
     */
    @Query("SELECT COUNT(r) > 0 FROM Refund r WHERE r.order.id = :orderId AND r.status IN ('PENDING', 'COMPLETED')")
    boolean hasActiveRefund(@Param("orderId") Long orderId);
}
