package com.greenpublic.ecommerce.entity.enums;

/**
 * Enum representing the shipping status of an order.
 * Tracks the fulfillment and delivery progress of orders.
 */
public enum ShippingStatus {
    /**
     * Order has not been shipped yet
     */
    NOT_SHIPPED,

    /**
     * Order is being processed for shipment
     */
    PROCESSING,

    /**
     * Order has been shipped and handed to carrier
     */
    SHIPPED,

    /**
     * Order is in transit to destination
     */
    IN_TRANSIT,

    /**
     * Order has been delivered to customer
     */
    DELIVERED,

    /**
     * Shipment was cancelled
     */
    CANCELLED,

    /**
     * Order has been returned by customer
     */
    RETURNED
}
