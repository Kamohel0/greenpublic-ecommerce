package com.greenpublic.ecommerce.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.greenpublic.ecommerce.dto.WishlistItemDTO;
import com.greenpublic.ecommerce.entity.Product;
import com.greenpublic.ecommerce.entity.User;
import com.greenpublic.ecommerce.entity.WishlistItem;
import com.greenpublic.ecommerce.exception.ProductNotFoundException;
import com.greenpublic.ecommerce.exception.UserNotFoundException;
import com.greenpublic.ecommerce.repository.ProductRepository;
import com.greenpublic.ecommerce.repository.UserRepository;
import com.greenpublic.ecommerce.repository.WishlistItemRepository;

import jakarta.transaction.Transactional;

@Service
public class WishlistService {

    private final WishlistItemRepository wishlistItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public WishlistService(
            WishlistItemRepository wishlistItemRepository,
            UserRepository userRepository,
            ProductRepository productRepository
    ) {
        this.wishlistItemRepository = wishlistItemRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    public List<WishlistItemDTO> getWishlist(String userEmail) {
        User user = getUserByEmail(userEmail);
        return wishlistItemRepository.findByUserId(user.getId())
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public WishlistItemDTO addToWishlist(String userEmail, Long productId) {
        User user = getUserByEmail(userEmail);
        Product product = getProductById(productId);

        WishlistItem item = wishlistItemRepository
                .findByUserIdAndProductId(user.getId(), product.getId())
                .orElseGet(() -> wishlistItemRepository.save(
                        WishlistItem.builder()
                                .user(user)
                                .product(product)
                                .build()
                ));

        return mapToDTO(item);
    }

    @Transactional
    public void removeFromWishlist(String userEmail, Long productId) {
        User user = getUserByEmail(userEmail);
        wishlistItemRepository.deleteByUserIdAndProductId(user.getId(), productId);
    }

    public boolean isInWishlist(String userEmail, Long productId) {
        User user = getUserByEmail(userEmail);
        return wishlistItemRepository.existsByUserIdAndProductId(user.getId(), productId);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));
    }

    private Product getProductById(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException("Product not found with ID: " + productId));
    }

    private WishlistItemDTO mapToDTO(WishlistItem item) {
        WishlistItemDTO dto = new WishlistItemDTO();
        dto.setId(item.getId());
        dto.setProductId(item.getProduct().getId());
        dto.setName(item.getProduct().getName());
        dto.setPrice(item.getProduct().getPrice());
        dto.setProductImage(item.getProduct().getImageUrl());
        dto.setAddedAt(item.getAddedAt());
        return dto;
    }
}
