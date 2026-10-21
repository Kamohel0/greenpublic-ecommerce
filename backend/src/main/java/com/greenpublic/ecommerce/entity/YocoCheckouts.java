package com.greenpublic.ecommerce.entity;

import java.time.LocalDateTime;



import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import lombok.NoArgsConstructor;

import jakarta.persistence.OneToOne;
import jakarta.persistence.JoinColumn;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "yoco_checkouts")
public class YocoCheckouts {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "order_id")
    private Order order;

    private String yocoCheckoutId;

    private String yocoCheckoutUrl; 

    private LocalDateTime createdAt;

}
