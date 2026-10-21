package com.greenpublic.ecommerce.entity.enums;

/**
 * Enum representing the status of a payment transaction.
 * Used for payment processing audit trail and reconciliation.
 */
public enum TransactionStatus {
    /**
     * Payment transaction completed successfully
     */
    SUCCESS,

    /**
     * Payment transaction failed (declined, insufficient funds, etc.)
     */
    FAILED,

    /**
     * Payment transaction is pending (awaiting confirmation from payment gateway)
     */
    PENDING,

    /**
     * Payment transaction was cancelled before completion
     */
    CANCELLED,

    /**
     * Payment has been refunded
     */
    REFUNDED
}
