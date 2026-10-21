package com.greenpublic.ecommerce.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating order status
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderStatusUpdateRequest {
    private String orderStatus;
    private String paymentStatus;
    private String shippingStatus;
    private String fulfillmentStatus;
    private String trackingNumber;
    private String internalNotes;
}
