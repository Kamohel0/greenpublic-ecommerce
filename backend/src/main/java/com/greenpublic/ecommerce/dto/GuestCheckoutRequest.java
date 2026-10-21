package com.greenpublic.ecommerce.dto;

import java.util.List;

import lombok.Data;

@Data
public class GuestCheckoutRequest {
    private String guestEmail;
    private AddressRequest address;
    private List<GuestCheckoutItem> items;
    private String deliveryMethod; // 'delivery' or 'pickup'
}
