package com.greenpublic.ecommerce.dto.promo;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.greenpublic.ecommerce.entity.enums.DiscountType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for promo code information.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromoCouDTO {

    private Long id;

    private String code;

    private DiscountType discountType;

    private BigDecimal discountValue;

    private Integer usageLimit;

    private Integer usageCount;

    private LocalDateTime validFrom;

    private LocalDateTime validUntil;

    private BigDecimal minPurchaseAmount;

    private BigDecimal maxDiscountAmount;

    private boolean isActive;

    private String description;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    /**
     * Request DTO for creating/updating promo codes (admin only)
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PromoCodeRequestDTO {
        @NotBlank(message = "Code cannot be blank")
        private String code;

        @NotNull(message = "Discount type cannot be null")
        private DiscountType discountType;

        @NotNull(message = "Discount value cannot be null")
        @Positive(message = "Discount value must be positive")
        private BigDecimal discountValue;

        private Integer usageLimit; // null for unlimited

        @NotNull(message = "Valid from date cannot be null")
        private LocalDateTime validFrom;

        @NotNull(message = "Valid until date cannot be null")
        private LocalDateTime validUntil;

        private BigDecimal minPurchaseAmount;

        private BigDecimal maxDiscountAmount;

        @Builder.Default
        private boolean isActive = true;

        private String description;
    }

    /**
     * Response DTO for validating promo codes
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PromoCodeValidationDTO {
        private boolean valid;
        private String code;
        private DiscountType discountType;
        private BigDecimal discountValue;
        private BigDecimal maxDiscountAmount;
        private BigDecimal minPurchaseAmount;
        private String reason; // If invalid
    }
}
