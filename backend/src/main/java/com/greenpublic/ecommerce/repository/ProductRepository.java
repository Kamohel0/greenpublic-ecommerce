package com.greenpublic.ecommerce.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.greenpublic.ecommerce.entity.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByIsActive(boolean isActive);
    List<Product> findByIsActiveAndNameContainingIgnoreCase(boolean isActive, String name);

    @Query("select p from Product p where p.isActive = true and (p.stockQuantity - p.reservedQuantity) < :threshold order by (p.stockQuantity - p.reservedQuantity) asc")
    List<Product> findLowStockProducts(int threshold);
}
