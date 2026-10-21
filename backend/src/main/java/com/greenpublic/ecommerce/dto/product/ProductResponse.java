package com.greenpublic.ecommerce.dto.product;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.greenpublic.ecommerce.dto.ReviewDTO;

@Data
public class ProductResponse {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private int stockQuantity;
    private int reservedQuantity;
    private int availableStock;
    private boolean lowStock;
    
    // Use "image" for frontend consistency, map from "imageUrl" entity field
    @JsonProperty("image")
    private String imageUrl;
    
    private String weight;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Flatten category to string for frontend simplicity
    private String category;
    
    private List<ReviewDTO> reviews;
}

