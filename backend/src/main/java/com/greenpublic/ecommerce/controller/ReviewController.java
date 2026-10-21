package com.greenpublic.ecommerce.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;


import com.greenpublic.ecommerce.dto.ReviewDTO;
import com.greenpublic.ecommerce.dto.ReviewRequest;

import com.greenpublic.ecommerce.service.ReviewService;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    /**
     * Get all reviews for a specific product
     */
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ReviewDTO>> getReviewsByProduct(@PathVariable Long productId) {
        List<ReviewDTO> reviews = reviewService.getReviewsByProductId(productId);
        return ResponseEntity.ok(reviews);
    }

    /**
     * Create or update a review for a product
     */
    @PostMapping("/create")
    public ResponseEntity<ReviewDTO> saveOrUpdateReview(
            @RequestBody ReviewRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ReviewDTO reviewDTO = reviewService.saveOrUpdateReview(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewDTO);
    }
}
