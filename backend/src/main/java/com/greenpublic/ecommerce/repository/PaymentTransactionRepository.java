package com.greenpublic.ecommerce.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.greenpublic.ecommerce.entity.PaymentTransaction;
import com.greenpublic.ecommerce.entity.enums.TransactionStatus;

/**
 * Repository for PaymentTransaction entity.
 * Handles all database operations for payment transaction records.
 */
@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    /**
     * Find a transaction by its unique transaction ID
     */
    Optional<PaymentTransaction> findByTransactionId(String transactionId);

    /**
     * Find a transaction by payment gateway reference
     */
    Optional<PaymentTransaction> findByGatewayReference(String gatewayReference);

    /**
     * Find all transactions for a specific order
     */
    List<PaymentTransaction> findByOrderId(Long orderId);

    /**
     * Find all transactions with a specific status
     */
    List<PaymentTransaction> findByStatus(TransactionStatus status);

    /**
     * Find transactions created within a date range
     */
    List<PaymentTransaction> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    /**
     * Count transactions by status
     */
    long countByStatus(TransactionStatus status);

    /**
     * Find failed transactions (for retry logic)
     */
    @Query("SELECT pt FROM PaymentTransaction pt WHERE pt.status = 'FAILED' ORDER BY pt.createdAt DESC")
    List<PaymentTransaction> findFailedTransactions();

    /**
     * Find pending transactions that may need processing
     */
    @Query("SELECT pt FROM PaymentTransaction pt WHERE pt.status = 'PENDING' AND pt.createdAt < :expiryTime")
    List<PaymentTransaction> findExpiredPendingTransactions(@Param("expiryTime") LocalDateTime expiryTime);
}
