package com.greenpublic.ecommerce.exception;

import java.util.List;
import java.util.Map;

public class ProductStockUnavailableException extends RuntimeException {
    private final List<Map<String, Object>> unavailableProducts;

    public ProductStockUnavailableException(String message, List<Map<String, Object>> unavailableProducts) {
        super(message);
        this.unavailableProducts = unavailableProducts;
    }

    public List<Map<String, Object>> getUnavailableProducts() {
        return unavailableProducts;
    }
}

