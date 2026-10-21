package com.greenpublic.ecommerce.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.greenpublic.ecommerce.entity.InventoryTransaction;
import com.greenpublic.ecommerce.entity.enums.TransactionType;

/**
 * Repository for InventoryTransaction entity.
 * Handles all database operations for inventory movement records.
 */
@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {

    /**
     * Find all transactions for a specific product
     */
    List<InventoryTransaction> findByProductId(Long productId);

    /**
     * Find transactions of a specific type
     */
    List<InventoryTransaction> findByTransactionType(TransactionType transactionType);

    /**
     * Find transactions created within a date range
     */
    List<InventoryTransaction> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    /**
     * Find transactions for a product within a date range
     */
    @Query("SELECT it FROM InventoryTransaction it WHERE it.product.id = :productId AND it.createdAt BETWEEN :start AND :end ORDER BY it.createdAt DESC")
    List<InventoryTransaction> findProductTransactionHistory(
        @Param("productId") Long productId,
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end
    );

    /**
     * Calculate total quantity change for a product
     */
    @Query("SELECT COALESCE(SUM(it.quantityChange), 0) FROM InventoryTransaction it WHERE it.product.id = :productId")
    long getTotalQuantityChange(@Param("productId") Long productId);

    /**
     * Find return transactions
     */
    @Query("SELECT it FROM InventoryTransaction it WHERE it.transactionType = 'RETURN' ORDER BY it.createdAt DESC")
    List<InventoryTransaction> findReturnTransactions();

    /**
     * Find damaged item transactions
     */
    @Query("SELECT it FROM InventoryTransaction it WHERE it.transactionType = 'DAMAGED' ORDER BY it.createdAt DESC")
    List<InventoryTransaction> findDamagedTransactions();

    /**
     * Find expired item transactions
     */
    @Query("SELECT it FROM InventoryTransaction it WHERE it.transactionType = 'EXPIRED' ORDER BY it.createdAt DESC")
    List<InventoryTransaction> findExpiredTransactions();

    /**
     * Find adjustment transactions (for reconciliation)
     */
    @Query("SELECT it FROM InventoryTransaction it WHERE it.transactionType = 'ADJUSTMENT' ORDER BY it.createdAt DESC")
    List<InventoryTransaction> findAdjustmentTransactions();

    /**
     * Count transactions by type
     */
    long countByTransactionType(TransactionType transactionType);

    /**
     * Find transactions with specific reference (e.g., order ID)
     */
    List<InventoryTransaction> findByReference(String reference);
}
