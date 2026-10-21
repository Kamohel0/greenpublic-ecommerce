package com.greenpublic.ecommerce.exception;

/**
 * Exception thrown when promo code validation fails.
 */
public class PromoCodeException extends RuntimeException {

    public PromoCodeException(String message) {
        super(message);
    }

    public PromoCodeException(String message, Throwable cause) {
        super(message, cause);
    }
}
