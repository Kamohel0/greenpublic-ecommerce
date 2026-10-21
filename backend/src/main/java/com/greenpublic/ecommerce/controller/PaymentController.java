package com.greenpublic.ecommerce.controller;

import com.greenpublic.ecommerce.dto.CheckoutResponse;
import com.greenpublic.ecommerce.dto.OrderResponse;
import com.greenpublic.ecommerce.entity.Order;
import com.greenpublic.ecommerce.entity.OrderItem;
import com.greenpublic.ecommerce.service.orders.OrderService;
import com.greenpublic.ecommerce.service.PaymentTransactionLoggingService;
import com.greenpublic.ecommerce.repository.OrderRepository;
import com.greenpublic.ecommerce.repository.ProductRepository;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    private final OrderService orderService;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final PaymentTransactionLoggingService paymentLoggingService;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${yoco.api.secret-key}")
    private String secretKey;

    public PaymentController(OrderService orderService,
                             OrderRepository orderRepository,
                             ProductRepository productRepository,
                             PaymentTransactionLoggingService paymentLoggingService) {
        this.orderService = orderService;
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.paymentLoggingService = paymentLoggingService;
    }

    public static class ChargeRequest {
        public Long addressId;
        public String yocoToken;
    }

    @PostMapping("/charge")
    public ResponseEntity<?> chargeCard(@AuthenticationPrincipal UserDetails userDetails,
                                        @RequestBody ChargeRequest req) {

        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
        }

        // 1) create order (reserve stock)
        OrderResponse orderResp = orderService.createOrder(userDetails.getUsername(), req.addressId);
        if (!orderResp.isSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(orderResp);
        }

        Long orderId = orderResp.getOrderId();
        Order order = orderService.getOrderById(orderId);

        // 2) call Yoco Charges API with provided token
        String url = "https://payments.yoco.com/api/charges";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + secretKey);

        long amountInCents = order.getTotalAmount().multiply(BigDecimal.valueOf(100)).longValue();

        JSONObject body = new JSONObject();
        body.put("amount", amountInCents);
        body.put("currency", "ZAR");
        // try a few common token keys in case SDK returns different names on callback
        body.put("token", req.yocoToken);
        JSONObject metadata = new JSONObject();
        metadata.put("order_id", order.getId());
        metadata.put("customer_email", userDetails.getUsername());
        body.put("metadata", metadata);

        HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);

        try {
            ResponseEntity<String> resp = restTemplate.postForEntity(url, entity, String.class);

            // On success, update order status and product stock
            if (resp.getStatusCode().is2xxSuccessful()) {
                // mark order paid
                order.setStatus(Order.OrderStatus.PAID);
                order.setPaidAt(LocalDateTime.now());
                order.setReserved(false);

                // Log payment to payment_transactions
                try {
                    JSONObject yocoResp = new JSONObject(resp.getBody());
                    String transactionId = yocoResp.optString("id", "unknown");
                    String cardLast4 = yocoResp.optString("cardLastFour", null);
                    paymentLoggingService.logSuccessfulCharge(order.getId(), transactionId, 
                        order.getTotalAmount(), "YOCO", cardLast4);
                } catch (Exception e) {
                    log.warn("Failed to log payment transaction: {}", e.getMessage());
                }

                // decrement reserved and actual stock
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

                log.info("Payment successful for order {}", order.getId());
                return ResponseEntity.ok(order);
            } else {
                // Log failed charge
                try {
                    JSONObject yocoResp = new JSONObject(resp.getBody());
                    String errorCode = yocoResp.optString("code", "UNKNOWN_ERROR");
                    String errorMsg = yocoResp.optString("message", resp.getBody());
                    paymentLoggingService.logFailedCharge(order.getId(), errorCode, 
                        order.getTotalAmount(), errorCode, errorMsg, "YOCO", null);
                } catch (Exception e) {
                    log.warn("Failed to log failed payment: {}", e.getMessage());
                }

                log.warn("Yoco charge failed (non-2xx) for order {}: {}", order.getId(), resp.getBody());
                // release reservation
                orderService.releaseReservation(order.getId());
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body("Payment provider error");
            }
        } catch (Exception e) {
            log.error("Charge failed for order {}: {}", order.getId(), e.getMessage(), e);
            // release reservation on error
            orderService.releaseReservation(order.getId());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body("Payment failed: " + e.getMessage());
        }
    }
}
