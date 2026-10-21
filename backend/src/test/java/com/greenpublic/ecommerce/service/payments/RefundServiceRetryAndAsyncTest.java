package com.greenpublic.ecommerce.service.payments;

import com.greenpublic.ecommerce.entity.Cart;
import com.greenpublic.ecommerce.entity.Order;
import com.greenpublic.ecommerce.entity.Review;
import com.greenpublic.ecommerce.entity.User;
import com.greenpublic.ecommerce.exception.OrderNotFoundException;
import com.greenpublic.ecommerce.repository.AddressRepository;
import com.greenpublic.ecommerce.repository.CartRepository;
import com.greenpublic.ecommerce.repository.OrderRepository;
import com.greenpublic.ecommerce.repository.ReviewRepository;
import com.greenpublic.ecommerce.repository.UserRepository;
import com.greenpublic.ecommerce.service.notifications.NotificationService;
import com.greenpublic.ecommerce.service.orders.OrderService;
import com.greenpublic.ecommerce.service.orders.notification.RefundNotificationService;
import com.greenpublic.ecommerce.service.orders.payments.RefundService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.scheduling.annotation.EnableAsync;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@EnableAsync
@EnableRetry
class RefundServiceIntegrationTest {

    @Autowired
    private RefundService refundService;

    @Autowired
    private OrderRepository orderRepository;

    @MockitoSpyBean
    private OrderService orderService;

    @MockitoBean
    private NotificationService notificationService;

    @Autowired
    private RefundNotificationService refundNotificationService;

    private Order testOrder;

  @Autowired
private UserRepository userRepository; // Inject this repo

@Autowired
private AddressRepository addressRepository;

@Autowired
private ReviewRepository reviewRepository;

@Autowired
private CartRepository cartRepository;

@BeforeEach
void setUp() {
 
    User user = userRepository.findByEmail("refund-test@example.com")
            .orElseGet(() -> userRepository.save(User.builder()
                    .name("Refund")
                    .surname("Tester")
                    .email("refund-test@example.com")
                    .password("not-a-real-password")
                    .isActive(true)
                    .build()));

    testOrder = new Order();
    testOrder.setOrderNumber("ORD-" + System.nanoTime());
    testOrder.setStatus(Order.OrderStatus.PAID);
    testOrder.setTotalAmount(BigDecimal.valueOf(1000));
    testOrder.setUpdatedAt(LocalDateTime.now());
    testOrder.setReservationExpiresAt(LocalDateTime.now().plusMinutes(10));
    testOrder.setUser(user);  // set managed user
    orderRepository.save(testOrder);
}


    @Test
    void testHandleRefundSucceeded_FirstTime() throws Exception {
        refundService.handleRefundSucceeded(testOrder.getId(), "Customer Request");

        Order updated = orderRepository.findById(testOrder.getId()).orElseThrow();
        assertEquals(Order.OrderStatus.REFUNDED, updated.getStatus());

        // Wait for async notification
        Thread.sleep(500);

        verify(notificationService, times(1)).sendTemplate(
                eq(testOrder.getUser().getEmail()),
                eq("Your Refund has been Processed"),
                eq("email/refund-notification"),
                anyMap()
        );
    }

    @Test
    void testHandleRefundSucceeded_Idempotent() throws Exception {
        testOrder.setStatus(Order.OrderStatus.REFUNDED);
        orderRepository.save(testOrder);

        refundService.handleRefundSucceeded(testOrder.getId(), "Customer Request");

        Order updated = orderRepository.findById(testOrder.getId()).orElseThrow();
        assertEquals(Order.OrderStatus.REFUNDED, updated.getStatus());

        verify(notificationService, never()).sendTemplate(
                anyString(), anyString(), anyString(), anyMap()
        );
    }

    @Test
    void testHandleRefundSucceeded_OrderNotFound() {
        assertThrows(OrderNotFoundException.class, () ->
                refundService.handleRefundSucceeded(999L, "Customer Request")
        );
    }

    

 @Test
    void testRetryableLogic() throws Exception {
        // Stub the method to throw exceptions twice, then call real method
        doThrow(new RuntimeException("Temporary failure"))
            .doThrow(new RuntimeException("Temporary failure"))
            .doCallRealMethod()
            .when(orderService).createOrder(eq("customer@example.com"), eq(1L));

        refundService.handleRefundSucceeded(testOrder.getId(), "Retry Test");

        Order updated = orderRepository.findById(testOrder.getId()).orElseThrow();
        assertEquals(Order.OrderStatus.REFUNDED, updated.getStatus());
    }


@Test
void testSendRefundNotificationAsync_WithFormattedRefundAmount() throws Exception {
    // Arrange
    String reason = "Customer Request";

    // Compute the expected refund amount exactly as the service does
    Locale southAfrica = new Locale.Builder()
            .setLanguage("en")
            .setRegion("ZA")
            .build();
    NumberFormat currencyFormatter = NumberFormat.getCurrencyInstance(southAfrica);
    String expectedRefundAmount = currencyFormatter.format(testOrder.getTotalAmount());

    // Act: call the @Async method
    refundNotificationService.sendRefundNotificationAsync(testOrder, reason);

    // Wait a short time to allow async execution
    Thread.sleep(500); 

    // Assert
    verify(notificationService, times(1)).sendTemplate(
            eq(testOrder.getUser().getEmail()),
            eq("Your Refund has been Processed"),
            eq("email/refund-notification"),
            argThat(variables -> 
                variables.get("customerName").equals(testOrder.getUser().getName()) &&
                variables.get("orderId").equals(testOrder.getOrderNumber()) &&
                variables.get("refundReason").equals(reason) &&
                variables.get("refundAmount").equals(expectedRefundAmount) // exact formatted amount
            )
    );
}


}
