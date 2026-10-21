package com.greenpublic.ecommerce.dto.order;

import java.math.BigDecimal;

import java.time.LocalDateTime;

import java.util.List;


import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrderDTO {
    private Long orderId;
    private String orderNumber;
    private BigDecimal totalAmount;
    private String status;
    private String paymentStatus;
    private String deliveryMethod;
    private BigDecimal shippingCost;
    private String fulfillmentStatus;
    private LocalDateTime fulfillmentUpdatedAt;
    private LocalDateTime pickupReadyNotifiedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime paidAt;
    private String yocoCheckoutUrl;
    private AddressDTO shippingAddress;
    private List<OrderItemDTO> orderItems;
     // NEW field
    private Integer totalItems;



    

    // ====================
    @Data
    @Builder
    public static class AddressDTO {
        private Long addressId;
        private String addressLine1;
        private String addressLine2;
        private String name;
        private String city;
        private String province;
        private String postalCode;
        private String country;
        private String phoneNo;
        private String surname;
        private String companyName;
    }

    @Data
    @Builder
    public static class OrderItemDTO {
        private Long productId;
        private String productName;
        private int quantity;
        private BigDecimal price;    // raw unit price
        private BigDecimal subtotal; // raw subtotal

        
    }
}
