package com.greenpublic.ecommerce.controller;


import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.greenpublic.ecommerce.dto.order.OrderDTO;

import com.greenpublic.ecommerce.service.orders.OrderService;

import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }


 @GetMapping("/by-user")
public ResponseEntity<Page<OrderDTO>> getOrders(
        @AuthenticationPrincipal UserDetails userDetails,
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer size) {

    Page<OrderDTO> orders = orderService.getOrdersByUserEmail(userDetails.getUsername(), page, size);
    return ResponseEntity.ok(orders);
}

@GetMapping("/{id}")
public ResponseEntity<OrderDTO> getOrderById(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails userDetails) {

    OrderDTO order = orderService.getOrderById(id, userDetails.getUsername());
    return ResponseEntity.ok(order);
}



    
}
