package com.greenpublic.ecommerce.controller;

import com.greenpublic.ecommerce.entity.Order;
import com.greenpublic.ecommerce.entity.OrderItem;
import com.greenpublic.ecommerce.entity.enums.FulfillmentStatus;
import com.greenpublic.ecommerce.repository.OrderRepository;
import com.greenpublic.ecommerce.repository.ProductRepository;
import com.greenpublic.ecommerce.service.PaymentTransactionLoggingService;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/webhook")
public class YocoWebhookController {

    private static final Logger log = LoggerFactory.getLogger(YocoWebhookController.class);

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final PaymentTransactionLoggingService paymentLoggingService;

    public YocoWebhookController(OrderRepository orderRepository,
                                 ProductRepository productRepository,
                                 PaymentTransactionLoggingService paymentLoggingService) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.paymentLoggingService = paymentLoggingService;
    }

    /**
     * Webhook endpoint for Yoco payment notifications
     * Called by Yoco when checkout payment is completed
     */
    @PostMapping("/yoco")
    @Transactional
    public ResponseEntity<Map<String, String>> handleYocoWebhook(@RequestBody String payload) {
        try {
            log.info("Received Yoco webhook: {}", payload);
            
            JSONObject webhookData = new JSONObject(payload);
            String type = webhookData.optString("type", "");

            // Handle checkout.succeeded event
            if ("checkout.succeeded".equals(type) || "payment.succeeded".equals(type)) {
                JSONObject data = webhookData.optJSONObject("payload");
                if (data == null) {
                    data = webhookData; // Some webhook formats put data at root
                }

                // Extract order ID from metadata
                JSONObject metadata = data.optJSONObject("metadata");
                if (metadata == null) {
                    log.warn("No metadata in webhook payload");
                    return ResponseEntity.ok(Map.of("status", "ignored", "message", "No metadata"));
                }

                Long orderId = metadata.optLong("order_id", 0L);
                if (orderId == 0L) {
                    log.warn("No order_id in webhook metadata");
                    return ResponseEntity.ok(Map.of("status", "ignored", "message", "No order_id"));
                }

                // Find and update order
                Order order = orderRepository.findById(orderId).orElse(null);
                if (order == null) {
                    log.error("Order {} not found for webhook", orderId);
                    return ResponseEntity.ok(Map.of("status", "error", "message", "Order not found"));
                }

                // Only update if not already paid
                if (order.getStatus() != Order.OrderStatus.PAID && 
                    order.getStatus() != Order.OrderStatus.COMPLETED) {
                    
                    log.info("Webhook updating order {} to PAID status", orderId);

                    // Update order status
                    order.setStatus(Order.OrderStatus.PAID);
                    order.setPaymentStatus(com.greenpublic.ecommerce.entity.enums.PaymentStatus.COMPLETED);
                    order.setPaidAt(LocalDateTime.now());
                    order.setReserved(false);

                    // Decrement stock quantities (transaction-safe)
                    List<com.greenpublic.ecommerce.entity.Product> productsToSave = new ArrayList<>();
                    for (OrderItem item : order.getOrderItems()) {
                        com.greenpublic.ecommerce.entity.Product p = productRepository.findById(item.getProduct().getId())
                                .orElseThrow(() -> new RuntimeException("Product not found"));

                        if (p.getStockQuantity() < item.getQuantity()) {
                            log.error("Insufficient stock during payment capture for order {} product {}", orderId, p.getId());
                            return ResponseEntity.status(HttpStatus.CONFLICT)
                                    .body(Map.of("status", "error", "message", "Insufficient stock for product " + p.getName()));
                        }

                        int newReserved = Math.max(0, p.getReservedQuantity() - item.getQuantity());
                        p.setReservedQuantity(newReserved);
                        p.setStockQuantity(Math.max(0, p.getStockQuantity() - item.getQuantity()));
                        productsToSave.add(p);
                    }

                    if ("pickup".equalsIgnoreCase(order.getDeliveryMethod())) {
                        order.setFulfillmentStatus(FulfillmentStatus.READY_FOR_PICKUP);
                    } else {
                        order.setFulfillmentStatus(FulfillmentStatus.HANDED_TO_COURIER);
                    }
                    order.setFulfillmentUpdatedAt(LocalDateTime.now());

                    productRepository.saveAll(productsToSave);
                    orderRepository.save(order);

                    // Log transaction
                    try {
                        String transactionId = data.optString("id", "webhook-" + orderId);
                        paymentLoggingService.logSuccessfulCharge(
                            orderId, 
                            transactionId, 
                            order.getTotalAmount(), 
                            "YOCO", 
                            null
                        );
                    } catch (Exception e) {
                        log.warn("Failed to log payment transaction from webhook: {}", e.getMessage());
                    }

                    log.info("Webhook successfully updated order {} to PAID", orderId);
                    return ResponseEntity.ok(Map.of("status", "success", "orderId", orderId.toString()));
                } else {
                    log.info("Order {} already in status {}, webhook ignored", orderId, order.getStatus());
                    return ResponseEntity.ok(Map.of("status", "already_processed", "orderId", orderId.toString()));
                }
            } else if ("checkout.failed".equals(type) || "payment.failed".equals(type)) {
                // Handle failed payment
                log.info("Received failed payment webhook: {}", type);
                return ResponseEntity.ok(Map.of("status", "acknowledged", "type", type));
            } else {
                log.info("Received webhook with type: {}", type);
                return ResponseEntity.ok(Map.of("status", "acknowledged", "type", type));
            }

        } catch (Exception e) {
            log.error("Error processing Yoco webhook: {}", e.getMessage(), e);
            // Return 200 even on error to prevent Yoco from retrying
            return ResponseEntity.ok(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    /**
     * Test endpoint to verify webhook is accessible
     */
    @GetMapping("/yoco")
    public ResponseEntity<Map<String, String>> testWebhook() {
        return ResponseEntity.ok(Map.of(
            "status", "ok",
            "message", "Yoco webhook endpoint is active",
            "timestamp", LocalDateTime.now().toString()
        ));
    }
}
