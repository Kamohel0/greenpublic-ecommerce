package com.greenpublic.ecommerce.entity.enums;

/**
 * Enum representing the type of discount applied to promotional codes.
 * Used for calculating discount amounts during checkout.
 */
public enum DiscountType {
    /**
     * Discount as a percentage of order total (e.g., 10% off)
     */
    PERCENTAGE,

    /**
     * Discount as a fixed monetary amount (e.g., R50 off)
     */
    FIXED_AMOUNT,

    /**
     * Free shipping on order
     */
    FREE_SHIPPING
}
