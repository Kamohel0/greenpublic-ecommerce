package com.greenpublic.ecommerce.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.greenpublic.ecommerce.entity.CartItem;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
}
