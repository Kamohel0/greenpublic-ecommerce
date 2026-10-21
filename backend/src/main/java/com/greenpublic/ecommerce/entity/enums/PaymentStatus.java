package com.greenpublic.ecommerce.entity.enums;

/**
 * Enum representing the payment status of an order.
 * Used to track the payment processing state independently from order status.
 */
public enum PaymentStatus {
    /**
     * Payment is awaiting processing
     */
    PENDING,

    /**
     * Payment has been successfully processed
     */
    COMPLETED,

    /**
     * Payment processing failed
     */
    FAILED,

    /**
     * Payment has been fully refunded
     */
    REFUNDED,

    /**
     * Payment has been partially refunded
     */
    PARTIALLY_REFUNDED,

    /**
     * Payment was cancelled by customer or admin
     */
    CANCELLED
}
