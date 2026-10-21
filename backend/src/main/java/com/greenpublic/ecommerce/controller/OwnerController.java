package com.greenpublic.ecommerce.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.greenpublic.ecommerce.dto.admin.OwnerOverviewDTO;
import com.greenpublic.ecommerce.service.admin.AdminService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/owner")
@RequiredArgsConstructor
@PreAuthorize("hasRole('OWNER')")
public class OwnerController {

    private final AdminService adminService;

    @GetMapping("/overview")
    public ResponseEntity<OwnerOverviewDTO> getOverview() {
        OwnerOverviewDTO overview = OwnerOverviewDTO.builder()
                .stats(adminService.getDashboardStats())
                .inventory(adminService.getInventoryOverview(false))
                .lowStockItems(adminService.getInventoryOverview(true))
                .build();
        return ResponseEntity.ok(overview);
    }
}
