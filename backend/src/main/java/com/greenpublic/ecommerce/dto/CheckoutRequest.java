package com.greenpublic.ecommerce.dto;

import lombok.Data;

@Data
public class CheckoutRequest {
   
    private Long addressId; // ID of the shipping address
    private String deliveryMethod; // 'delivery' or 'pickup'
  
}
