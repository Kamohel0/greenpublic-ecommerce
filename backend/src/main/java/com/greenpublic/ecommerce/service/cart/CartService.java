package com.greenpublic.ecommerce.service.cart;

import java.math.BigDecimal;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.retry.annotation.Backoff;

import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;

import com.greenpublic.ecommerce.dto.CartDTO;
import com.greenpublic.ecommerce.dto.CartItemDTO;
import com.greenpublic.ecommerce.entity.Cart;

import com.greenpublic.ecommerce.entity.User;
import com.greenpublic.ecommerce.exception.CartNotFoundException;
import com.greenpublic.ecommerce.exception.InvalidCartOperationException;

import com.greenpublic.ecommerce.exception.UserNotFoundException;
import com.greenpublic.ecommerce.repository.CartItemRepository;
import com.greenpublic.ecommerce.repository.CartRepository;

import com.greenpublic.ecommerce.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CartService {

    private static final Logger logger = LoggerFactory.getLogger(CartService.class);

    @Value("${cart.low-stock-threshold}")
    private int lowStockThreshold;

    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final CartItemRepository cartItemRepository;
    private final ModifyCartService modifyCartService;

    public enum CartAction {
        ADD, SUBTRACT, DELETE;
    
        public static CartAction fromString(String action) {
            try {
                return CartAction.valueOf(action.toUpperCase());
            } catch (Exception e) {
                throw new InvalidCartOperationException("Invalid action. Use 'add', 'subtract', or 'delete'");
            }
        }
    }

    @Transactional
    public Cart modifyCartItemByEmail(String email, Long productId, Integer quantity, String actionStr) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));
        return modifyCartService.modifyCartItem(user.getId(), productId, quantity, CartAction.fromString(actionStr));
    }

    public CartDTO getCartDTOByEmail(String email) {
    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));

    // If no cart exists, start with an empty cart/items
    Cart cart = cartRepository.findByUserId(user.getId()).orElse(null);

    List<CartItemDTO> itemDTOs;
    if (cart == null || cart.getItems() == null || cart.getItems().isEmpty()) {
        itemDTOs = List.of();
    } else {
        itemDTOs = cart.getItems().stream()
                .map(item -> {
                    int availableStock = item.getProduct().getAvailableStock();
                    String lowStockMsg = (availableStock <= lowStockThreshold)
                            ? "Only " + availableStock + " left in stock!"
                            : null;

                    return CartItemDTO.builder()
                            .productId(item.getProduct().getId())
                            .productName(item.getProduct().getName())
                            .productImage(item.getProduct().getImageUrl())
                            .quantity(item.getQuantity())
                            .price(item.getProduct().getPrice())
                            .totalPrice(item.getProduct().getPrice()
                                    .multiply(BigDecimal.valueOf(item.getQuantity())))
                            .addedAt(item.getAddedAt())
                            .lowStockMessage(lowStockMsg)
                            .build();
                })
                .toList();
    }

    BigDecimal total = itemDTOs.stream()
            .map(CartItemDTO::getTotalPrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

    return CartDTO.builder()
            .items(itemDTOs)
            .totalPrice(total)
            .build();
}

   @Retryable(
    retryFor = OptimisticLockingFailureException.class,
    maxAttempts = 3,
    backoff = @Backoff(delay = 50)
)
@Transactional
public void clearCart(String email) {
    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UserNotFoundException("User not found: " + email));

    Cart cart = cartRepository.findByUserId(user.getId())
            .orElseThrow(() -> new CartNotFoundException("Cart not found for user: " + email));

    cartItemRepository.deleteAll(cart.getItems());
    cart.getItems().clear();
    cartRepository.save(cart);

    logger.info("Cleared all items from cart for user {}", email);
}

}
