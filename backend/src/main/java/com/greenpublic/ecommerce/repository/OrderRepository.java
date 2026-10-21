package com.greenpublic.ecommerce.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.greenpublic.ecommerce.entity.Order;
import com.greenpublic.ecommerce.entity.Order.OrderStatus;
import com.greenpublic.ecommerce.entity.enums.PaymentStatus;

public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {
    List<Order> findByUserId(Long userId);
  
    /**
     * Find all orders with a given status that have expired reservations.
     */
    List<Order> findAllByStatusAndReservationExpiresAtBefore(OrderStatus status, LocalDateTime before);

      // Page only IDs for lightweight paging
    @Query("select o.id " +
           "from Order o " +
           "where o.status = :status and o.reservationExpiresAt <= :cutoff")
    Page<Long> findExpiredReservationIds(@Param("status") OrderStatus status,
                                         @Param("cutoff") LocalDateTime cutoff,
                                         Pageable pageable);

    // Fetch graph (items + products) for a batch of orders
    @EntityGraph(attributePaths = {"orderItems", "orderItems.product"})
    List<Order> findAllByIdIn(List<Long> ids);

    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);
     Page<Order> findByUserId(Long userId, Pageable pageable);   // for pagination
    List<Order> findByUserIdAndStatusNotOrderByCreatedAtDesc(Long userId, OrderStatus status);
    Page<Order> findByUserIdAndStatusNot(Long userId, OrderStatus status, Pageable pageable);

    List<Order> findByUserIdAndPaymentStatusOrderByCreatedAtDesc(Long userId, PaymentStatus paymentStatus);
    Page<Order> findByUserIdAndPaymentStatus(Long userId, PaymentStatus paymentStatus, Pageable pageable);

    List<Order> findByGuestEmailIgnoreCaseAndUserIsNull(String guestEmail);
}
