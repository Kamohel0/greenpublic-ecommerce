package com.greenpublic.ecommerce.service;

import com.greenpublic.ecommerce.dto.ReviewDTO;
import com.greenpublic.ecommerce.dto.product.OnCreate;
import com.greenpublic.ecommerce.dto.product.OnUpdate;
import com.greenpublic.ecommerce.dto.product.ProductRequest;
import com.greenpublic.ecommerce.dto.product.ProductResponse;
import com.greenpublic.ecommerce.entity.Category;
import com.greenpublic.ecommerce.entity.Product;
import com.greenpublic.ecommerce.exception.CategoryNotFoundException;
import com.greenpublic.ecommerce.exception.ProductNotFoundException;
import com.greenpublic.ecommerce.repository.CategoryRepository;
import com.greenpublic.ecommerce.repository.ProductRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {


    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final FileStorageService fileStorageService;

   @Transactional
public Product createProduct(@Validated(OnCreate.class) ProductRequest dto) throws IOException {
    Product product = new Product();
    product.setActive(true);
    return persistProduct(dto, product, false);
}

@Transactional
public Product updateProduct(@Validated(OnUpdate.class) ProductRequest dto) throws IOException {
    Product product = productRepository.findById(dto.getId())
            .orElseThrow(() -> new ProductNotFoundException("Product with ID " + dto.getId() + " not found."));
    return persistProduct(dto, product, true);
}

private Product persistProduct(ProductRequest dto, Product product, boolean isUpdate) throws IOException {
    // Category required only on create
    if (!isUpdate || dto.getCategoryName() != null) {
        Category category = categoryRepository.findByNameIgnoreCase(dto.getCategoryName())
                .orElseThrow(() -> new CategoryNotFoundException(dto.getCategoryName()));
        product.setCategory(category);
    }

    if (dto.getName() != null) product.setName(dto.getName());
    if (dto.getDescription() != null) product.setDescription(dto.getDescription());
    if (dto.getPrice() != null) product.setPrice(dto.getPrice());
    if (dto.getStockQuantity() != null) product.setStockQuantity(dto.getStockQuantity());
    if (dto.getWeight() != null) product.setWeight(dto.getWeight());

    MultipartFile file = dto.getFile();
    if (file != null && !file.isEmpty()) {
        String newImageUrl = fileStorageService.storeImage(file);

        if (isUpdate && product.getImageUrl() != null) {
            fileStorageService.deleteImageIfLocal(product.getImageUrl());
        }
        product.setImageUrl(newImageUrl);
    }

    return productRepository.save(product);
}


    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException("Product with ID " + id + " not found."));

        // Soft delete
        product.setActive(false);
        productRepository.save(product);

        // Optional: also remove image file on soft delete (often you keep it to allow restore)
        // deleteOldImageIfLocal(product.getImageUrl());
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getActiveProductsByName(String name) {
        List<Product> products = (name == null || name.isBlank())
                ? productRepository.findByIsActive(true)
                : productRepository.findByIsActiveAndNameContainingIgnoreCase(true, name);

        return products.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

     @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException("Product not found with id: " + id));
        return mapToDTO(product);
    }

    /* -------------------- Helpers -------------------- */


    public ProductResponse mapToDTO(Product product) {
        ProductResponse dto = new ProductResponse();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setPrice(product.getPrice());
        dto.setStockQuantity(product.getStockQuantity());
        dto.setReservedQuantity(product.getReservedQuantity());
        dto.setAvailableStock(product.getAvailableStock());
        dto.setLowStock(product.getAvailableStock() < 10);
        dto.setImageUrl(product.getImageUrl());
        dto.setWeight(product.getWeight());
        dto.setActive(product.isActive());
        dto.setCreatedAt(product.getCreatedAt());
        dto.setUpdatedAt(product.getUpdatedAt());

        // Flatten category to string for frontend consistency
        Category cat = product.getCategory();
        dto.setCategory(cat != null ? cat.getName() : null);

        List<ReviewDTO> reviews = product.getReviews().stream().map(review -> {
            ReviewDTO r = new ReviewDTO();
            r.setId(review.getId());
            r.setRating(review.getRating());
            r.setComment(review.getComment());
            r.setCreatedAt(review.getCreatedAt());
            r.setUserName(review.getUser() != null ? review.getUser().getName() : "Anonymous");
            return r;
        }).collect(Collectors.toList());

        dto.setReviews(reviews);
        return dto;
    }

     
}
