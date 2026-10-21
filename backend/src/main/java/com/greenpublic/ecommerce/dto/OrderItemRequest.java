package com.greenpublic.ecommerce.dto;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class OrderItemRequest {
    private Long productId;
    private int quantity;
    private BigDecimal price;
}
