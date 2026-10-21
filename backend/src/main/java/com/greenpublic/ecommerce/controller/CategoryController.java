package com.greenpublic.ecommerce.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.greenpublic.ecommerce.entity.Category;
import com.greenpublic.ecommerce.service.CategoryService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;


    @PostMapping("/create")
    public ResponseEntity<Category> createCategory(@RequestBody Category category) {

        // Logic to create a category
        Category newCategory = categoryService.saveCategory(category);
        
        return ResponseEntity.ok(newCategory);
    }
    

}
