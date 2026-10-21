package com.greenpublic.ecommerce.dto.admin;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.greenpublic.ecommerce.entity.enums.PaymentMethod;
import com.greenpublic.ecommerce.entity.enums.PaymentStatus;
import com.greenpublic.ecommerce.entity.enums.ShippingStatus;
import com.greenpublic.ecommerce.entity.enums.FulfillmentStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Admin DTO for complete order information including customer details
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminOrderDTO {

    private Long id;
    private String orderNumber;
    private String guestEmail;
    private BigDecimal totalAmount;
    private String status;
    private PaymentStatus paymentStatus;
    private ShippingStatus shippingStatus;
    private FulfillmentStatus fulfillmentStatus;
    private PaymentMethod paymentMethod;
    private String trackingNumber;
    private String deliveryMethod;
    private String customerNotes;
    private String internalNotes;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime paidAt;
    private LocalDateTime lastModifiedAt;
    private LocalDateTime fulfillmentUpdatedAt;
    private LocalDateTime pickupReadyNotifiedAt;
    
    private BigDecimal shippingCost;
    private BigDecimal taxAmount;
    private BigDecimal discountAmount;
    private BigDecimal subTotal;
    
    private CustomerDTO customer;
    private AddressDTO shippingAddress;
    private List<OrderItemDTO> items;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CustomerDTO {
        private Long userId;
        private String name;
        private String surname;
        private String email;
        private String phoneNumber;
    }
    
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
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderItemDTO {
        private Long id;
        private Long productId;
        private String productName;
        private Integer quantity;
        private BigDecimal price;
        private BigDecimal total;
        private Integer remainingStock;
        private Boolean lowStock;
    }
}
