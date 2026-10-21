package com.greenpublic.ecommerce.service.orders.payments;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.greenpublic.ecommerce.entity.Order;
import com.greenpublic.ecommerce.entity.Product;
import com.greenpublic.ecommerce.repository.OrderRepository;
import com.greenpublic.ecommerce.repository.ProductRepository;
import com.greenpublic.ecommerce.service.orders.notification.OrderNotificationService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HandlePaymentService {

    private static final Logger log = LoggerFactory.getLogger(HandlePaymentService.class);

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderNotificationService orderNotificationService;
   

    @Transactional
    public void handlePaymentSuccess(Order order, BigDecimal amountPaid, boolean wasExpiredFlow, Map<Long, Product> productMap) {
        // Guard clause
        if (!wasExpiredFlow && order.getStatus() != Order.OrderStatus.PENDING) {
            log.warn("Ignoring payment webhook for order {} with status {}", order.getId(), order.getStatus());
            return;
        }

        // Adjust stock & reserved quantities
        adjustStock(order, productMap, wasExpiredFlow);

        // Update order status
        order.setStatus(Order.OrderStatus.PAID);
        order.setPaidAt(LocalDateTime.now());
        order.setReserved(false);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);

       orderNotificationService.sendPaymentSuccessEmail(order);

        log.info("Payment processed successfully for order {}, amount {}, expiredFlow={}",
                 order.getId(), amountPaid, wasExpiredFlow);
    }

    private void adjustStock(Order order, Map<Long, Product> productMap, boolean wasExpiredFlow) {
        order.getOrderItems().forEach(item -> {
            Product p = productMap.get(item.getProduct().getId());
            if (p == null) {
                throw new IllegalStateException("Product not found in productMap: " + item.getProduct().getId());
            }
            if (!wasExpiredFlow) {
                p.setReservedQuantity(Math.max(0, p.getReservedQuantity() - item.getQuantity()));
            }
            p.setStockQuantity(Math.max(0, p.getStockQuantity() - item.getQuantity()));
        });
        productRepository.saveAll(productMap.values());
    }

   
}

