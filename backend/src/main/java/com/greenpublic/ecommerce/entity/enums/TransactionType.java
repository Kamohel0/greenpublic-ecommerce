package com.greenpublic.ecommerce.entity.enums;

/**
 * Enum representing the type of inventory transaction.
 * Used for inventory audit trail and stock reconciliation.
 */
public enum TransactionType {
    /**
     * Stock deducted due to order placement
     */
    ORDER,

    /**
     * Stock restored due to order return
     */
    RETURN,

    /**
     * Stock increased due to new inventory received
     */
    RESTOCK,

    /**
     * Manual inventory adjustment (inventory count discrepancy)
     */
    ADJUSTMENT,

    /**
     * Stock deducted due to damaged or defective items
     */
    DAMAGED,

    /**
     * Stock deducted for item sold
     */
    SOLD,

    /**
     * Stock deducted for expired items
     */
    EXPIRED
}
