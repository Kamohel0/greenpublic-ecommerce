package com.greenpublic.ecommerce.controller;

import com.greenpublic.ecommerce.dto.CheckoutRequest;
import com.greenpublic.ecommerce.dto.CheckoutResponse;
import com.greenpublic.ecommerce.dto.GuestCheckoutRequest;
import com.greenpublic.ecommerce.dto.OrderResponse;
import com.greenpublic.ecommerce.entity.Order;
import com.greenpublic.ecommerce.entity.OrderItem;
import com.greenpublic.ecommerce.entity.YocoCheckouts;

import com.greenpublic.ecommerce.repository.YocoCheckoutsRepository;
import com.greenpublic.ecommerce.service.orders.OrderService;

import org.json.JSONArray;
import org.json.JSONObject;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    private static final Logger log = LoggerFactory.getLogger(CheckoutController.class);

    private final OrderService orderService;
    private final YocoCheckoutsRepository yocoCheckoutsRepository;
    private final RestTemplate restTemplate;

    @Value("${yoco.api.secret-key}")
    private String secretKey;

    @Value("${app.public.base-url}")
    private String publicBaseUrl;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;
    

    public CheckoutController(OrderService orderService,
                              YocoCheckoutsRepository yocoCheckoutsRepository,
                              RestTemplate restTemplate) {
        this.orderService = orderService;
        this.yocoCheckoutsRepository = yocoCheckoutsRepository;
        this.restTemplate = restTemplate;
    }

   @PostMapping
   @Transactional
public ResponseEntity<CheckoutResponse> checkout(
        @AuthenticationPrincipal UserDetails userDetails,
        @RequestBody CheckoutRequest request) {

    OrderResponse orderResponse;
    try {
        orderResponse = orderService.createOrder(userDetails.getUsername(), request.getAddressId());
    } catch (RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new CheckoutResponse(
                        OrderResponse.builder().success(false).message(ex.getMessage()).build(),
                        null
                ));
    }

    if (!orderResponse.isSuccess()) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new CheckoutResponse(orderResponse, null));
    }

    Long orderId = orderResponse.getOrderId();
    Order order = orderService.getOrderById(orderId);

    if (!order.isReserved() || order.getReservationExpiresAt().isBefore(LocalDateTime.now())) {
        orderService.releaseReservation(order.getId());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new CheckoutResponse(orderResponse, null));
    }

    String deliveryMethod = request.getDeliveryMethod() != null ? request.getDeliveryMethod() : "delivery";
    order.setDeliveryMethod(deliveryMethod);
    BigDecimal deliveryFee = calculateDeliveryFee(deliveryMethod, order.getTotalAmount());
    order.setShippingCost(deliveryFee);

    return createYocoCheckout(order, orderResponse, userDetails.getUsername(), deliveryMethod, deliveryFee);
    }

    @PostMapping("/guest")
    @Transactional
    public ResponseEntity<CheckoutResponse> guestCheckout(@RequestBody GuestCheckoutRequest request) {
        OrderResponse orderResponse;
        try {
            orderResponse = orderService.createGuestOrder(request.getGuestEmail(), request.getAddress(), request.getItems());
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new CheckoutResponse(
                            OrderResponse.builder().success(false).message(ex.getMessage()).build(),
                            null
                    ));
        }

        if (!orderResponse.isSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new CheckoutResponse(orderResponse, null));
        }

        Long orderId = orderResponse.getOrderId();
        Order order = orderService.getOrderById(orderId);

        if (!order.isReserved() || order.getReservationExpiresAt().isBefore(LocalDateTime.now())) {
            orderService.releaseReservation(order.getId());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new CheckoutResponse(orderResponse, null));
        }

        String deliveryMethod = request.getDeliveryMethod() != null ? request.getDeliveryMethod() : "delivery";
        order.setDeliveryMethod(deliveryMethod);
        BigDecimal deliveryFee = calculateDeliveryFee(deliveryMethod, order.getTotalAmount());
        order.setShippingCost(deliveryFee);

        return createYocoCheckout(order, orderResponse, request.getGuestEmail(), deliveryMethod, deliveryFee);
    }

    private ResponseEntity<CheckoutResponse> createYocoCheckout(
            Order order,
            OrderResponse orderResponse,
            String customerEmail,
            String deliveryMethod,
            BigDecimal deliveryFee) {
        String url = "https://payments.yoco.com/api/checkouts";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + secretKey);

        BigDecimal totalWithDelivery = order.getTotalAmount().add(deliveryFee);
        Long amountInCents = totalWithDelivery.multiply(BigDecimal.valueOf(100)).longValue();

        JSONObject body = new JSONObject();
        body.put("amount", amountInCents);
        body.put("currency", "ZAR");
        body.put("successUrl", publicBaseUrl + "/payment/redirect?status=success&orderId=" + order.getId());
        body.put("cancelUrl", publicBaseUrl + "/payment/redirect?status=cancel&orderId=" + order.getId());
        body.put("failureUrl", publicBaseUrl + "/payment/redirect?status=failure&orderId=" + order.getId());

        JSONObject metadata = new JSONObject();
        metadata.put("order_id", order.getId());
        metadata.put("customer_email", customerEmail);
        body.put("metadata", metadata);

        JSONArray lineItems = new JSONArray();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (OrderItem item : order.getOrderItems()) {
            JSONObject lineItem = new JSONObject();
            lineItem.put("displayName", item.getProduct().getName());
            lineItem.put("quantity", item.getQuantity());

            JSONObject pricingDetails = new JSONObject();
            pricingDetails.put("price", item.getUnitPrice().multiply(BigDecimal.valueOf(100)).longValue());
            lineItem.put("pricingDetails", pricingDetails);

            lineItem.put("description", item.getProduct().getDescription());
            subtotal = subtotal.add(item.getPrice());
            lineItems.put(lineItem);
        }

        if (deliveryFee.compareTo(BigDecimal.ZERO) > 0) {
            JSONObject deliveryLineItem = new JSONObject();
            if ("pickup".equals(deliveryMethod)) {
                deliveryLineItem.put("displayName", "Pickup at FNB Bank City");
            } else {
                deliveryLineItem.put("displayName", "Delivery via The Courier Guy");
            }
            deliveryLineItem.put("quantity", 1);
            JSONObject deliveryPricing = new JSONObject();
            deliveryPricing.put("price", deliveryFee.multiply(BigDecimal.valueOf(100)).longValue());
            deliveryLineItem.put("pricingDetails", deliveryPricing);
            deliveryLineItem.put("description", "Shipping/Delivery Fee");
            lineItems.put(deliveryLineItem);
        }

        body.put("subtotalAmount", subtotal.multiply(BigDecimal.valueOf(100)).longValue());
        body.put("totalTaxAmount", 0);
        body.put("totalDiscount", 0);
        body.put("lineItems", lineItems);

        HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);

        try {
            log.info("Sending request to Yoco API for order {}: {}", order.getId(), body.toString());
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            log.info("Yoco API response status: {} for order {}", response.getStatusCode(), order.getId());
            log.info("Yoco API response body: {}", response.getBody());

            if (!response.getStatusCode().is2xxSuccessful()) {
                log.error("Yoco API returned non-2xx status for order {}: {} - Body: {}",
                        order.getId(), response.getStatusCode(), response.getBody());
                orderService.releaseReservation(order.getId());
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                        .body(new CheckoutResponse(
                                OrderResponse.builder()
                                        .success(false)
                                        .message("Yoco API error: " + response.getStatusCode())
                                        .build(),
                                null));
            }

            JSONObject responseJson = new JSONObject(response.getBody());
            String checkoutId = responseJson.getString("id");
            String checkoutUrl = responseJson.getString("redirectUrl");

            YocoCheckouts yocoCheckout = new YocoCheckouts();
            yocoCheckout.setYocoCheckoutId(checkoutId);
            yocoCheckout.setOrder(order);
            yocoCheckout.setYocoCheckoutUrl(checkoutUrl);
            yocoCheckout.setCreatedAt(LocalDateTime.now());
            yocoCheckoutsRepository.save(yocoCheckout);

            return ResponseEntity.ok(new CheckoutResponse(orderResponse, checkoutUrl));
        } catch (Exception e) {
            log.error("Yoco checkout creation failed for order {}: {}", order.getId(), e.getMessage(), e);

            orderService.releaseReservation(order.getId());

            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(new CheckoutResponse(
                            OrderResponse.builder()
                                    .success(false)
                                    .message("Checkout failed: " + e.getMessage())
                                    .build(),
                            null));
        }
    }

    private BigDecimal calculateDeliveryFee(String deliveryMethod, BigDecimal orderAmount) {
        // Pickup is always free
        if ("pickup".equals(deliveryMethod)) {
            return BigDecimal.ZERO;
        }

        // Delivery: Free over R500, R50 under R500
        if (orderAmount.compareTo(new BigDecimal("500.00")) >= 0) {
            return BigDecimal.ZERO;
        }

        return new BigDecimal("50.00"); // Default delivery fee under R500
    }
}
