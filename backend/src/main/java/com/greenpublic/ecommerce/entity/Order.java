package com.greenpublic.ecommerce.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

import com.greenpublic.ecommerce.entity.enums.PaymentStatus;
import com.greenpublic.ecommerce.entity.enums.ShippingStatus;
import com.greenpublic.ecommerce.entity.enums.PaymentMethod;
import com.greenpublic.ecommerce.entity.enums.FulfillmentStatus;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Setter;
import lombok.Getter;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.JoinColumn;

@Getter
@Setter
@Entity
@Table(name = "orders")
public class Order {

       public enum OrderStatus {
    PENDING,
    CANCELLED,
    COMPLETED,
    PAID,
    REFUNDED,
    REFUND_FAILED
}

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String orderNumber; // Customer-facing

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "guest_email")
    private String guestEmail;

    private BigDecimal totalAmount;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.PENDING; // Use enum directly


    private LocalDateTime createdAt = LocalDateTime.now();




     // Link to shipping address
    @ManyToOne
    @JoinColumn(name = "address_id")
    private Address shippingAddress;

    private LocalDateTime updatedAt;
    private LocalDateTime paidAt;
   @Column(nullable = false)
    private LocalDateTime reservationExpiresAt;

     @Column(nullable = false)
    private boolean isReserved  = false;

    // Order items
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> orderItems;

      // Order items
    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private YocoCheckouts yocoCheckout;

    @Version
    private Long version;

    // ============= NEW PRODUCTION FIELDS =============

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "shipping_status", nullable = false)
    private ShippingStatus shippingStatus = ShippingStatus.NOT_SHIPPED;

    @Enumerated(EnumType.STRING)
    @Column(name = "fulfillment_status", nullable = false)
    private FulfillmentStatus fulfillmentStatus = FulfillmentStatus.PLACED;

    @Column(name = "fulfillment_updated_at")
    private LocalDateTime fulfillmentUpdatedAt;

    @Column(name = "pickup_ready_notified_at")
    private LocalDateTime pickupReadyNotifiedAt;

    @Column(name = "tracking_number")
    private String trackingNumber;

    @Column(name = "internal_notes", columnDefinition = "TEXT")
    private String internalNotes;

    @Column(name = "customer_notes", columnDefinition = "TEXT")
    private String customerNotes;

    @Column(name = "last_modified_at")
    private LocalDateTime lastModifiedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PaymentMethod paymentMethod = PaymentMethod.YOCO;

    @Column(name = "payment_gateway_id")
    private String paymentGatewayId;

    @Column(name = "shipping_cost", precision = 12, scale = 2)
    private BigDecimal shippingCost = BigDecimal.ZERO;

    @Column(name = "delivery_method", nullable = false)
    private String deliveryMethod = "delivery"; // 'delivery' or 'pickup'

    @Column(name = "tax_amount", precision = 12, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "discount_amount", precision = 12, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "sub_total", precision = 12, scale = 2)
    private BigDecimal subTotal = BigDecimal.ZERO;

    // ============= RELATIONSHIPS =============

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PaymentTransaction> paymentTransactions = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Refund> refunds = new ArrayList<>();


@PrePersist
public void assignOrderNumber() {
    if (this.orderNumber == null) {
        // Last 7 digits of timestamp in seconds
        long timestamp = System.currentTimeMillis() / 1000 % 10000000;
        // 3-digit random number
        int randomSuffix = ThreadLocalRandom.current().nextInt(100, 1000);
        // Combine into 10-digit number
        String numericPart = String.format("%07d%03d", timestamp, randomSuffix);
        // Add prefix
        this.orderNumber = "ORD-" + numericPart;
    }

    if (this.fulfillmentUpdatedAt == null) {
        this.fulfillmentUpdatedAt = LocalDateTime.now();
    }
}

    @PreUpdate
    public void preUpdate() {
        this.lastModifiedAt = LocalDateTime.now();
    }

}
