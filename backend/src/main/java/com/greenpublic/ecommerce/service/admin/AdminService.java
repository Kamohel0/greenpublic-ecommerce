package com.greenpublic.ecommerce.service.admin;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.greenpublic.ecommerce.dto.admin.AdminOrderDTO;
import com.greenpublic.ecommerce.dto.admin.AdminStatsDTO;
import com.greenpublic.ecommerce.dto.admin.InventoryItemDTO;
import com.greenpublic.ecommerce.dto.admin.OrderStatusUpdateRequest;
import com.greenpublic.ecommerce.entity.Address;
import com.greenpublic.ecommerce.entity.Order;
import com.greenpublic.ecommerce.entity.OrderItem;
import com.greenpublic.ecommerce.entity.Product;
import com.greenpublic.ecommerce.entity.User;
import com.greenpublic.ecommerce.entity.enums.FulfillmentStatus;
import com.greenpublic.ecommerce.entity.enums.PaymentStatus;
import com.greenpublic.ecommerce.entity.enums.ShippingStatus;
import com.greenpublic.ecommerce.repository.OrderRepository;
import com.greenpublic.ecommerce.repository.ProductRepository;
import com.greenpublic.ecommerce.repository.UserRepository;
import com.greenpublic.ecommerce.service.notifications.NotificationService;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for admin operations
 */
@Service
@RequiredArgsConstructor
public class AdminService {

    private static final int LOW_STOCK_THRESHOLD = 10;

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final NotificationService notificationService;

    /**
     * Get dashboard statistics
     */
    public AdminStatsDTO getDashboardStats() {
        List<Order> allOrders = orderRepository.findAll();
        
        // Order status counts
        long totalOrders = allOrders.size();
        long pendingOrders = allOrders.stream()
            .filter(o -> o.getStatus() == Order.OrderStatus.PENDING).count();
        long completedOrders = allOrders.stream()
            .filter(o -> o.getStatus() == Order.OrderStatus.COMPLETED).count();
        long cancelledOrders = allOrders.stream()
            .filter(o -> o.getStatus() == Order.OrderStatus.CANCELLED).count();
        
        // Payment status counts
        long paidOrders = allOrders.stream()
            .filter(o -> o.getPaymentStatus() == PaymentStatus.COMPLETED).count();
        long unpaidOrders = allOrders.stream()
            .filter(o -> o.getPaymentStatus() == PaymentStatus.PENDING).count();
        
        // Shipping status counts
        long ordersToShip = allOrders.stream()
            .filter(o -> o.getShippingStatus() == ShippingStatus.NOT_SHIPPED).count();
        long ordersShipped = allOrders.stream()
            .filter(o -> o.getShippingStatus() == ShippingStatus.SHIPPED).count();
        long ordersDelivered = allOrders.stream()
            .filter(o -> o.getShippingStatus() == ShippingStatus.DELIVERED).count();
        
        // Delivery method counts
        long deliveryOrders = allOrders.stream()
            .filter(o -> "delivery".equalsIgnoreCase(o.getDeliveryMethod())).count();
        long pickupOrders = allOrders.stream()
            .filter(o -> "pickup".equalsIgnoreCase(o.getDeliveryMethod())).count();
        
        // Revenue calculations
        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime monthStart = LocalDateTime.of(LocalDate.now().withDayOfMonth(1), LocalTime.MIN);
        LocalDateTime yesterdayStart = todayStart.minusDays(1);
        LocalDateTime lastMonthStart = monthStart.minusMonths(1);

        BigDecimal totalRevenue = allOrders.stream()
            .filter(o -> o.getStatus() == Order.OrderStatus.COMPLETED || o.getStatus() == Order.OrderStatus.PAID)
            .map(this::calculateOrderRevenue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal todayRevenue = allOrders.stream()
            .filter(o -> o.getPaidAt() != null && o.getPaidAt().isAfter(todayStart))
            .map(this::calculateOrderRevenue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal yesterdayRevenue = allOrders.stream()
            .filter(o -> o.getPaidAt() != null && !o.getPaidAt().isBefore(yesterdayStart) && o.getPaidAt().isBefore(todayStart))
            .map(this::calculateOrderRevenue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal monthRevenue = allOrders.stream()
            .filter(o -> o.getPaidAt() != null && o.getPaidAt().isAfter(monthStart))
            .map(this::calculateOrderRevenue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal lastMonthRevenue = allOrders.stream()
            .filter(o -> o.getPaidAt() != null && !o.getPaidAt().isBefore(lastMonthStart) && o.getPaidAt().isBefore(monthStart))
            .map(this::calculateOrderRevenue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        long todayOrders = allOrders.stream()
            .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().isAfter(todayStart))
            .count();

        long paidOrCompletedOrders = allOrders.stream()
            .filter(o -> o.getStatus() == Order.OrderStatus.COMPLETED || o.getStatus() == Order.OrderStatus.PAID)
            .count();

        BigDecimal averageOrderValue = paidOrCompletedOrders > 0
            ? totalRevenue.divide(BigDecimal.valueOf(paidOrCompletedOrders), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        long paymentFailedOrders = allOrders.stream()
            .filter(o -> o.getPaymentStatus() == PaymentStatus.FAILED)
            .count();

        long refundedPaymentOrders = allOrders.stream()
            .filter(o -> o.getPaymentStatus() == PaymentStatus.REFUNDED || o.getPaymentStatus() == PaymentStatus.PARTIALLY_REFUNDED)
            .count();

        long pendingPaymentOrders = allOrders.stream()
            .filter(o -> o.getPaymentStatus() == PaymentStatus.PENDING)
            .count();

        long packagingBacklog = allOrders.stream()
            .filter(o -> o.getFulfillmentStatus() == FulfillmentStatus.PLACED || o.getFulfillmentStatus() == FulfillmentStatus.PACKAGING)
            .count();

        long readyForDispatch = allOrders.stream()
            .filter(o -> o.getFulfillmentStatus() == FulfillmentStatus.READY_FOR_HANDOFF || o.getFulfillmentStatus() == FulfillmentStatus.READY_FOR_PICKUP)
            .count();

        BigDecimal refundedRevenue = allOrders.stream()
            .filter(o -> o.getPaymentStatus() == PaymentStatus.REFUNDED || o.getPaymentStatus() == PaymentStatus.PARTIALLY_REFUNDED)
            .map(this::calculateOrderRevenue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netRevenue = totalRevenue.subtract(refundedRevenue);

        double refundRatePercent = paidOrCompletedOrders > 0
            ? ((double) refundedPaymentOrders / paidOrCompletedOrders) * 100.0
            : 0.0;

        double revenueVsYesterdayPercent = percentageChange(todayRevenue, yesterdayRevenue);
        double revenueVsLastMonthPercent = percentageChange(monthRevenue, lastMonthRevenue);

        Map<Long, Long> ordersByUser = allOrders.stream()
            .filter(o -> o.getUser() != null)
            .collect(Collectors.groupingBy(o -> o.getUser().getId(), Collectors.counting()));

        Map<Long, LocalDateTime> firstOrderByUser = allOrders.stream()
            .filter(o -> o.getUser() != null)
            .collect(Collectors.toMap(
                o -> o.getUser().getId(),
                Order::getCreatedAt,
                (existing, replacement) -> existing.isBefore(replacement) ? existing : replacement
            ));

        long newCustomersThisMonth = firstOrderByUser.values().stream()
            .filter(firstOrderDate -> firstOrderDate != null && !firstOrderDate.isBefore(monthStart))
            .count();

        long returningCustomersThisMonth = allOrders.stream()
            .filter(o -> o.getUser() != null && o.getCreatedAt() != null && !o.getCreatedAt().isBefore(monthStart))
            .map(o -> o.getUser().getId())
            .distinct()
            .filter(userId -> ordersByUser.getOrDefault(userId, 0L) > 1)
            .count();

        long customersWithOrders = ordersByUser.size();
        double repeatPurchaseRatePercent = customersWithOrders > 0
            ? ((double) ordersByUser.values().stream().filter(count -> count > 1).count() / customersWithOrders) * 100.0
            : 0.0;
        
        // Customer counts
        long totalCustomers = userRepository.count();
        long activeCustomers = userRepository.findAll().stream()
            .filter(User::isActive).count();
        
        return AdminStatsDTO.builder()
            .totalOrders(totalOrders)
            .pendingOrders(pendingOrders)
            .completedOrders(completedOrders)
            .cancelledOrders(cancelledOrders)
            .paidOrders(paidOrders)
            .unpaidOrders(unpaidOrders)
            .ordersToShip(ordersToShip)
            .ordersShipped(ordersShipped)
            .ordersDelivered(ordersDelivered)
            .deliveryOrders(deliveryOrders)
            .pickupOrders(pickupOrders)
            .totalRevenue(totalRevenue)
            .todayRevenue(todayRevenue)
            .monthRevenue(monthRevenue)
            .yesterdayRevenue(yesterdayRevenue)
            .lastMonthRevenue(lastMonthRevenue)
            .netRevenue(netRevenue)
            .averageOrderValue(averageOrderValue)
            .revenueVsYesterdayPercent(revenueVsYesterdayPercent)
            .revenueVsLastMonthPercent(revenueVsLastMonthPercent)
            .refundRatePercent(refundRatePercent)
            .repeatPurchaseRatePercent(repeatPurchaseRatePercent)
            .todayOrders(todayOrders)
            .paymentFailedOrders(paymentFailedOrders)
            .refundedPaymentOrders(refundedPaymentOrders)
            .pendingPaymentOrders(pendingPaymentOrders)
            .packagingBacklog(packagingBacklog)
            .readyForDispatch(readyForDispatch)
            .newCustomersThisMonth(newCustomersThisMonth)
            .returningCustomersThisMonth(returningCustomersThisMonth)
            .totalCustomers(totalCustomers)
            .activeCustomers(activeCustomers)
            .build();
    }

    /**
     * Get all orders with filtering and pagination
     */
    public Page<AdminOrderDTO> getAllOrders(
            String status, String paymentStatus, String shippingStatus,
            String fulfillmentStatus,
            String deliveryMethod, String search, int page, int size, 
            String sortBy, String sortDirection) {
        
        Sort.Direction direction = "ASC".equalsIgnoreCase(sortDirection) 
            ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        Specification<Order> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            if (status != null && !status.isEmpty()) {
                predicates.add(cb.equal(root.get("status"), Order.OrderStatus.valueOf(status.toUpperCase())));
            }
            
            if (paymentStatus != null && !paymentStatus.isEmpty()) {
                predicates.add(cb.equal(root.get("paymentStatus"), PaymentStatus.valueOf(paymentStatus.toUpperCase())));
            }
            
            if (shippingStatus != null && !shippingStatus.isEmpty()) {
                predicates.add(cb.equal(root.get("shippingStatus"), ShippingStatus.valueOf(shippingStatus.toUpperCase())));
            }

            if (fulfillmentStatus != null && !fulfillmentStatus.isEmpty()) {
                predicates.add(cb.equal(root.get("fulfillmentStatus"), FulfillmentStatus.valueOf(fulfillmentStatus.toUpperCase())));
            }
            
            if (deliveryMethod != null && !deliveryMethod.isEmpty()) {
                predicates.add(cb.equal(root.get("deliveryMethod"), deliveryMethod));
            }
            
            if (search != null && !search.isEmpty()) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                Predicate orderNumberPredicate = cb.like(cb.lower(root.get("orderNumber")), searchPattern);
                Predicate userEmailPredicate = cb.like(cb.lower(root.get("user").get("email")), searchPattern);
                predicates.add(cb.or(orderNumberPredicate, userEmailPredicate));
            }
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        
        Page<Order> ordersPage = orderRepository.findAll(spec, pageable);
        return ordersPage.map(this::mapToAdminOrderDTO);
    }

    /**
     * Get order by ID
     */
    public AdminOrderDTO getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
        return mapToAdminOrderDTO(order);
    }

    /**
     * Update order status
     */
    @Transactional
    public AdminOrderDTO updateOrderStatus(Long orderId, OrderStatusUpdateRequest request) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
        
        if (request.getOrderStatus() != null) {
            order.setStatus(Order.OrderStatus.valueOf(request.getOrderStatus().toUpperCase()));
        }
        
        if (request.getPaymentStatus() != null) {
            order.setPaymentStatus(PaymentStatus.valueOf(request.getPaymentStatus().toUpperCase()));
        }
        
        if (request.getShippingStatus() != null) {
            order.setShippingStatus(ShippingStatus.valueOf(request.getShippingStatus().toUpperCase()));
        }

        if (request.getFulfillmentStatus() != null) {
            FulfillmentStatus next = FulfillmentStatus.valueOf(request.getFulfillmentStatus().toUpperCase());
            applyFulfillmentStatus(order, next);
        }
        
        if (request.getTrackingNumber() != null) {
            order.setTrackingNumber(request.getTrackingNumber());
        }
        
        if (request.getInternalNotes() != null) {
            order.setInternalNotes(request.getInternalNotes());
        }
        
        order.setLastModifiedAt(LocalDateTime.now());
        Order savedOrder = orderRepository.save(order);
        
        return mapToAdminOrderDTO(savedOrder);
    }

    /**
     * Update shipping info
     */
    @Transactional
    public AdminOrderDTO updateShippingInfo(Long orderId, String shippingStatus, String trackingNumber) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
        
        order.setShippingStatus(ShippingStatus.valueOf(shippingStatus.toUpperCase()));
        
        if (trackingNumber != null && !trackingNumber.isEmpty()) {
            order.setTrackingNumber(trackingNumber);
        }
        
        order.setLastModifiedAt(LocalDateTime.now());
        Order savedOrder = orderRepository.save(order);
        
        return mapToAdminOrderDTO(savedOrder);
    }

    @Transactional
    public AdminOrderDTO markReadyForPickup(Long orderId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        if (!"pickup".equalsIgnoreCase(order.getDeliveryMethod())) {
            throw new RuntimeException("Ready for pickup is only valid for pickup orders");
        }

        applyFulfillmentStatus(order, FulfillmentStatus.READY_FOR_PICKUP);
        order.setLastModifiedAt(LocalDateTime.now());
        Order savedOrder = orderRepository.save(order);

        return mapToAdminOrderDTO(savedOrder);
    }

    /**
     * Add internal notes
     */
    @Transactional
    public AdminOrderDTO addInternalNotes(Long orderId, String notes) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
        
        order.setInternalNotes(notes);
        order.setLastModifiedAt(LocalDateTime.now());
        Order savedOrder = orderRepository.save(order);
        
        return mapToAdminOrderDTO(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<InventoryItemDTO> getInventoryOverview(boolean lowStockOnly) {
        List<Product> products = lowStockOnly
                ? productRepository.findLowStockProducts(LOW_STOCK_THRESHOLD)
                : productRepository.findByIsActive(true);

        return products.stream()
                .map(this::mapToInventoryItem)
                .sorted((a, b) -> Integer.compare(a.getAvailableStock(), b.getAvailableStock()))
                .toList();
    }

    @Transactional
    public InventoryItemDTO updateInventoryQuantity(Long productId, Integer stockQuantity) {
        if (stockQuantity == null || stockQuantity < 0) {
            throw new RuntimeException("Stock quantity must be zero or positive");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        if (stockQuantity < product.getReservedQuantity()) {
            throw new RuntimeException("Stock cannot be less than reserved quantity (" + product.getReservedQuantity() + ")");
        }

        product.setStockQuantity(stockQuantity);
        Product saved = productRepository.save(product);
        return mapToInventoryItem(saved);
    }

    /**
     * Map Order entity to AdminOrderDTO
     */
    private AdminOrderDTO mapToAdminOrderDTO(Order order) {
        User user = order.getUser();
        Address address = order.getShippingAddress();
        
        AdminOrderDTO.CustomerDTO customerDTO = null;
        if (user != null) {
            customerDTO = AdminOrderDTO.CustomerDTO.builder()
                .userId(user.getId())
                .name(user.getName())
                .surname(user.getSurname())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .build();
        }
        
        AdminOrderDTO.AddressDTO addressDTO = null;
        if (address != null) {
            addressDTO = AdminOrderDTO.AddressDTO.builder()
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
        
        List<AdminOrderDTO.OrderItemDTO> itemDTOs = order.getOrderItems() != null 
            ? order.getOrderItems().stream()
                .map(this::mapToOrderItemDTO)
                .collect(Collectors.toList())
            : new ArrayList<>();
        
        return AdminOrderDTO.builder()
            .id(order.getId())
            .orderNumber(order.getOrderNumber())
            .guestEmail(order.getGuestEmail())
            .totalAmount(order.getTotalAmount())
            .status(order.getStatus().name())
            .paymentStatus(order.getPaymentStatus())
            .shippingStatus(order.getShippingStatus())
            .fulfillmentStatus(order.getFulfillmentStatus())
            .paymentMethod(order.getPaymentMethod())
            .trackingNumber(order.getTrackingNumber())
            .deliveryMethod(order.getDeliveryMethod())
            .customerNotes(order.getCustomerNotes())
            .internalNotes(order.getInternalNotes())
            .createdAt(order.getCreatedAt())
            .updatedAt(order.getUpdatedAt())
            .paidAt(order.getPaidAt())
            .lastModifiedAt(order.getLastModifiedAt())
            .fulfillmentUpdatedAt(order.getFulfillmentUpdatedAt())
            .pickupReadyNotifiedAt(order.getPickupReadyNotifiedAt())
            .shippingCost(order.getShippingCost())
            .taxAmount(order.getTaxAmount())
            .discountAmount(order.getDiscountAmount())
            .subTotal(order.getSubTotal())
            .customer(customerDTO)
            .shippingAddress(addressDTO)
            .items(itemDTOs)
            .build();
    }

    /**
     * Map OrderItem to OrderItemDTO
     */
    private AdminOrderDTO.OrderItemDTO mapToOrderItemDTO(OrderItem item) {
        BigDecimal totalPrice = item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
        int availableStock = item.getProduct().getAvailableStock();
        
        return AdminOrderDTO.OrderItemDTO.builder()
            .id(item.getId())
            .productId(item.getProduct().getId())
            .productName(item.getProduct().getName())
            .quantity(item.getQuantity())
            .price(item.getPrice())
            .total(totalPrice)
            .remainingStock(availableStock)
            .lowStock(availableStock < LOW_STOCK_THRESHOLD)
            .build();
    }

    private InventoryItemDTO mapToInventoryItem(Product product) {
        int availableStock = product.getAvailableStock();
        return InventoryItemDTO.builder()
                .productId(product.getId())
                .productName(product.getName())
                .category(product.getCategory() != null ? product.getCategory().getName() : null)
                .price(product.getPrice())
                .stockQuantity(product.getStockQuantity())
                .reservedQuantity(product.getReservedQuantity())
                .availableStock(availableStock)
                .lowStock(availableStock < LOW_STOCK_THRESHOLD)
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    private BigDecimal calculateOrderRevenue(Order order) {
        BigDecimal orderTotal = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;

        BigDecimal shippingCost = order.getShippingCost();
        if (shippingCost == null) {
            shippingCost = BigDecimal.ZERO;
        }

        if (shippingCost.compareTo(BigDecimal.ZERO) == 0 && "delivery".equalsIgnoreCase(order.getDeliveryMethod())) {
            if (orderTotal.compareTo(new BigDecimal("500.00")) < 0) {
                shippingCost = new BigDecimal("50.00");
            }
        }

        return orderTotal.add(shippingCost);
    }

    private double percentageChange(BigDecimal current, BigDecimal baseline) {
        if (baseline == null || baseline.compareTo(BigDecimal.ZERO) == 0) {
            return current != null && current.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
        }

        BigDecimal diff = current.subtract(baseline);
        return diff
            .divide(baseline, 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100))
            .doubleValue();
    }

    private void applyFulfillmentStatus(Order order, FulfillmentStatus next) {
        if (next == FulfillmentStatus.READY_FOR_PICKUP && !"pickup".equalsIgnoreCase(order.getDeliveryMethod())) {
            throw new RuntimeException("READY_FOR_PICKUP is only valid for pickup delivery method");
        }

        order.setFulfillmentStatus(next);
        order.setFulfillmentUpdatedAt(LocalDateTime.now());

        if (next == FulfillmentStatus.READY_FOR_PICKUP && order.getPickupReadyNotifiedAt() == null) {
            String email = order.getUser() != null ? order.getUser().getEmail() : null;
            if (email != null && !email.isBlank()) {
                notificationService.send(
                        email,
                        "Your order is ready for pickup",
                        "Your order " + order.getOrderNumber() + " is ready for pickup."
                );
                order.setPickupReadyNotifiedAt(LocalDateTime.now());
            }
        }
    }
}
