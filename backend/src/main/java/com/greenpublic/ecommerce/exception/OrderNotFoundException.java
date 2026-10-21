package com.greenpublic.ecommerce.exception;

public class OrderNotFoundException extends RuntimeException {
    public OrderNotFoundException(Long orderId) {
        super("Order not found with id: " + orderId);
    }
}

