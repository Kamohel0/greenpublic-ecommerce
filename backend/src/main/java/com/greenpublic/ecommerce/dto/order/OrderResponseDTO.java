package com.greenpublic.ecommerce.dto.order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.greenpublic.ecommerce.entity.enums.PaymentMethod;
import com.greenpublic.ecommerce.entity.enums.PaymentStatus;
import com.greenpublic.ecommerce.entity.enums.ShippingStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for responding with complete order information.
 * Contains all order details including payment and shipping status.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponseDTO {

    private Long id;

    private String orderNumber;

    private BigDecimal totalAmount;

    private String status; // From Order.OrderStatus enum

    private PaymentStatus paymentStatus;

    private ShippingStatus shippingStatus;

    private PaymentMethod paymentMethod;

    private String trackingNumber;

    private String customerNotes;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime paidAt;

    private LocalDateTime lastModifiedAt;

    private BigDecimal shippingCost;

    private BigDecimal taxAmount;

    private BigDecimal discountAmount;

    private BigDecimal subTotal;

    private Integer totalItems;

    private String yocoCheckoutUrl; // For payment redirect

    private AddressDTO shippingAddress;

    private AddressDTO billingAddress;

    private List<OrderItemResponseDTO> items;

    private List<PaymentTransactionDTO> paymentTransactions;

    private List<RefundDTO> refunds;

    private String internalNotes; // Only for admin

    /**
     * Nested DTO for address information
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AddressDTO {
        private Long addressId;
        private String name;
        private String surname;
        private String companyName;
        private String addressLine1;
        private String addressLine2;
        private String city;
        private String province;
        private String postalCode;
        private String country;
        private String phoneNo;
    }

    /**
     * Nested DTO for order items
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderItemResponseDTO {
        private Long productId;
        private String productName;
        private String productDescription;
        private String productImage;
        private int quantity;
        private BigDecimal unitPrice;
        private BigDecimal price; // Unit price
        private BigDecimal subtotal; // quantity * unitPrice
        private BigDecimal taxAmount;
        private BigDecimal discountApplied;
        private String discountReason;
        private String productSnapshotName; // Product name at time of order
        private String productSnapshotDescription; // Product description at time of order
    }

    /**
     * Nested DTO for payment transactions
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentTransactionDTO {
        private Long id;
        private String transactionId;
        private BigDecimal amount;
        private String currency;
        private String status;
        private PaymentMethod paymentMethod;
        private String paymentGateway;
        private String cardLast4;
        private String cardBrand;
        private String errorMessage;
        private LocalDateTime createdAt;
        private LocalDateTime processedAt;
    }

    /**
     * Nested DTO for refunds
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RefundDTO {
        private Long id;
        private BigDecimal refundAmount;
        private String status;
        private String refundReason;
        private String internalNotes;
        private String requestedBy;
        private LocalDateTime requestedAt;
        private LocalDateTime processedAt;
        private String errorMessage;
    }
}
