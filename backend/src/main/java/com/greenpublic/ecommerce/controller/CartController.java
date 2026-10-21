package com.greenpublic.ecommerce.controller;

import com.greenpublic.ecommerce.dto.AddToCartRequest;
import com.greenpublic.ecommerce.dto.CartDTO;
import com.greenpublic.ecommerce.service.cart.CartService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for handling shopping cart operations.
 */
@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    /**
     * Modify the user’s cart (add, subtract, delete item).
     * Supported actions: "add", "subtract", "delete"
     */
    @PostMapping("/modify")
    public ResponseEntity<String> modifyCart(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody AddToCartRequest request) {

        String email = userDetails.getUsername();

            cartService.modifyCartItemByEmail(email, request.getProductId(), request.getQuantity(), request.getAction());

            String message;
            switch (request.getAction().toLowerCase()) {
                case "add":
                    message = "Item(s) added to cart successfully.";
                    break;
                case "subtract":
                    message = "Item(s) subtracted from cart successfully.";
                    break;
                case "delete":
                    message = "Item deleted from cart successfully.";
                    break;
                default:
                    message = "Invalid action. Allowed actions: add, subtract, delete.";
            }

            return ResponseEntity.ok(message);
    }

    /**
     * Get the current user’s cart.
     */
    @GetMapping("/view")
    public ResponseEntity<CartDTO> getCart(@AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails.getUsername();
        CartDTO cart = cartService.getCartDTOByEmail(email);
        return ResponseEntity.ok(cart);
    }

    /**
     * Clear the user’s entire cart.
     */
    @DeleteMapping("/clear")
    public ResponseEntity<String> clearCart(@AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails.getUsername();
        cartService.clearCart(email);
        return ResponseEntity.ok("Cart cleared successfully.");
    }
}
