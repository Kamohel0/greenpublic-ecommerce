package com.greenpublic.ecommerce.dto.admin;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for admin dashboard statistics
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminStatsDTO {
    
    private Long totalOrders;
    private Long pendingOrders;
    private Long completedOrders;
    private Long cancelledOrders;
    
    private Long paidOrders;
    private Long unpaidOrders;
    
    private Long ordersToShip;
    private Long ordersShipped;
    private Long ordersDelivered;
    
    private Long deliveryOrders;
    private Long pickupOrders;
    
    private BigDecimal totalRevenue;
    private BigDecimal todayRevenue;
    private BigDecimal monthRevenue;
    private BigDecimal yesterdayRevenue;
    private BigDecimal lastMonthRevenue;
    private BigDecimal netRevenue;
    private BigDecimal averageOrderValue;

    private Double revenueVsYesterdayPercent;
    private Double revenueVsLastMonthPercent;
    private Double refundRatePercent;
    private Double repeatPurchaseRatePercent;

    private Long todayOrders;
    private Long paymentFailedOrders;
    private Long refundedPaymentOrders;
    private Long pendingPaymentOrders;
    private Long packagingBacklog;
    private Long readyForDispatch;

    private Long newCustomersThisMonth;
    private Long returningCustomersThisMonth;
    
    private Long totalCustomers;
    private Long activeCustomers;
}
