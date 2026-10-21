package com.greenpublic.ecommerce.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.greenpublic.ecommerce.entity.Cart;

public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByUserId(Long userId);

   
  @Query("SELECT DISTINCT c FROM Cart c JOIN FETCH c.items i WHERE i.product.id = :productId")
List<Cart> findCartsByProductId(@Param("productId") Long productId);

 @Query("""
           SELECT c FROM Cart c
           LEFT JOIN FETCH c.items ci
           LEFT JOIN FETCH ci.product p
           WHERE c.user.id = :userId
           """)
    Optional<Cart> findByUserIdWithItems(@Param("userId") Long userId);


}
