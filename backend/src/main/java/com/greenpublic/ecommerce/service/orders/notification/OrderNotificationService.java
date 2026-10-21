package com.greenpublic.ecommerce.service.orders.notification;

import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
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
public class OrderNotificationService {

    private final NotificationService notificationService;

     @Async
    public void sendPaymentSuccessEmail(Order order) {

        // Locale for South Africa
    Locale southAfrica = new Locale.Builder()
            .setLanguage("en")
            .setRegion("ZA")
            .build();

     // Format date
    DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMMM yyyy, hh:mm a", southAfrica);
    String formattedDate = order.getCreatedAt().format(dateFormatter);

    NumberFormat currencyFormatter = NumberFormat.getCurrencyInstance(southAfrica);
    String totalAmount = currencyFormatter.format(order.getTotalAmount());  
       // Prepare variables for the Thymeleaf template
        Map<String, Object> templateVariables = Map.of(
            "customerName", order.getUser().getName(),
            "orderItems", order.getOrderItems().stream().map(i -> Map.of(
                "name", i.getProduct().getName(),
                "quantity", i.getQuantity(),
                "price", currencyFormatter.format(i.getProduct().getPrice())
            )).toList(),
            "totalAmount", totalAmount,
            "orderId", order.getId(),
            "orderDate", formattedDate
        );

        // Send HTML template email via NotificationService
        notificationService.sendTemplate(
            order.getUser().getEmail(),
            "Your Order Confirmation - " + order.getOrderNumber(),
            "email/order-confirmation", // path under src/main/resources/templates
            templateVariables
        );
    }
    
}
