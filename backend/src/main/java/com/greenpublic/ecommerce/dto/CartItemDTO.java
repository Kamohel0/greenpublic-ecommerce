package com.greenpublic.ecommerce.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class CartItemDTO {
    private Long productId;
    private String productName;
    private String productImage; // Add image field for frontend
    private int quantity;
    private BigDecimal price; // Unit price for consistency with frontend
    private BigDecimal totalPrice; // price * quantity
    private LocalDateTime addedAt;
    private String lowStockMessage; // new optional field

}
