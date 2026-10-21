package com.greenpublic.ecommerce.exception;

/**
 * Exception thrown when refund operation fails.
 */
public class RefundException extends RuntimeException {

    public RefundException(String message) {
        super(message);
    }

    public RefundException(String message, Throwable cause) {
        super(message, cause);
    }
}
