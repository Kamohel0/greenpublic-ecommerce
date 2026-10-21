package com.greenpublic.ecommerce.dto.admin;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItemDTO {
    private Long productId;
    private String productName;
    private String category;
    private BigDecimal price;
    private int stockQuantity;
    private int reservedQuantity;
    private int availableStock;
    private boolean lowStock;
    private LocalDateTime updatedAt;
}
