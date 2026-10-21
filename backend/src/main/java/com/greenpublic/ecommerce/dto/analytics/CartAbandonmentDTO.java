package com.greenpublic.ecommerce.dto.analytics;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for cart abandonment tracking and analytics.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartAbandonmentDTO {

    private Long id;

    private Long userId;

    private String userEmail;

    private BigDecimal cartValue;

    private Integer cartItemsCount;

    private LocalDateTime abandonedAt;

    private LocalDateTime recoveryEmailSentAt;

    private Integer recoveryEmailCount;

    private boolean recovered;

    private LocalDateTime recoveredAt;

    private Long recoveryOrderId;

    private String source; // WEB, MOBILE, etc.

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    /**
     * Analytics summary DTO
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CartAbandonmentSummaryDTO {
        private long totalAbandonedCarts;
        private long recoveredCarts;
        private long unrecoveredCarts;
        private double recoveryRate; // Percentage
        private BigDecimal totalAbandonedValue;
        private BigDecimal averageCartValue;
        private BigDecimal totalRecoveredValue;
        private long emailsSentLastDay;
        private LocalDateTime periodStart;
        private LocalDateTime periodEnd;
    }
}
