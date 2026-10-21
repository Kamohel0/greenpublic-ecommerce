package com.greenpublic.ecommerce.dto.order;

import java.math.BigDecimal;

import com.greenpublic.ecommerce.entity.enums.PaymentMethod;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for creating or updating an order.
 * Contains all required and optional information for order placement.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderRequestDTO {

    @NotNull(message = "Address ID cannot be null")
    private Long addressId;

    private PaymentMethod paymentMethod = PaymentMethod.YOCO;

    private String customerNotes;

    private String promoCode;

    @Positive(message = "Shipping cost must be positive")
    private BigDecimal shippingCost = BigDecimal.ZERO;

    private String shippingMethod; // STANDARD, EXPRESS, OVERNIGHT, etc.

    private AddressRequestDTO billingAddress; // Optional - if different from shipping

    // Metadata
    private String sourceDevice; // WEB, MOBILE, TABLET
    private String sourceChannel; // DIRECT, AFFILIATE, EMAIL, etc.

    /**
     * Nested DTO for address information
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AddressRequestDTO {
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
        private boolean isDefault;
    }
}
