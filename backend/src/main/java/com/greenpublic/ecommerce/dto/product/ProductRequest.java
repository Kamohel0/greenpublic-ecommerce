package com.greenpublic.ecommerce.dto.product;

import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;

import org.springframework.web.multipart.MultipartFile;
import java.math.BigDecimal;

@Builder
@Data
public class ProductRequest {

    @Null(groups = OnCreate.class, message = "Product ID should be null for creation")
    @NotNull(groups = OnUpdate.class, message = "Product ID cannot be null for update")
    private Long id;

    @NotBlank(groups = OnCreate.class, message = "Product name cannot be blank")
    private String name;

    private String description;

    @NotNull(groups = OnCreate.class, message = "Price cannot be null")
    @PositiveOrZero(message = "Price must be zero or positive")
    private BigDecimal price;

    @NotNull(groups = OnCreate.class, message = "Stock quantity cannot be null")
    @PositiveOrZero(message = "Stock quantity must be zero or positive")
    private Integer stockQuantity;

    private MultipartFile file;

    @NotBlank(groups = OnCreate.class, message = "Category name cannot be blank")
    private String categoryName;

    private String weight;

    // Getters & setters omitted for brevity
}

