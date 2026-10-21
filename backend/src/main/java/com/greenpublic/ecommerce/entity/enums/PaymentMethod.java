package com.greenpublic.ecommerce.entity.enums;

/**
 * Enum representing the payment method used for an order.
 * Supports multiple payment providers and methods.
 */
public enum PaymentMethod {
    /**
     * Payment via Yoco payment gateway (ZAR cards, mobile wallets)
     */
    YOCO,

    /**
     * Payment via bank transfer (EFT)
     */
    BANK_TRANSFER,

    /**
     * Cash on delivery - payment collected at delivery
     */
    CASH_ON_DELIVERY,

    /**
     * Payment via PayPal
     */
    PAYPAL,

    /**
     * Credit or debit card payment (generic)
     */
    CREDIT_CARD
}
