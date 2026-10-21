package com.greenpublic.ecommerce.dto;


import lombok.Data;
import java.time.LocalDateTime;


@Data
public class ReviewDTO {
    
    private Long id;
    private int rating;
    private String comment;
    private String userName;
    private LocalDateTime createdAt;
}
