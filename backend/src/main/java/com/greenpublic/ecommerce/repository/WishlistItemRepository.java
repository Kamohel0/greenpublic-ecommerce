package com.greenpublic.ecommerce.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.greenpublic.ecommerce.entity.WishlistItem;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {
    Optional<WishlistItem> findByUserIdAndProductId(Long userId, Long productId);
    List<WishlistItem> findByUserId(Long userId);
    boolean existsByUserIdAndProductId(Long userId, Long productId);
    void deleteByUserIdAndProductId(Long userId, Long productId);
}
