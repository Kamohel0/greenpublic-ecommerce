package com.greenpublic.ecommerce.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CheckoutResponse {
   
    public CheckoutResponse(OrderResponse orderResponse, String paymentUrl) {
        this.orderResponse = orderResponse;
        this.paymentUrl = paymentUrl;
    }
    private OrderResponse orderResponse;
    private String paymentUrl; // optional, for frontend if needed
     
   
}
