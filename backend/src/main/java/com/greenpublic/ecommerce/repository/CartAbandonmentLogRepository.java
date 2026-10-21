package com.greenpublic.ecommerce.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.greenpublic.ecommerce.entity.CartAbandonmentLog;

/**
 * Repository for CartAbandonmentLog entity.
 * Handles all database operations for abandoned cart tracking.
 */
@Repository
public interface CartAbandonmentLogRepository extends JpaRepository<CartAbandonmentLog, Long> {

    /**
     * Find abandoned carts for a specific user
     */
    List<CartAbandonmentLog> findByUserId(Long userId);

    /**
     * Find abandoned carts within a date range
     */
    List<CartAbandonmentLog> findByAbandonedAtBetween(LocalDateTime start, LocalDateTime end);

    /**
     * Find carts not yet recovered
     */
    @Query("SELECT cal FROM CartAbandonmentLog cal WHERE cal.recovered = false ORDER BY cal.abandonedAt DESC")
    List<CartAbandonmentLog> findUnrecoveredCarts();

    /**
     * Find carts where recovery email hasn't been sent yet
     */
    @Query("SELECT cal FROM CartAbandonmentLog cal WHERE cal.recoveryEmailSentAt IS NULL ORDER BY cal.abandonedAt ASC")
    List<CartAbandonmentLog> findCartsNeedingRecoveryEmail();

    /**
     * Find high-value abandoned carts (for prioritized recovery)
     */
    @Query("SELECT cal FROM CartAbandonmentLog cal WHERE cal.recovered = false AND cal.cartValue >= :minValue ORDER BY cal.cartValue DESC")
    List<CartAbandonmentLog> findHighValueAbandonedCarts(@Param("minValue") java.math.BigDecimal minValue);

    /**
     * Count total abandoned carts
     */
    long countByRecovered(boolean recovered);

    /**
     * Calculate total value of unrecovered carts
     */
    @Query("SELECT COALESCE(SUM(cal.cartValue), 0) FROM CartAbandonmentLog cal WHERE cal.recovered = false")
    java.math.BigDecimal getTotalAbandonedValue();

    /**
     * Find recovery success rate
     */
    @Query("SELECT COUNT(cal) FROM CartAbandonmentLog cal WHERE cal.recovered = true")
    long countRecoveredCarts();

    /**
     * Find recently abandoned carts (last 24 hours)
     */
    @Query("SELECT cal FROM CartAbandonmentLog cal WHERE cal.abandonedAt >= :since AND cal.recovered = false ORDER BY cal.cartValue DESC")
    List<CartAbandonmentLog> findRecentAbandonedCarts(@Param("since") LocalDateTime since);

    /**
     * Find carts abandoned by specific user in last N days
     */
    @Query("SELECT cal FROM CartAbandonmentLog cal WHERE cal.user.id = :userId AND cal.abandonedAt >= :since ORDER BY cal.abandonedAt DESC")
    List<CartAbandonmentLog> findUserRecentAbandonment(@Param("userId") Long userId, @Param("since") LocalDateTime since);
}
