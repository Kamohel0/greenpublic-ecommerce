package com.greenpublic.ecommerce.dto.inventory;

import java.time.LocalDateTime;

import com.greenpublic.ecommerce.entity.enums.TransactionType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for inventory transaction records.
 * Used for tracking stock movements and audit trails.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryTransactionDTO {

    private Long id;

    private Long productId;

    private String productName;

    private Integer quantityChange;

    private TransactionType transactionType;

    private String reference; // Order ID, RMA number, etc.

    private String notes;

    private String createdBy;

    private LocalDateTime createdAt;

    private String metadata;

    /**
     * Request DTO for recording inventory adjustments
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InventoryAdjustmentDTO {
        private Long productId;
        private Integer quantityChange;
        private TransactionType transactionType;
        private String reference;
        private String notes;
    }

    /**
     * Summary DTO for inventory status
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InventorySummaryDTO {
        private Long productId;
        private String productName;
        private Integer currentStock;
        private Integer reservedQuantity;
        private Integer availableStock;
        private Integer minStockLevel;
        private Integer maxStockLevel;
        private boolean isLowStock;
        private Integer totalOrdersThisMonth;
        private Integer totalReturnsThisMonth;
    }
}
