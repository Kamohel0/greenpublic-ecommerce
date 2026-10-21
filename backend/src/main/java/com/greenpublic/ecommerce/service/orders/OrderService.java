package com.greenpublic.ecommerce.service.orders;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.regex.Pattern;

import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.greenpublic.ecommerce.dto.OrderResponse;
import com.greenpublic.ecommerce.dto.AddressRequest;
import com.greenpublic.ecommerce.dto.GuestCheckoutItem;
import com.greenpublic.ecommerce.dto.order.OrderDTO;
import com.greenpublic.ecommerce.dto.order.OrderDTO.OrderItemDTO;
import com.greenpublic.ecommerce.entity.*;
import com.greenpublic.ecommerce.entity.enums.FulfillmentStatus;
import com.greenpublic.ecommerce.entity.enums.PaymentStatus;
import com.greenpublic.ecommerce.exception.*;
import com.greenpublic.ecommerce.repository.*;
import com.greenpublic.ecommerce.service.AddressService;

import lombok.RequiredArgsConstructor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;

import org.springframework.data.domain.Page;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;


@Service
@RequiredArgsConstructor
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);
    private static final Pattern EMAIL_REGEX = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final AddressService addressService;


    @Value("${reservation.expiryMinutes:15}") // default = 15
    private int reservationMinutes;
       

    /**
     * Creates an order from a user's cart.
     * Optimistic locking & retryable for high concurrency.
     */
@Transactional
    @Retryable(
        retryFor = {OptimisticLockingFailureException.class, ProductStockUnavailableException.class},
        maxAttempts = 3,
        backoff = @Backoff(delay = 100, multiplier = 2)
    )
    public OrderResponse createOrder(String userEmail, Long addressId) {

        // 1️⃣ Fetch user
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        // 2️⃣ Fetch shipping address
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        // 3️⃣ Fetch cart with items (batch fetch to avoid N+1)
        Cart cart = cartRepository.findByUserIdWithItems(user.getId())
                .orElseThrow(() -> new CartNotFoundException("Cart not found"));

        if (cart.getItems().isEmpty()) {
            throw new InvalidCartOperationException("Cart is empty");
        }

        // 4️⃣ Check stock and prepare products to update
        List<Map<String, Object>> unavailableProducts = new ArrayList<>();
        List<Product> productsToUpdate = new ArrayList<>();

        // Sort items by product ID to reduce deadlocks
        List<CartItem> sortedItems = new ArrayList<>(cart.getItems());
        sortedItems.sort(Comparator.comparing(ci -> ci.getProduct().getId()));

        for (CartItem cartItem : sortedItems) {
            Product product = productRepository.findById(cartItem.getProduct().getId())
                    .orElseThrow(() -> new ProductNotFoundException("Product not found"));

            int availableStock = product.getStockQuantity() - product.getReservedQuantity();
            if (availableStock < cartItem.getQuantity()) {
                Map<String, Object> itemInfo = new HashMap<>();
                itemInfo.put("productId", product.getId());
                itemInfo.put("productName", product.getName());
                itemInfo.put("availableStock", availableStock);
                unavailableProducts.add(itemInfo);
            } else {
                // Reserve stock optimistically
                product.setReservedQuantity(product.getReservedQuantity() + cartItem.getQuantity());
                productsToUpdate.add(product);
            }
        }

        if (!unavailableProducts.isEmpty()) {
            throw new ProductStockUnavailableException("Some items are unavailable", unavailableProducts);
        }

        // 5️⃣ Batch save reserved products
        productRepository.saveAll(productsToUpdate);

        // 6️⃣ Create order and order items
        Order order = new Order();
        order.setUser(user);
        order.setShippingAddress(address);
        order.setStatus(Order.OrderStatus.PENDING);
        order.setFulfillmentStatus(FulfillmentStatus.PLACED);
        order.setFulfillmentUpdatedAt(LocalDateTime.now());

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CartItem cartItem : sortedItems) {
            Product product = cartItem.getProduct();

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(cartItem.getQuantity());

            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            orderItem.setPrice(lineTotal);
            orderItem.setUnitPrice(product.getPrice());

            orderItems.add(orderItem);
            totalAmount = totalAmount.add(lineTotal);
        }

        order.setOrderItems(orderItems);
        order.setTotalAmount(totalAmount);
        order.setReservationExpiresAt(LocalDateTime.now().plusMinutes(reservationMinutes));
        order.setReserved(true);
        // 7️⃣ Save order with batch order items
        orderRepository.save(order);

        // 8️⃣ Clear cart
        cart.getItems().clear();
        cartRepository.save(cart);

        return OrderResponse.builder()
                .success(true)
                .message("Order created successfully")
                .orderId(order.getId())
                .build();
    }

    /**
     * Creates an order for guest checkout requests.
     */
    @Transactional
    @Retryable(
        retryFor = {OptimisticLockingFailureException.class, ProductStockUnavailableException.class},
        maxAttempts = 3,
        backoff = @Backoff(delay = 100, multiplier = 2)
    )
    public OrderResponse createGuestOrder(String guestEmail, AddressRequest addressRequest, List<GuestCheckoutItem> items) {
        if (guestEmail == null || guestEmail.isBlank()) {
            throw new RuntimeException("Guest email is required");
        }

        String normalizedEmail = guestEmail.trim().toLowerCase(Locale.ROOT);
        if (!EMAIL_REGEX.matcher(normalizedEmail).matches()) {
            throw new RuntimeException("Invalid guest email");
        }

        if (items == null || items.isEmpty()) {
            throw new InvalidCartOperationException("Cart is empty");
        }

        Address validatedAddress = addressService.buildValidatedAddress(addressRequest, null);
        Address savedAddress = addressRepository.save(validatedAddress);

        List<Map<String, Object>> unavailableProducts = new ArrayList<>();
        List<Product> productsToUpdate = new ArrayList<>();

        List<GuestCheckoutItem> sortedItems = new ArrayList<>(items);
        sortedItems.sort(Comparator.comparing(GuestCheckoutItem::getProductId));

        for (GuestCheckoutItem item : sortedItems) {
            if (item.getProductId() == null || item.getQuantity() == null || item.getQuantity() <= 0) {
                throw new InvalidCartOperationException("Invalid cart item");
            }

            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new ProductNotFoundException("Product not found"));

            int availableStock = product.getStockQuantity() - product.getReservedQuantity();
            if (availableStock < item.getQuantity()) {
                Map<String, Object> itemInfo = new HashMap<>();
                itemInfo.put("productId", product.getId());
                itemInfo.put("productName", product.getName());
                itemInfo.put("availableStock", availableStock);
                unavailableProducts.add(itemInfo);
            } else {
                product.setReservedQuantity(product.getReservedQuantity() + item.getQuantity());
                productsToUpdate.add(product);
            }
        }

        if (!unavailableProducts.isEmpty()) {
            throw new ProductStockUnavailableException("Some items are unavailable", unavailableProducts);
        }

        productRepository.saveAll(productsToUpdate);

        Order order = new Order();
        order.setUser(null);
        order.setGuestEmail(normalizedEmail);
        order.setShippingAddress(savedAddress);
        order.setStatus(Order.OrderStatus.PENDING);
        order.setFulfillmentStatus(FulfillmentStatus.PLACED);
        order.setFulfillmentUpdatedAt(LocalDateTime.now());

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (GuestCheckoutItem item : sortedItems) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new ProductNotFoundException("Product not found"));

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(item.getQuantity());

            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            orderItem.setPrice(lineTotal);
            orderItem.setUnitPrice(product.getPrice());

            orderItems.add(orderItem);
            totalAmount = totalAmount.add(lineTotal);
        }

        order.setOrderItems(orderItems);
        order.setTotalAmount(totalAmount);
        order.setReservationExpiresAt(LocalDateTime.now().plusMinutes(reservationMinutes));
        order.setReserved(true);

        orderRepository.save(order);

        return OrderResponse.builder()
                .success(true)
                .message("Order created successfully")
                .orderId(order.getId())
                .build();
    }

    // Recover method for unavailable stock (provides detailed reporting)
    @Recover
    public OrderResponse recoverFromProductStock(ProductStockUnavailableException ex, String userEmail, Long addressId) {
        return OrderResponse.builder()
                .success(false)
                .message(ex.getMessage())
                .unavailableProducts(ex.getUnavailableProducts())
                .build();
    }

    // Recover method for optimistic lock failures
    @Recover
    public OrderResponse recoverFromOptimisticLock(OptimisticLockingFailureException ex, String userEmail, Long addressId) {
        return OrderResponse.builder()
                .success(false)
                .message("High demand detected; please try again.")
                .build();
    }

    // Generic recover for unexpected exceptions
    @Recover
    public OrderResponse recoverFromAny(Throwable ex, String userEmail, Long addressId) {
        return OrderResponse.builder()
                .success(false)
                .message("An unexpected error occurred: " + ex.getMessage())
                .build();
    }


   /**
     * Release reserved stock — used by scheduler & failure paths.
     */
    @Transactional
    @Retryable(
            retryFor = OptimisticLockingFailureException.class,
            maxAttempts = 3,
            backoff = @Backoff(delay = 200)
    )
    public void releaseReservation(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!Order.OrderStatus.PENDING.equals(order.getStatus())) return;

        // Batch fetch all products
        Map<Long, Product> productMap = order.getOrderItems().stream()
                .map(OrderItem::getProduct)
                .map(Product::getId)
                .distinct()
                .collect(Collectors.toMap(id -> id,
                        id -> productRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Product not found"))));

        // Decrement reserved quantities
        order.getOrderItems().forEach(item -> {
            Product p = productMap.get(item.getProduct().getId());
            p.setReservedQuantity(Math.max(0, p.getReservedQuantity() - item.getQuantity()));
        });

        // Save all products in batch
        productRepository.saveAll(productMap.values());

        // Update order status
        order.setStatus(Order.OrderStatus.CANCELLED);
        order.setReserved(false);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);

        log.info("Reservation released for order {}", orderId);
    }

   
    /**
     * Recover method for retries
     */
    @Recover
    public void recoverFromOptimisticLock(OptimisticLockingFailureException ex, Long orderId) {
        log.error("Failed to process order {} after retries due to concurrency issues: {}", orderId, ex.getMessage());
        // Optional: trigger alert or compensating action
    }
   

    /**
     * Bulk, enum-safe, batch-updating reservation release.
     * - Single transaction per call
     * - Loads all needed graph in one go (orderItems + products)
     * - Applies product deltas then saves in batch
     */
    @Transactional
    @Retryable(
        retryFor = OptimisticLockingFailureException.class,
        maxAttempts = 3,
        backoff = @Backoff(delay = 200, multiplier = 2)
    )
    public void releaseReservationsBulk(List<Long> orderIds) {
        if (orderIds == null || orderIds.isEmpty()) return;

        final List<Order> orders = orderRepository.findAllByIdIn(orderIds);
        if (orders.isEmpty()) return;

        // Only operate on PENDING orders
       // Only operate on PENDING orders
       final List<Order> pending = orders.stream()
        .filter(o -> Order.OrderStatus.PENDING.equals(o.getStatus()))
        .toList();

       if (pending.isEmpty()) {
         return;
    }

        // Build product reserved-delta map
        final Map<Long, Integer> reservedDeltaByProductId = new HashMap<>();
        for (Order o : pending) {
            for (OrderItem item : o.getOrderItems()) {
                final Long pid = item.getProduct().getId();
                reservedDeltaByProductId.merge(pid, -item.getQuantity(), Integer::sum); // release = negative delta
            }
        }

        // Load fresh product entities (by ID) for concurrency correctness
        final List<Long> productIds = new ArrayList<>(reservedDeltaByProductId.keySet());
        final Map<Long, Product> products = productRepository.findAllById(productIds)
                .stream().collect(Collectors.toMap(Product::getId, p -> p));

        // Apply deltas safely (no negative reserved)
        for (Map.Entry<Long, Integer> e : reservedDeltaByProductId.entrySet()) {
            final Product p = products.get(e.getKey());
            if (p == null) continue; // should not happen unless data changed mid-flight
            final int newReserved = Math.max(0, p.getReservedQuantity() + e.getValue());
            p.setReservedQuantity(newReserved);
        }

        // Batch-save products
        productRepository.saveAll(products.values());

        // Update orders in batch
        final LocalDateTime now = LocalDateTime.now();
        pending.forEach(o -> {
            o.setStatus(Order.OrderStatus.CANCELLED);
            o.setReserved(false);
            o.setUpdatedAt(now);
        });
        orderRepository.saveAll(pending);

        log.info("Released reservations for {} orders (chunk).", pending.size());
    }

    @Recover
    public void recoverBulkRelease(OptimisticLockingFailureException ex, List<Long> orderIds) {
        log.error("Bulk release failed after retries for {} orders: {}", 
                  orderIds != null ? orderIds.size() : 0, ex.getMessage(), ex);
        // Optional: enqueue for manual review / DLQ
    }

      public Order getOrderById(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
    }

public Page<OrderDTO> getOrdersByUserEmail(String email, Integer page, Integer size) {
    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UserNotFoundException("User not found"));

    // If pagination params are null, return all orders
    if (page == null || size == null) {
        List<OrderDTO> allOrders = orderRepository.findByUserIdAndStatusNotOrderByCreatedAtDesc(user.getId(), Order.OrderStatus.CANCELLED)
                .stream()
                .map(this::mapToDTO)
                .toList();
        return new PageImpl<>(allOrders);
    }

   // Pageable with sorting by createdAt descending
    Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    Page<Order> ordersPage = orderRepository.findByUserIdAndStatusNot(user.getId(), Order.OrderStatus.CANCELLED, pageable);
    return ordersPage.map(this::mapToDTO);
}

public OrderDTO getOrderById(Long orderId, String email) {
    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UserNotFoundException("User not found"));

    Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException(orderId));

    // Ensure the order belongs to the logged-in user
    if (!order.getUser().getId().equals(user.getId())) {
        throw new UserNotFoundException("You are not allowed to access this order");
    }

    return mapToDTO(order);
}


// === Mapper method ===
private OrderDTO mapToDTO(Order order) {
    List<OrderItemDTO> items = order.getOrderItems() != null
            ? order.getOrderItems().stream()
                .map(this::mapToOrderItemDTO)
                .toList()
            : Collections.emptyList();

    // sum quantities
    int totalItems = items.stream()
            .mapToInt(OrderDTO.OrderItemDTO::getQuantity)
            .sum();

    return OrderDTO.builder()
            .orderId(order.getId())
            .orderNumber(order.getOrderNumber())
            .totalAmount(order.getTotalAmount())
            .status(order.getStatus().name())
            .paymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus().name() : PaymentStatus.PENDING.name())
            .deliveryMethod(order.getDeliveryMethod())
            .shippingCost(order.getShippingCost())
            .fulfillmentStatus(order.getFulfillmentStatus() != null ? order.getFulfillmentStatus().name() : FulfillmentStatus.PLACED.name())
            .fulfillmentUpdatedAt(order.getFulfillmentUpdatedAt())
            .pickupReadyNotifiedAt(order.getPickupReadyNotifiedAt())
            .createdAt(order.getCreatedAt())
            .updatedAt(order.getUpdatedAt())
            .paidAt(order.getPaidAt())
            .yocoCheckoutUrl(checkoutUrl(order))
            .shippingAddress(order.getShippingAddress() != null
                    ? mapToAddressDTO(order.getShippingAddress())
                    : null)
            .orderItems(items)
            .totalItems(totalItems) // ✅ added here
            .build();
}


private String checkoutUrl(Order order) {
    if (order.getStatus() == Order.OrderStatus.PENDING && order.getYocoCheckout() != null) {
        return order.getYocoCheckout().getYocoCheckoutUrl();
    }
    return null;
}

// === Address mapping ===
private OrderDTO.AddressDTO mapToAddressDTO(Address address) {
    return OrderDTO.AddressDTO.builder()
            .addressId(address.getId())
            .name(address.getName())
            .surname(address.getSurname())
            .companyName(address.getCompanyName())
            .addressLine1(address.getAddressLine1())
            .addressLine2(address.getAddressLine2())
            .city(address.getCity())
            .province(address.getProvince())
            .postalCode(address.getPostalCode())
            .country(address.getCountry())
            .phoneNo(address.getPhoneNo())
            .build();
}

// === OrderItem mapping ===
private OrderDTO.OrderItemDTO mapToOrderItemDTO(OrderItem item) {
    BigDecimal subtotal = item.getProduct().getPrice()
            .multiply(BigDecimal.valueOf(item.getQuantity()));

    return OrderDTO.OrderItemDTO.builder()
            .productId(item.getProduct().getId())
            .productName(item.getProduct().getName())
            .quantity(item.getQuantity())
            .price(item.getProduct().getPrice())
            .subtotal(subtotal)
            .build();
}

    
}
