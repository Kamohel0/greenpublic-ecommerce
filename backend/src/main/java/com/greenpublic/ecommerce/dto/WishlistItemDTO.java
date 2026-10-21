package com.greenpublic.ecommerce.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class WishlistItemDTO {
    private Long id;
    private Long productId;
    private String name;
    private BigDecimal price;
    private String productImage;
    private LocalDateTime addedAt;
}
