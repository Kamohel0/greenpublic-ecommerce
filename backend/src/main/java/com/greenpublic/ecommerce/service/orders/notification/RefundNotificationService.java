package com.greenpublic.ecommerce.service.orders.notification;

import java.text.NumberFormat;
import java.util.Locale;
import java.util.Map;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.greenpublic.ecommerce.entity.Order;
import com.greenpublic.ecommerce.service.notifications.NotificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefundNotificationService {

    private final NotificationService notificationService;

    private static final String UNKNOWN = "Unknown";
   private static final String CUSTOMERNAME = "customerName";
    private static final String ORDERID = "orderId";
    private static final String REFUNDAMOUNT = "refundAmount";
    @Async
    public void sendRefundNotificationAsync(Order order, String reason) {
        
       // Option 1: Using Locale.Builder (future-proof, avoids deprecated constructor)
        Locale southAfrica = new Locale.Builder()
        .setLanguage("en")
        .setRegion("ZA")
        .build();

        NumberFormat currencyFormatter = NumberFormat.getCurrencyInstance(southAfrica);

        String refundAmount = currencyFormatter.format(order.getTotalAmount());

        
    Map<String, Object> variables = Map.of(
            CUSTOMERNAME, order.getUser().getName() != null ? order.getUser().getName() : UNKNOWN,
            ORDERID, order.getOrderNumber() != null ? order.getOrderNumber() : UNKNOWN,
            REFUNDAMOUNT, refundAmount,
            "refundReason", reason != null ? reason : "hfvbhfd"
    );

        notificationService.sendTemplate(
                order.getUser().getEmail(),
                "Your Refund has been Processed",
                "email/refund-notification",
                variables
        );

        log.info("Refund email sent successfully for order {}", order.getOrderNumber());
    }

    @Async
public void sendRefundFailureNotificationAsync(Order order, String failureReason) {

    // Locale for South Africa
    Locale southAfrica = new Locale.Builder()
            .setLanguage("en")
            .setRegion("ZA")
            .build();

    NumberFormat currencyFormatter = NumberFormat.getCurrencyInstance(southAfrica);

    String refundAmount = currencyFormatter.format(order.getTotalAmount());

    Map<String, Object> variables = Map.of(
            CUSTOMERNAME, order.getUser().getName() != null ? order.getUser().getName() : UNKNOWN,
            ORDERID, order.getOrderNumber() != null ? order.getOrderNumber() : UNKNOWN,
            REFUNDAMOUNT, refundAmount,
            "failureReason", failureReason != null ? failureReason : "Unknown reason"
    );

    notificationService.sendTemplate(
            order.getUser().getEmail(),
            "Refund Failed for Your Order",
            "email/refund-failure",
            variables
    );

    log.warn("Refund failure email sent for order {}. Reason: {}", order.getOrderNumber(), failureReason);
}

@Async
public void sendRefundFailureNotificationToAdmin(Order order, String failureReason) {

    // Locale for South Africa
    Locale southAfrica = new Locale.Builder()
            .setLanguage("en")
            .setRegion("ZA")
            .build();

    NumberFormat currencyFormatter = NumberFormat.getCurrencyInstance(southAfrica);
    String refundAmount = currencyFormatter.format(order.getTotalAmount());

    Map<String, Object> variables = Map.of(
            CUSTOMERNAME, order.getUser().getName() != null ? order.getUser().getName() : UNKNOWN,
            ORDERID, order.getOrderNumber() != null ? order.getOrderNumber() : UNKNOWN,
            REFUNDAMOUNT, refundAmount,
            "failureReason", failureReason != null ? failureReason : "Unknown reason"
    );

    // Replace with your admin email
    String adminEmail = "admin@yourdomain.com";

    notificationService.sendTemplate(
            adminEmail,
            "Refund Failure Alert for Order " + (order.getOrderNumber() != null ? order.getOrderNumber() : UNKNOWN),
            "email/admin-refund-failure",
            variables
    );

    log.warn("Admin notified of refund failure for order {}. Reason: {}", order.getOrderNumber(), failureReason);
}


    
}
