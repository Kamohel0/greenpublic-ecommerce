package com.greenpublic.ecommerce.dto;

import lombok.Data;

@Data
public class AddToCartRequest {
    
    private Long productId;
    private int quantity;
    private String action;
}
