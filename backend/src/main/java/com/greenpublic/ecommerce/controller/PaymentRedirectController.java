package com.greenpublic.ecommerce.controller;

import com.greenpublic.ecommerce.entity.Order;
import com.greenpublic.ecommerce.entity.OrderItem;
import com.greenpublic.ecommerce.repository.OrderRepository;
import com.greenpublic.ecommerce.repository.ProductRepository;
import com.greenpublic.ecommerce.service.PaymentTransactionLoggingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
public class PaymentRedirectController {

    private static final Logger log = LoggerFactory.getLogger(PaymentRedirectController.class);

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final PaymentTransactionLoggingService paymentLoggingService;

    public PaymentRedirectController(OrderRepository orderRepository,
                                     ProductRepository productRepository,
                                     PaymentTransactionLoggingService paymentLoggingService) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.paymentLoggingService = paymentLoggingService;
    }

    @GetMapping("/payment/redirect")
    @Transactional
    public ResponseEntity<Void> redirect(
            @RequestParam String status,
            @RequestParam Long orderId
    ) {
        try {
            if ("success".equals(status)) {
                Order order = orderRepository.findById(orderId)
                        .orElseThrow(() -> new RuntimeException("Order not found"));

                // Only update if not already paid
                if (order.getStatus() != Order.OrderStatus.PAID && 
                    order.getStatus() != Order.OrderStatus.COMPLETED) {
                    
                    log.info("Updating order {} to PAID status after successful payment redirect", orderId);
                    
                    // Update order status
                    order.setStatus(Order.OrderStatus.PAID);
                    order.setPaymentStatus(com.greenpublic.ecommerce.entity.enums.PaymentStatus.COMPLETED);
                    order.setPaidAt(LocalDateTime.now());
                    order.setReserved(false);

                    // Decrement stock quantities
                    List<com.greenpublic.ecommerce.entity.Product> productsToSave = new ArrayList<>();
                    for (OrderItem item : order.getOrderItems()) {
                        com.greenpublic.ecommerce.entity.Product p = productRepository.findById(item.getProduct().getId())
                                .orElseThrow(() -> new RuntimeException("Product not found"));
                        int newReserved = Math.max(0, p.getReservedQuantity() - item.getQuantity());
                        p.setReservedQuantity(newReserved);
                        p.setStockQuantity(Math.max(0, p.getStockQuantity() - item.getQuantity()));
                        productsToSave.add(p);
                    }
                    productRepository.saveAll(productsToSave);
                    orderRepository.save(order);

                    log.info("Order {} successfully updated to PAID", orderId);
                } else {
                    log.info("Order {} already in status {}, skipping update", orderId, order.getStatus());
                }
            } else if ("failure".equals(status) || "cancel".equals(status)) {
                // Release stock reservation on failure/cancel
                Order order = orderRepository.findById(orderId).orElse(null);
                if (order != null && order.isReserved()) {
                    order.setReserved(false);
                    orderRepository.save(order);
                    log.info("Released reservation for order {} due to {} redirect", orderId, status);
                }
            }
        } catch (Exception e) {
            log.error("Error processing payment redirect for order {}: {}", orderId, e.getMessage(), e);
        }

        // Always redirect to frontend regardless of backend processing
        URI uri = URI.create(frontendUrl + "/profile?tab=orders&status=" + status + "&orderId=" + orderId);
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(uri);
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }
}