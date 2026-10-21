package com.greenpublic.ecommerce.entity.enums;

/**
 * Enum representing the status of a refund request.
 * Used for tracking refund processing through the payment gateway.
 */
public enum RefundStatus {
    /**
     * Refund request is pending processing
     */
    PENDING,

    /**
     * Refund has been successfully processed
     */
    COMPLETED,

    /**
     * Refund processing failed
     */
    FAILED,

    /**
     * Refund was cancelled
     */
    CANCELLED,

    /**
     * Refund is currently being processed
     */
    PROCESSING
}
