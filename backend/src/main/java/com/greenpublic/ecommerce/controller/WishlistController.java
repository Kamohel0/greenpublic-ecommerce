package com.greenpublic.ecommerce.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.greenpublic.ecommerce.dto.WishlistItemDTO;
import com.greenpublic.ecommerce.service.WishlistService;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    @GetMapping
    public ResponseEntity<List<WishlistItemDTO>> getWishlist(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<WishlistItemDTO> items = wishlistService.getWishlist(userDetails.getUsername());
        return ResponseEntity.ok(items);
    }

    @PostMapping("/add/{productId}")
    public ResponseEntity<WishlistItemDTO> addToWishlist(
            @PathVariable Long productId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        WishlistItemDTO item = wishlistService.addToWishlist(userDetails.getUsername(), productId);
        return ResponseEntity.ok(item);
    }

    @DeleteMapping("/remove/{productId}")
    public ResponseEntity<String> removeFromWishlist(
            @PathVariable Long productId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        wishlistService.removeFromWishlist(userDetails.getUsername(), productId);
        return ResponseEntity.ok("Removed from wishlist.");
    }

    @GetMapping("/check/{productId}")
    public ResponseEntity<Boolean> isInWishlist(
            @PathVariable Long productId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        boolean exists = wishlistService.isInWishlist(userDetails.getUsername(), productId);
        return ResponseEntity.ok(exists);
    }
}
