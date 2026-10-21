package com.greenpublic.ecommerce.dto;

import lombok.Data;

@Data
public class GuestCheckoutItem {
    private Long productId;
    private Integer quantity;
}
