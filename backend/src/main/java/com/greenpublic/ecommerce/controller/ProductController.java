package com.greenpublic.ecommerce.controller;


import com.greenpublic.ecommerce.dto.product.OnCreate;
import com.greenpublic.ecommerce.dto.product.OnUpdate;
import com.greenpublic.ecommerce.dto.product.ProductRequest;
import com.greenpublic.ecommerce.dto.product.ProductResponse;
import com.greenpublic.ecommerce.entity.Product;
import com.greenpublic.ecommerce.service.ProductService;

import jakarta.validation.groups.Default;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

     @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

   @GetMapping
public ResponseEntity<List<ProductResponse>> getProducts(@RequestParam(value = "name", required = false) String name) {
    List<ProductResponse> products = productService.getActiveProductsByName(name);
    return ResponseEntity.ok(products);
}

@PreAuthorize("hasAnyRole('ADMIN','OWNER')")
@PostMapping("/create")
    public ResponseEntity<ProductResponse> createProduct(
            @Validated({OnCreate.class, Default.class}) @ModelAttribute ProductRequest dto
    ) throws IOException {
        Product saved = productService.createProduct(dto);
        return ResponseEntity.ok(productService.mapToDTO(saved));
    }

    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    @PutMapping("/update/{id}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id,
            @Validated({OnUpdate.class, Default.class}) @ModelAttribute ProductRequest dto
    ) throws IOException {
        dto.setId(id);
        Product updated = productService.updateProduct(dto);
        return ResponseEntity.ok(productService.mapToDTO(updated));
    }

      @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
      @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

}
