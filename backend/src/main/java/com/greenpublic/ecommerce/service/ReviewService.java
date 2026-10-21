package com.greenpublic.ecommerce.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.greenpublic.ecommerce.entity.Review;
import com.greenpublic.ecommerce.entity.User;
import com.greenpublic.ecommerce.exception.InvalidReviewException;
import com.greenpublic.ecommerce.exception.ProductNotFoundException;
import com.greenpublic.ecommerce.exception.UserNotFoundException;
import com.greenpublic.ecommerce.dto.ReviewDTO;
import com.greenpublic.ecommerce.dto.ReviewRequest;
import com.greenpublic.ecommerce.entity.Product;
import com.greenpublic.ecommerce.repository.ReviewRepository;
import com.greenpublic.ecommerce.repository.UserRepository;
import com.greenpublic.ecommerce.repository.ProductRepository;

import jakarta.transaction.Transactional;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public ReviewService(ReviewRepository reviewRepository, UserRepository userRepository, ProductRepository productRepository) {
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public ReviewDTO saveOrUpdateReview(ReviewRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new UserNotFoundException("User not found with email: " + userEmail));

        Product product = productRepository.findById(request.getProductId())
            .orElseThrow(() -> new ProductNotFoundException("Product not found with ID: " + request.getProductId()));

        if (request.getRating() < 1 || request.getRating() > 5) {
            throw new InvalidReviewException("Rating must be between 1 and 5");
        }

        // Check if the review already exists
        Review review = reviewRepository.findByUserIdAndProductId(user.getId(), product.getId())
                .orElse(Review.builder()
                        .user(user)
                        .product(product)
                        .createdAt(LocalDateTime.now())
                        .build());

        // Update review details
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setCreatedAt(LocalDateTime.now());

        Review savedReview = reviewRepository.save(review);

        return mapToResponse(savedReview);
    }

    private ReviewDTO mapToResponse(Review review) {
        ReviewDTO dto = new ReviewDTO();
        dto.setId(review.getId());
        dto.setRating(review.getRating());
        dto.setComment(review.getComment());
        dto.setUserName(review.getUser().getName());
        dto.setCreatedAt(review.getCreatedAt());
        return dto;
    }

    /**
     * Fetch all reviews for a specific product
     */
    public List<ReviewDTO> getReviewsByProductId(Long productId) {
        // Verify product exists
        productRepository.findById(productId)
            .orElseThrow(() -> new ProductNotFoundException("Product not found with ID: " + productId));
        
        return reviewRepository.findByProductId(productId)
            .stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }
}
