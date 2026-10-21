// package com.greenpublic.ecommerce.service;

// import java.util.List;
// import java.util.stream.Collectors;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.scheduling.annotation.Scheduled;
// import org.springframework.stereotype.Service;

// import com.greenpublic.ecommerce.entity.Product;
// import com.greenpublic.ecommerce.repository.CartRepository;
// import com.greenpublic.ecommerce.repository.ProductRepository;

// @Service
// public class ReservationCleanupScheduler {

//     @Autowired
//     private ProductRepository productRepository;

//     @Autowired
//     private CartRepository cartRepository;

//     @Autowired
//     private CartService cartService;

//     // Runs every 30 minutes
//     @Scheduled(cron = "0 0/5 * * * ?")
//     public void cleanupExpiredReservationsForLowStockProducts() {
//         System.out.println("Running reservation cleanup...");

//         List<Product> lowStockProducts = productRepository.findAll().stream()
//                 .filter(p -> p.getStockQuantity() < 10000)
//                 .collect(Collectors.toList());

//         for (Product product : lowStockProducts) {
//             cartService.releaseExpiredReservationsForProduct(product);
//         }

//         System.out.println("Reservation cleanup completed.");
//     }
// }

