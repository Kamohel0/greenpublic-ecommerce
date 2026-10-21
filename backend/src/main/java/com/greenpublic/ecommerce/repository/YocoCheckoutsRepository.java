package com.greenpublic.ecommerce.repository;


import org.springframework.data.jpa.repository.JpaRepository;

import com.greenpublic.ecommerce.entity.YocoCheckouts;

public interface YocoCheckoutsRepository extends JpaRepository<YocoCheckouts, Long> {
   
}

