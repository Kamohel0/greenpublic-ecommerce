package com.greenpublic.ecommerce.dto;

import java.util.List;
import java.util.Map;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class OrderResponse {
    
    private boolean success;
    private String message;
    private Long orderId;
    private List<Map<String, Object>> unavailableProducts;

}

