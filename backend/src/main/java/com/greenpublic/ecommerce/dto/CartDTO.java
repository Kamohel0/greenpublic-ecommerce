package com.greenpublic.ecommerce.dto;

import java.math.BigDecimal;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class CartDTO {
    private List<CartItemDTO> items;
    private BigDecimal totalPrice;

 

  
}
