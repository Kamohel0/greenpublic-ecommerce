package com.greenpublic.ecommerce.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.greenpublic.ecommerce.entity.Review;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    boolean existsByUserIdAndProductId(Long userId, Long productId);

    
    // Fetch a review by user ID and product ID
    Optional<Review> findByUserIdAndProductId(Long userId, Long productId);
    
    // Fetch all reviews for a specific product
    List<Review> findByProductId(Long productId);
}
