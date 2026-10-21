package com.greenpublic.ecommerce.dto.payment;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.greenpublic.ecommerce.entity.enums.PaymentMethod;
import com.greenpublic.ecommerce.entity.enums.TransactionStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for payment transaction information.
 * Used in responses to display transaction details without exposing sensitive data.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentTransactionDTO {

    private Long id;

    private Long orderId;

    private String transactionId;

    private BigDecimal amount;

    private String currency;

    private TransactionStatus status;

    private PaymentMethod paymentMethod;

    private String paymentGateway;

    private String gatewayReference;

    private String cardLast4;

    private String cardBrand;

    private Integer cardExpiryMonth;

    private Integer cardExpiryYear;

    private String errorCode;

    private String errorMessage;

    private String customerEmail;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime processedAt;

    private LocalDateTime refundedAt;
}
