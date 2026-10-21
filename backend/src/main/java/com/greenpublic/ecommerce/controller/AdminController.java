package com.greenpublic.ecommerce.controller;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.greenpublic.ecommerce.dto.admin.AdminOrderDTO;
import com.greenpublic.ecommerce.dto.admin.AdminStatsDTO;
import com.greenpublic.ecommerce.dto.admin.InventoryItemDTO;
import com.greenpublic.ecommerce.dto.admin.OrderStatusUpdateRequest;
import com.greenpublic.ecommerce.service.admin.AdminService;

import lombok.RequiredArgsConstructor;

/**
 * Admin Controller for managing orders and viewing statistics.
 * All endpoints require ADMIN role.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','OWNER')")
public class AdminController {

    private final AdminService adminService;

    /**
     * Get dashboard statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDTO> getDashboardStats() {
        AdminStatsDTO stats = adminService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * Get all orders with pagination and filtering
     */
    @GetMapping("/orders")
    public ResponseEntity<Page<AdminOrderDTO>> getAllOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) String shippingStatus,
            @RequestParam(required = false) String fulfillmentStatus,
            @RequestParam(required = false) String deliveryMethod,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        
        Page<AdminOrderDTO> orders = adminService.getAllOrders(
            status, paymentStatus, shippingStatus, fulfillmentStatus, deliveryMethod, search, page, size, sortBy, sortDirection
        );
        return ResponseEntity.ok(orders);
    }

    /**
     * Get order details by ID
     */
    @GetMapping("/orders/{orderId}")
    public ResponseEntity<AdminOrderDTO> getOrderById(@PathVariable Long orderId) {
        AdminOrderDTO order = adminService.getOrderById(orderId);
        return ResponseEntity.ok(order);
    }

    /**
     * Update order status
     */
    @PutMapping("/orders/{orderId}/status")
    public ResponseEntity<AdminOrderDTO> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestBody OrderStatusUpdateRequest request) {
        AdminOrderDTO updatedOrder = adminService.updateOrderStatus(orderId, request);
        return ResponseEntity.ok(updatedOrder);
    }

    /**
     * Update shipping status and tracking number
     */
    @PutMapping("/orders/{orderId}/shipping")
    public ResponseEntity<AdminOrderDTO> updateShippingInfo(
            @PathVariable Long orderId,
            @RequestParam String shippingStatus,
            @RequestParam(required = false) String trackingNumber) {
        AdminOrderDTO updatedOrder = adminService.updateShippingInfo(orderId, shippingStatus, trackingNumber);
        return ResponseEntity.ok(updatedOrder);
    }

    /**
     * Add internal notes to an order
     */
    @PutMapping("/orders/{orderId}/notes")
    public ResponseEntity<AdminOrderDTO> addInternalNotes(
            @PathVariable Long orderId,
            @RequestBody String notes) {
        AdminOrderDTO updatedOrder = adminService.addInternalNotes(orderId, notes);
        return ResponseEntity.ok(updatedOrder);
    }

    @PutMapping("/orders/{orderId}/ready-for-pickup")
    public ResponseEntity<AdminOrderDTO> markReadyForPickup(@PathVariable Long orderId) {
        AdminOrderDTO updatedOrder = adminService.markReadyForPickup(orderId);
        return ResponseEntity.ok(updatedOrder);
    }

    @GetMapping("/inventory")
    public ResponseEntity<java.util.List<InventoryItemDTO>> getInventoryOverview(
            @RequestParam(defaultValue = "false") boolean lowStockOnly) {
        return ResponseEntity.ok(adminService.getInventoryOverview(lowStockOnly));
    }

    @PutMapping("/inventory/{productId}")
    public ResponseEntity<InventoryItemDTO> updateInventoryStock(
            @PathVariable Long productId,
            @RequestParam Integer stockQuantity) {
        return ResponseEntity.ok(adminService.updateInventoryQuantity(productId, stockQuantity));
    }
}
