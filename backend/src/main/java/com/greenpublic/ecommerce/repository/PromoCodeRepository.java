package com.greenpublic.ecommerce.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.greenpublic.ecommerce.entity.PromoCode;

/**
 * Repository for PromoCode entity.
 * Handles all database operations for promotional code records.
 */
@Repository
public interface PromoCodeRepository extends JpaRepository<PromoCode, Long> {

    /**
     * Find a promo code by its code string
     */
    Optional<PromoCode> findByCode(String code);

    /**
     * Find all active promo codes
     */
    List<PromoCode> findByIsActive(boolean isActive);

    /**
     * Find valid promo codes (within validity window and active)
     */
    @Query("SELECT p FROM PromoCode p WHERE p.isActive = true AND p.validFrom <= :now AND p.validUntil >= :now")
    List<PromoCode> findValidPromoCodes(@Param("now") LocalDateTime now);

    /**
     * Find expired promo codes
     */
    @Query("SELECT p FROM PromoCode p WHERE p.validUntil < :now")
    List<PromoCode> findExpiredPromoCodes(@Param("now") LocalDateTime now);

    /**
     * Find upcoming promo codes (not yet valid)
     */
    @Query("SELECT p FROM PromoCode p WHERE p.validFrom > :now ORDER BY p.validFrom ASC")
    List<PromoCode> findUpcomingPromoCodes(@Param("now") LocalDateTime now);

    /**
     * Check if a promo code exists and is valid
     */
    @Query("SELECT COUNT(p) > 0 FROM PromoCode p WHERE p.code = :code AND p.isActive = true AND p.validFrom <= :now AND p.validUntil >= :now")
    boolean isCodeValid(@Param("code") String code, @Param("now") LocalDateTime now);

    /**
     * Check if a promo code has usage limit remaining
     */
    @Query("SELECT CASE WHEN p.usageLimit IS NULL THEN true ELSE p.usageCount < p.usageLimit END FROM PromoCode p WHERE p.code = :code")
    boolean hasUsageRemaining(@Param("code") String code);

    /**
     * Find promo codes that are almost exhausted
     */
    @Query("SELECT p FROM PromoCode p WHERE p.usageLimit IS NOT NULL AND (p.usageCount * 100 / p.usageLimit) >= 90")
    List<PromoCode> findAlmostExhaustedCodes();
}
