package com.greenpublic.ecommerce.dto.admin;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OwnerOverviewDTO {
    private AdminStatsDTO stats;
    private List<InventoryItemDTO> inventory;
    private List<InventoryItemDTO> lowStockItems;
}
