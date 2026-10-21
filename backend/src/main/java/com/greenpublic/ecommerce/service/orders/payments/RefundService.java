package com.greenpublic.ecommerce.service.orders.payments;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;


import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.greenpublic.ecommerce.entity.Order;
import com.greenpublic.ecommerce.exception.OrderNotFoundException;
import com.greenpublic.ecommerce.repository.OrderRepository;
import com.greenpublic.ecommerce.service.orders.notification.RefundNotificationService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RefundService {
    private static final Logger log = LoggerFactory.getLogger(RefundService.class);

    private final OrderRepository orderRepository;
    private final RefundNotificationService refundNotificationService;
    

    @Value("${yoco.api.secret-key}")
    private String secretKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @Transactional
    public void triggerRefund(Order order, BigDecimal amount, String reason) {
        if (order.getYocoCheckout().getYocoCheckoutId() == null || order.getYocoCheckout().getYocoCheckoutId().isBlank()) {
            log.warn("Missing Yoco checkout ID for order {} — cannot proceed with refund", order.getId());
            return;
        }

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            log.warn("Invalid refund amount {} for order {}", amount, order.getId());
            return;
        }

        try {
           
            String idempotencyKey = "refund-" + order.getId() + "-" + amount.longValue()  + "-" + reason.hashCode();

            String url = "https://payments.yoco.com/api/checkouts/" + order.getYocoCheckout().getYocoCheckoutId() + "/refund";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + secretKey);
            headers.set("Idempotency-Key", idempotencyKey);

            JSONObject body = new JSONObject();
            body.put("amount", amount.longValue());
            JSONObject metadata = new JSONObject();
            metadata.put("orderId", order.getId());
            metadata.put("checkoutId", order.getYocoCheckout().getYocoCheckoutId());
            metadata.put("reason", reason);
            body.put("metadata", metadata);

            ResponseEntity<String> response = restTemplate.postForEntity(url, new HttpEntity<>(body.toString(), headers), String.class);

            log.info("Yoco refund API response for order {}: HTTP status = {}, body = {}",
                    order.getId(),response.getStatusCode().value(), response.getBody());

        } catch (ArithmeticException e) {
            log.error("Error converting refund amount to cents for order {}: {}", order.getId(), e.getMessage(), e);
        } catch (Exception e) {
            log.error("Exception during refund for order {}: {}", order.getId(), e.getMessage(), e);
        }
    }

   
    public void handleRefundSucceeded(Long orderId, String reason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        // Idempotency check
        if (order.getStatus() == Order.OrderStatus.REFUNDED) {
            log.info("Order {} already refunded, skipping", order.getOrderNumber());
            return;
        }

        order.setStatus(Order.OrderStatus.REFUNDED);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);

        refundNotificationService.sendRefundNotificationAsync(order,reason);
    }



public void handleRefundFailed(Long orderId, String reason) {
    Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException(orderId));

    // Idempotency check
    if (order.getStatus() == Order.OrderStatus.REFUND_FAILED) {
        log.info("Order {} refund already marked as failed, skipping", order.getOrderNumber());
        return;
    }

    order.setStatus(Order.OrderStatus.REFUND_FAILED);
    order.setUpdatedAt(LocalDateTime.now());
    orderRepository.save(order);

    log.warn("Refund failed for order {}. Reason: {}", order.getOrderNumber(), reason);

    // Optionally send notification about the failed refund
    refundNotificationService.sendRefundFailureNotificationAsync(order, reason);
    refundNotificationService.sendRefundFailureNotificationToAdmin(order, reason);
}


   
}
