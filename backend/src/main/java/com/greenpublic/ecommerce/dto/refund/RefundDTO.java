package com.greenpublic.ecommerce.dto.refund;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.greenpublic.ecommerce.entity.enums.RefundStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for refund requests and responses.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundDTO {

    private Long id;

    private Long orderId;

    @Positive(message = "Refund amount must be positive")
    private BigDecimal refundAmount;

    private RefundStatus status;

    @NotBlank(message = "Refund reason cannot be blank")
    private String refundReason;

    private String internalNotes;

    private String gatewayRefundId;

    private String requestedBy;

    private LocalDateTime requestedAt;

    private LocalDateTime processedAt;

    private String errorCode;

    private String errorMessage;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    /**
     * Request DTO for creating refund requests
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RefundRequestDTO {
        @NotNull(message = "Order ID cannot be null")
        private Long orderId;

        @NotNull(message = "Refund amount cannot be null")
        @Positive(message = "Refund amount must be positive")
        private BigDecimal refundAmount;

        @NotBlank(message = "Refund reason cannot be blank")
        private String refundReason;

        private String internalNotes;
    }
}
